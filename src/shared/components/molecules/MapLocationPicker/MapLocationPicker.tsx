/**
 * @file MapLocationPicker.tsx
 * @layer Shared / Molecules
 * @responsibility Production-grade Google Maps interactive pin picker.
 *                 Allows users to slide/pan the map, search Indian localities with Google Places & Nominatim,
 *                 auto-detect GPS with triple-redundancy, auto-reverse geocode with Google Geocoding,
 *                 and expand to full-screen map modal.
 *                 Equipped with strict coordinate deduplication and debounce to prevent repetitive API calls.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
  PermissionsAndroid,
  Modal,
  StatusBar,
  Animated,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, MapType } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { Card } from '@shared/components/atoms/Card';
import { Badge } from '@shared/components/atoms/Badge';
import { Button } from '@shared/components/atoms/Button';
import { spacing, radius, shadows, useTheme } from '@theme/index';
import { ENV } from '@core/config/env';

export interface GeocodedAddressResult {
  latitude: number;
  longitude: number;
  displayName: string;
  houseNo?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
}

export interface MapLocationPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationSelect: (result: GeocodedAddressResult) => void;
  style?: any;
}

// Default fallback coordinate (Udaipur, Rajasthan / Center India)
const DEFAULT_LAT = 24.5854;
const DEFAULT_LNG = 73.7125;
const COORD_DELTA_THRESHOLD = 0.00015; // ~15 meters threshold to prevent micro-drift loops

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

const parseGoogleGeocodeResult = (result: any, targetLat: number, targetLng: number): GeocodedAddressResult => {
  const components: GoogleAddressComponent[] = result.address_components || [];
  const getComp = (type: string) => components.find((c) => c.types.includes(type))?.long_name || '';

  const streetNumber = getComp('street_number');
  const route = getComp('route');
  const sublocality = getComp('sublocality_level_1') || getComp('sublocality') || getComp('neighborhood');
  const city = getComp('locality') || getComp('administrative_area_level_2');
  const state = getComp('administrative_area_level_1');
  const country = getComp('country');
  const pinCode = getComp('postal_code');
  const landmark = getComp('point_of_interest') || getComp('premise') || '';

  const houseNo = streetNumber || '';
  const street = [route, sublocality].filter(Boolean).join(', ');

  return {
    latitude: targetLat,
    longitude: targetLng,
    displayName: result.formatted_address || 'Selected Location',
    houseNo,
    street,
    landmark,
    city,
    state,
    country,
    pinCode,
  };
};

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  initialLatitude,
  initialLongitude,
  onLocationSelect,
  style,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets), [colors, insets]);

  const [lat, setLat] = useState<number>(initialLatitude || DEFAULT_LAT);
  const [lng, setLng] = useState<number>(initialLongitude || DEFAULT_LNG);
  const [addressSummary, setAddressSummary] = useState<string>('');
  const [lastParsedResult, setLastParsedResult] = useState<GeocodedAddressResult | null>(null);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [inlineMapReady, setInlineMapReady] = useState(false);
  const [fullMapReady, setFullMapReady] = useState(false);
  const [mapType, setMapType] = useState<MapType>('standard');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // References to prevent feedback loop and redundant API calls
  const pinLiftAnim = useRef(new Animated.Value(0)).current;
  const inlineMapRef = useRef<MapView>(null);
  const fullMapRef = useRef<MapView>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const regionDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGeocodedCoordsRef = useRef<{ lat: number; lng: number }>({
    lat: initialLatitude || DEFAULT_LAT,
    lng: initialLongitude || DEFAULT_LNG,
  });
  const isProgrammaticMoveRef = useRef<boolean>(false);
  const onLocationSelectRef = useRef(onLocationSelect);
  onLocationSelectRef.current = onLocationSelect;

  // ── Sync initial coordinate updates from parent (Deduplicated) ───────────
  useEffect(() => {
    if (
      initialLatitude &&
      initialLongitude &&
      !isNaN(initialLatitude) &&
      !isNaN(initialLongitude)
    ) {
      const deltaLat = Math.abs(lat - initialLatitude);
      const deltaLng = Math.abs(lng - initialLongitude);

      // Only move if significantly different from current position
      if (deltaLat > COORD_DELTA_THRESHOLD || deltaLng > COORD_DELTA_THRESHOLD) {
        isProgrammaticMoveRef.current = true;
        setLat(initialLatitude);
        setLng(initialLongitude);
        lastGeocodedCoordsRef.current = { lat: initialLatitude, lng: initialLongitude };

        const newRegion = {
          latitude: initialLatitude,
          longitude: initialLongitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        inlineMapRef.current?.animateToRegion(newRegion, 300);
        fullMapRef.current?.animateToRegion(newRegion, 300);
      }
    }
  }, [initialLatitude, initialLongitude, lat, lng]);

  // ── Reverse Geocode Function ──────────────────────────────────────────────
  const reverseGeocode = useCallback(
    async (targetLat: number, targetLng: number, notifyParent = true) => {
      // Deduplication check
      lastGeocodedCoordsRef.current = { lat: targetLat, lng: targetLng };
      try {
        setIsGeocoding(true);

        // 1. Google Geocoding API
        if (ENV.GOOGLE_MAPS_API_KEY) {
          try {
            const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${targetLat},${targetLng}&key=${ENV.GOOGLE_MAPS_API_KEY}`;
            const gRes = await fetch(gUrl);
            const gData = await gRes.json();

            if (gData.status === 'OK' && gData.results && gData.results.length > 0) {
              const firstResult = gData.results[0];
              const parsed = parseGoogleGeocodeResult(firstResult, targetLat, targetLng);
              setAddressSummary(parsed.displayName);
              setLastParsedResult(parsed);
              if (notifyParent) {
                onLocationSelectRef.current(parsed);
              }
              return;
            }
          } catch (_err) {
            // Fall through to Nominatim
          }
        }

        // 2. OpenStreetMap Nominatim Fallback
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}&addressdetails=1`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'EcoSystemCustomerApp/1.0 (smart-sales-platform)' },
        });
        const data = await res.json();

        if (data && data.address) {
          const addr = data.address;
          const fetchedPin = addr.postcode || '';
          const fetchedCountry = addr.country || '';
          const fetchedState = addr.state || addr.region || '';
          const fetchedCity =
            addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.district || '';
          const fetchedHouse = addr.house_number || addr.building || '';
          const fetchedRoad = [addr.road, addr.suburb, addr.neighbourhood, addr.residential]
            .filter(Boolean)
            .join(', ');
          const fetchedLandmark = addr.amenity || addr.landmark || addr.shop || '';

          const result: GeocodedAddressResult = {
            latitude: targetLat,
            longitude: targetLng,
            displayName: data.display_name || 'Selected Location',
            houseNo: fetchedHouse,
            street: fetchedRoad,
            landmark: fetchedLandmark,
            city: fetchedCity,
            state: fetchedState,
            country: fetchedCountry,
            pinCode: fetchedPin,
          };

          setAddressSummary(data.display_name || 'Location selected');
          setLastParsedResult(result);
          if (notifyParent) {
            onLocationSelectRef.current(result);
          }
        } else {
          setAddressSummary(`Lat: ${targetLat.toFixed(5)}, Lng: ${targetLng.toFixed(5)}`);
          if (notifyParent) {
            onLocationSelectRef.current({
              latitude: targetLat,
              longitude: targetLng,
              displayName: `Lat: ${targetLat.toFixed(5)}, Lng: ${targetLng.toFixed(5)}`,
            });
          }
        }
      } catch (err) {
        setAddressSummary(`Lat: ${targetLat.toFixed(5)}, Lng: ${targetLng.toFixed(5)}`);
      } finally {
        setIsGeocoding(false);
      }
    },
    []
  );

  // ── Auto-Detect Location on Mount only once if no initial coordinate ───────
  useEffect(() => {
    let mounted = true;
    if (!initialLatitude || !initialLongitude) {
      handleUseCurrentLocation(false);
    } else {
      reverseGeocode(lat, lng, false);
    }
    return () => {
      mounted = false;
      if (regionDebounceTimerRef.current) clearTimeout(regionDebounceTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Triple-Redundancy GPS & Network Location Detector ──────────────────────
  const requestAndroidLocationPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);
      const fineGranted =
        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const coarseGranted =
        results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;
      return fineGranted || coarseGranted;
    } catch {
      return false;
    }
  };

  const detectPosition = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (pos) => {
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (_err1) => {
          Geolocation.getCurrentPosition(
            (pos) => {
              resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            },
            async (_err2) => {
              try {
                const res = await fetch('https://ipwho.is/');
                const data = await res.json();
                if (data && data.success && data.latitude && data.longitude) {
                  return resolve({ latitude: data.latitude, longitude: data.longitude });
                }
              } catch {}

              try {
                const res2 = await fetch('https://ipapi.co/json/');
                const data2 = await res2.json();
                if (data2 && data2.latitude && data2.longitude) {
                  return resolve({ latitude: data2.latitude, longitude: data2.longitude });
                }
              } catch {}

              reject(new Error('Unable to determine GPS location'));
            },
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 10000 }
          );
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 5000 }
      );
    });
  };

  const handleUseCurrentLocation = async (userInitiated = true) => {
    try {
      setIsDetectingGps(true);
      await requestAndroidLocationPermissions();

      const coords = await detectPosition();
      const newLat = coords.latitude;
      const newLng = coords.longitude;

      isProgrammaticMoveRef.current = true;
      setLat(newLat);
      setLng(newLng);

      const targetRegion: Region = {
        latitude: newLat,
        longitude: newLng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      inlineMapRef.current?.animateToRegion(targetRegion, 500);
      fullMapRef.current?.animateToRegion(targetRegion, 500);

      reverseGeocode(newLat, newLng, userInitiated);
    } catch (_err) {
      // Retain fallback coordinates
    } finally {
      setIsDetectingGps(false);
    }
  };

  // ── Preposition Cleaner for Indian Address Searches ───────────────────────
  const sanitizeSearchQuery = (q: string) => {
    return q
      .replace(/\b(ner|near|opp|opposite|behind|beside|next to|nr|close to|around|front of|in front of|at)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // ── Progressive Multi-Candidate Search Geocoder ───────────────────────────
  const executeSearch = async (queryText: string) => {
    const raw = queryText.trim();
    if (!raw || raw.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);
    setSearchAttempted(true);

    try {
      // 1. Google Places Autocomplete API
      if (ENV.GOOGLE_MAPS_API_KEY) {
        try {
          const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            raw
          )}&components=country:in&key=${ENV.GOOGLE_MAPS_API_KEY}`;
          const gRes = await fetch(placesUrl);
          const gData = await gRes.json();

          if (gData.status === 'OK' && Array.isArray(gData.predictions) && gData.predictions.length > 0) {
            const formatted = gData.predictions.map((p: any) => ({
              place_id: p.place_id,
              isGoogle: true,
              name: p.structured_formatting?.main_text || p.description.split(',')[0],
              display_name: p.description,
            }));
            setSearchResults(formatted);
            return;
          }
        } catch (_err) {
          // Fall through to Nominatim
        }
      }

      // 2. OpenStreetMap Nominatim Fallback
      const cleaned = sanitizeSearchQuery(raw);
      const tokens = cleaned.split(/\s+/).filter(Boolean);

      const candidateQueries = [
        cleaned,
        raw !== cleaned ? raw : null,
        tokens.length > 1 ? tokens.join(', ') : null,
        tokens.length > 1 ? tokens[tokens.length - 1] : null,
      ].filter(Boolean) as string[];

      let foundResults: any[] = [];

      for (const cand of candidateQueries) {
        if (!cand || cand.length < 2) continue;
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            cand
          )}&countrycodes=in&addressdetails=1&limit=6`;
          const res = await fetch(url, {
            headers: { 'User-Agent': 'EcoSystemCustomerApp/1.0 (smart-sales-platform)' },
          });
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            foundResults = data;
            break;
          }
        } catch (_err) {}
      }

      setSearchResults(foundResults);
    } catch (_err) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchAttempted(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(text);
    }, 350);
  };

  const handleSelectSearchResult = async (item: any) => {
    isProgrammaticMoveRef.current = true;

    // Google Place Details
    if (item.isGoogle && item.place_id && ENV.GOOGLE_MAPS_API_KEY) {
      try {
        setIsGeocoding(true);
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&fields=geometry,formatted_address,name,address_components&key=${ENV.GOOGLE_MAPS_API_KEY}`;
        const dRes = await fetch(detailsUrl);
        const dData = await dRes.json();

        if (dData.status === 'OK' && dData.result?.geometry?.location) {
          const selectedLat = dData.result.geometry.location.lat;
          const selectedLng = dData.result.geometry.location.lng;

          const parsed = parseGoogleGeocodeResult(dData.result, selectedLat, selectedLng);
          setLat(selectedLat);
          setLng(selectedLng);
          lastGeocodedCoordsRef.current = { lat: selectedLat, lng: selectedLng };

          const targetRegion: Region = {
            latitude: selectedLat,
            longitude: selectedLng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          inlineMapRef.current?.animateToRegion(targetRegion, 500);
          fullMapRef.current?.animateToRegion(targetRegion, 500);

          setSearchQuery('');
          setShowSearchResults(false);
          setAddressSummary(parsed.displayName);
          setLastParsedResult(parsed);
          onLocationSelectRef.current(parsed);
          return;
        }
      } catch (_err) {
      } finally {
        setIsGeocoding(false);
      }
    }

    const selectedLat = parseFloat(item.lat);
    const selectedLng = parseFloat(item.lon);
    if (!isNaN(selectedLat) && !isNaN(selectedLng)) {
      setLat(selectedLat);
      setLng(selectedLng);
      lastGeocodedCoordsRef.current = { lat: selectedLat, lng: selectedLng };
      const targetRegion: Region = {
        latitude: selectedLat,
        longitude: selectedLng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      inlineMapRef.current?.animateToRegion(targetRegion, 500);
      fullMapRef.current?.animateToRegion(targetRegion, 500);
      setSearchQuery('');
      setShowSearchResults(false);
      reverseGeocode(selectedLat, selectedLng, true);
    }
  };

  // ── Drag Map Handlers & Pin Animations with Strict Debounce ────────────────
  const handleRegionChange = () => {
    if (!isDragging) {
      setIsDragging(true);
      Animated.spring(pinLiftAnim, {
        toValue: -16,
        useNativeDriver: true,
        speed: 20,
      }).start();
    }
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setIsDragging(false);
    Animated.spring(pinLiftAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5,
    }).start();

    // If change was triggered programmatically (e.g. animateToRegion from prop), ignore
    if (isProgrammaticMoveRef.current) {
      isProgrammaticMoveRef.current = false;
      return;
    }

    if (!newRegion.latitude || !newRegion.longitude) return;

    // Check if movement is significant enough to warrant a reverse geocode API call
    const deltaLat = Math.abs(newRegion.latitude - lastGeocodedCoordsRef.current.lat);
    const deltaLng = Math.abs(newRegion.longitude - lastGeocodedCoordsRef.current.lng);

    if (deltaLat < COORD_DELTA_THRESHOLD && deltaLng < COORD_DELTA_THRESHOLD) {
      return;
    }

    // Debounce reverse geocode by 500ms to avoid firing on intermediate frames
    if (regionDebounceTimerRef.current) {
      clearTimeout(regionDebounceTimerRef.current);
    }

    regionDebounceTimerRef.current = setTimeout(() => {
      setLat(newRegion.latitude);
      setLng(newRegion.longitude);
      reverseGeocode(newRegion.latitude, newRegion.longitude, true);
    }, 500);
  };

  const handleZoom = (direction: 'in' | 'out', mapInstance: React.RefObject<MapView | null>) => {
    isProgrammaticMoveRef.current = true;
    const factor = direction === 'in' ? 0.5 : 2.0;
    const targetRegion: Region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: Math.max(0.001, Math.min(0.5, 0.006 * factor)),
      longitudeDelta: Math.max(0.001, Math.min(0.5, 0.006 * factor)),
    };
    mapInstance.current?.animateToRegion(targetRegion, 300);
  };

  const toggleMapType = () => {
    setMapType((prev) => (prev === 'standard' ? 'satellite' : prev === 'satellite' ? 'hybrid' : 'standard'));
  };

  const handleConfirmLocation = () => {
    if (lastParsedResult) {
      onLocationSelectRef.current(lastParsedResult);
    } else {
      reverseGeocode(lat, lng, true);
    }
    setIsFullscreenModalOpen(false);
  };

  return (
    <Card style={[styles.container, style]} padding="none" variant="outlined">
      {/* ── Top Search & Locate Header ───────────────────────────────────── */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <TouchableOpacity
            onPress={() => executeSearch(searchQuery)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name="search-outline" size="sm" color={colors.primary.main} />
          </TouchableOpacity>

          <TextInput
            style={styles.searchInput}
            placeholder="Search area (e.g. Udaipur, RTO, Pratap Nagar)..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
            onSubmitEditing={() => executeSearch(searchQuery)}
            returnKeyType="search"
            autoCorrect={false}
          />

          {isSearching ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
                setSearchAttempted(false);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon name="close-circle" size="xs" color={colors.text.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* GPS Locate Button */}
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={() => handleUseCurrentLocation(true)}
          disabled={isDetectingGps}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Detect current GPS location"
        >
          {isDetectingGps ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : (
            <AppIcon name="locate" size="sm" color={colors.primary.main} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Search Dropdown ──────────────────────────────────────────────── */}
      {showSearchResults && (
        <View style={styles.searchResultsDropdown}>
          {isSearching ? (
            <View style={styles.searchLoadingBox}>
              <ActivityIndicator size="small" color={colors.primary.main} />
              <AppText variant="caption" color="textSecondary" style={styles.searchLoadingText}>
                Searching localities...
              </AppText>
            </View>
          ) : searchResults.length > 0 ? (
            <ScrollView
              style={styles.searchResultsScroll}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {searchResults.map((item, idx) => (
                <TouchableOpacity
                  key={item.place_id || idx}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectSearchResult(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.searchItemIconWrap}>
                    <AppIcon name="location-outline" size="xs" color={colors.primary.main} />
                  </View>
                  <View style={styles.searchResultTextWrap}>
                    <AppText variant="bodySm" color="textPrimary" numberOfLines={1} style={styles.searchResultTitle}>
                      {item.name || item.display_name.split(',')[0]}
                    </AppText>
                    <AppText variant="caption" color="textMuted" numberOfLines={1}>
                      {item.display_name}
                    </AppText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : searchAttempted ? (
            <View style={styles.emptySearchBox}>
              <AppIcon name="alert-circle-outline" size="sm" color={colors.status.warning} />
              <View style={styles.emptySearchTextWrap}>
                <AppText variant="labelSm" color="textPrimary">
                  No exact match for "{searchQuery}"
                </AppText>
                <AppText variant="caption" color="textMuted">
                  Try typing the main city or locality (e.g. "Udaipur", "Pratap Nagar", "Sukher").
                </AppText>
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* ── Inline Interactive Google MapView ────────────────────────────── */}
      <View style={styles.mapViewport}>
        {!inlineMapReady && (
          <View style={styles.mapPlaceholderSkeleton}>
            <ActivityIndicator size="small" color={colors.primary.main} />
            <AppText variant="caption" color="textMuted" style={styles.skeletonText}>
              Loading Google Maps...
            </AppText>
          </View>
        )}

        <MapView
          ref={inlineMapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          mapType={mapType}
          initialRegion={{
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          onMapReady={() => setInlineMapReady(true)}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          showsBuildings
          rotateEnabled
          scrollEnabled
          zoomEnabled
        />

        {/* Top Floating Coordinates HUD Badge */}
        <View style={styles.coordsBadgeContainer}>
          <View style={styles.coordsBadge}>
            <View style={styles.livePulseDot} />
            <AppText variant="caption" style={styles.coordsText}>
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </AppText>
          </View>

          {isGeocoding && (
            <View style={styles.geocodingPill}>
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.miniSpinner} />
              <AppText variant="caption" style={styles.geocodingText}>
                Resolving...
              </AppText>
            </View>
          )}
        </View>

        {/* Center Google Maps-style Pin with Drop Animation */}
        <View style={styles.pinContainer} pointerEvents="none">
          <Animated.View
            style={[
              styles.pinIconWrapper,
              {
                transform: [{ translateY: pinLiftAnim }],
              },
            ]}
          >
            <AppIcon name="location" size="xl" color={colors.status.danger} />
          </Animated.View>
          <View style={[styles.pinShadow, isDragging && styles.pinShadowDragging]} />
        </View>

        {/* Floating Controls (Zoom +/- & Expand Fullscreen & Map Layer) */}
        <View style={styles.floatingControlsCol}>
          <TouchableOpacity
            style={styles.expandMapBtn}
            onPress={() => setIsFullscreenModalOpen(true)}
            activeOpacity={0.85}
            accessibilityLabel="Open Fullscreen Map"
          >
            <AppIcon name="expand-outline" size="sm" color={colors.primary.main} />
            <AppText variant="caption" color="primary" style={styles.expandText}>
              Full Map
            </AppText>
          </TouchableOpacity>

          <View style={styles.zoomControlsBox}>
            <TouchableOpacity
              style={styles.mapControlBtn}
              onPress={toggleMapType}
              activeOpacity={0.8}
              accessibilityLabel="Switch map layer"
            >
              <AppIcon
                name={mapType === 'satellite' ? 'earth' : 'layers-outline'}
                size="sm"
                color={mapType === 'satellite' ? colors.primary.main : colors.text.primary}
              />
            </TouchableOpacity>
            <View style={styles.controlDivider} />
            <TouchableOpacity
              style={styles.mapControlBtn}
              onPress={() => handleZoom('in', inlineMapRef)}
              activeOpacity={0.8}
            >
              <AppIcon name="add" size="sm" color={colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.controlDivider} />
            <TouchableOpacity
              style={styles.mapControlBtn}
              onPress={() => handleZoom('out', inlineMapRef)}
              activeOpacity={0.8}
            >
              <AppIcon name="remove" size="sm" color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Slide Map Instruction Pill */}
        <View style={styles.tapInstructionBar}>
          <AppIcon name="hand-left-outline" size="xs" color="#FFFFFF" />
          <AppText variant="caption" style={styles.tapInstructionText}>
            Slide map to pinpoint exact location
          </AppText>
        </View>
      </View>

      {/* ── Bottom Selected Address Card ─────────────────────────────────── */}
      <View style={styles.footerDetails}>
        <View style={styles.footerHeaderRow}>
          <Badge label="Pinned Location" variant="primary" />
          <TouchableOpacity
            onPress={() => setIsFullscreenModalOpen(true)}
            activeOpacity={0.7}
            style={styles.openFullscreenLink}
          >
            <AppIcon name="map-outline" size="xs" color={colors.primary.main} />
            <AppText variant="caption" color="primary" style={styles.boldText}>
              Open Fullscreen View
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.addressDisplayRow}>
          <View style={styles.locationIconThumb}>
            <AppIcon name="navigate-circle" size="md" color={colors.primary.main} />
          </View>
          <View style={styles.addressTextCol}>
            <AppText
              variant="labelMd"
              color="textPrimary"
              numberOfLines={2}
              style={styles.addressSummaryTitle}
            >
              {addressSummary || 'Detecting address...'}
            </AppText>
            <AppText variant="caption" color="primary" style={styles.latLngSub}>
              📍 Lat: {lat.toFixed(5)} • Lng: {lng.toFixed(5)}
            </AppText>
          </View>
        </View>
      </View>

      {/* ── Fullscreen Interactive Google Map Modal (Safe-Area Aware) ─────────── */}
      <Modal
        visible={isFullscreenModalOpen}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsFullscreenModalOpen(false)}
      >
        <View style={styles.fullscreenContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

          {/* Fullscreen MapView */}
          <View style={styles.fullscreenMapWrap}>
            {!fullMapReady && (
              <View style={styles.fullMapSkeleton}>
                <ActivityIndicator size="large" color={colors.primary.main} />
                <AppText variant="bodySm" color="textMuted" style={styles.skeletonText}>
                  Rendering full-bleed Google Map...
                </AppText>
              </View>
            )}

            <MapView
              ref={fullMapRef}
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFill}
              mapType={mapType}
              initialRegion={{
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              onMapReady={() => setFullMapReady(true)}
              onRegionChange={handleRegionChange}
              onRegionChangeComplete={handleRegionChangeComplete}
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass
              showsBuildings
              rotateEnabled
              scrollEnabled
              zoomEnabled
            />

            {/* Top Floating Search & Close Bar (Safe Area dynamic padding) */}
            <View
              style={[
                styles.modalTopOverlay,
                {
                  top: Math.max(insets.top, 16) + 4,
                },
              ]}
            >
              <View style={styles.modalSearchBar}>
                <TouchableOpacity
                  onPress={() => executeSearch(searchQuery)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <AppIcon name="search-outline" size="sm" color={colors.primary.main} />
                </TouchableOpacity>

                <TextInput
                  style={styles.searchInput}
                  placeholder="Search landmark or locality..."
                  placeholderTextColor={colors.text.muted}
                  value={searchQuery}
                  onChangeText={handleSearchQueryChange}
                  onSubmitEditing={() => executeSearch(searchQuery)}
                  returnKeyType="search"
                  autoCorrect={false}
                />

                {searchQuery ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <AppIcon name="close-circle" size="xs" color={colors.text.muted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsFullscreenModalOpen(false)}
                activeOpacity={0.8}
              >
                <AppIcon name="close" size="md" color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Floating GPS, Layer & Zoom Buttons on Fullscreen Map */}
            <View
              style={[
                styles.modalFloatingFabCol,
                {
                  bottom: Math.max(insets.bottom, 16) + 210,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.modalFabBtn}
                onPress={() => handleUseCurrentLocation(true)}
                activeOpacity={0.85}
                accessibilityLabel="Locate with GPS"
              >
                {isDetectingGps ? (
                  <ActivityIndicator size="small" color={colors.primary.main} />
                ) : (
                  <AppIcon name="locate" size="md" color={colors.primary.main} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalFabBtn}
                onPress={toggleMapType}
                activeOpacity={0.85}
                accessibilityLabel="Toggle map layer"
              >
                <AppIcon
                  name={mapType === 'satellite' ? 'earth' : 'layers-outline'}
                  size="md"
                  color={mapType === 'satellite' ? colors.primary.main : colors.text.primary}
                />
              </TouchableOpacity>

              <View style={styles.zoomControlsBox}>
                <TouchableOpacity
                  style={styles.mapControlBtn}
                  onPress={() => handleZoom('in', fullMapRef)}
                  activeOpacity={0.8}
                >
                  <AppIcon name="add" size="sm" color={colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.controlDivider} />
                <TouchableOpacity
                  style={styles.mapControlBtn}
                  onPress={() => handleZoom('out', fullMapRef)}
                  activeOpacity={0.8}
                >
                  <AppIcon name="remove" size="sm" color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Center Fixed Dropper Pin */}
            <View style={styles.pinContainer} pointerEvents="none">
              <Animated.View
                style={[
                  styles.pinIconWrapper,
                  {
                    transform: [{ translateY: pinLiftAnim }],
                  },
                ]}
              >
                <AppIcon name="location" size="xl" color={colors.status.danger} />
              </Animated.View>
              <View style={[styles.pinShadow, isDragging && styles.pinShadowDragging]} />
            </View>

            {/* Bottom Slide-up Confirmation Card with dynamic safe area bottom */}
            <View
              style={[
                styles.modalBottomCard,
                {
                  paddingBottom: Math.max(insets.bottom, 16) + 8,
                },
              ]}
            >
              <View style={styles.modalDragHandle} />

              <View style={styles.footerHeaderRow}>
                <Badge label="Selected Service Location" variant="primary" />
                {isGeocoding && (
                  <View style={styles.resolvingPill}>
                    <ActivityIndicator size="small" color={colors.primary.main} style={styles.miniSpinner} />
                    <AppText variant="caption" color="primary">
                      Resolving address...
                    </AppText>
                  </View>
                )}
              </View>

              <AppText variant="headingMd" color="textPrimary" numberOfLines={2} style={styles.modalAddressTitle}>
                {addressSummary || 'Slide map to pick location'}
              </AppText>

              <AppText variant="caption" color="textSecondary" style={styles.modalCoordsText}>
                📍 Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
              </AppText>

              <Button
                title="Confirm & Use This Location"
                variant="primary"
                size="large"
                onPress={handleConfirmLocation}
                style={styles.modalConfirmBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
};

const makeStyles = (colors: any, _insets: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background.paper,
      borderRadius: radius.xl,
      overflow: 'hidden',
      marginBottom: spacing.md,
      borderWidth: 1.5,
      borderColor: colors.border.light,
    },
    searchHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.sm,
      gap: spacing.xs,
      backgroundColor: colors.background.paper,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.default,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: Platform.OS === 'ios' ? spacing.xs + 2 : 2,
      borderWidth: 1,
      borderColor: colors.border.light,
      gap: spacing.xs,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.text.primary,
      paddingVertical: 4,
    },
    gpsBtn: {
      width: 42,
      height: 42,
      borderRadius: radius.lg,
      backgroundColor: colors.primary.light,
      borderWidth: 1,
      borderColor: colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchResultsDropdown: {
      position: 'absolute',
      top: 56,
      left: spacing.sm,
      right: spacing.sm,
      backgroundColor: colors.background.paper,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.light,
      elevation: 8,
      shadowColor: colors.neutral[900],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      zIndex: 100,
      maxHeight: 180,
    },
    searchResultsScroll: {
      maxHeight: 180,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      gap: spacing.sm,
    },
    searchResultTextWrap: {
      flex: 1,
    },
    searchResultTitle: {
      fontWeight: '600',
      marginBottom: 1,
    },
    mapViewport: {
      width: '100%',
      height: 220,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#f1f5f9',
    },
    mapPlaceholderSkeleton: {
      ...StyleSheet.absoluteFill,
      backgroundColor: '#f1f5f9',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      gap: 6,
    },
    skeletonText: {
      marginTop: 4,
      fontWeight: '500',
    },
    coordsBadgeContainer: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      flexDirection: 'row',
      gap: spacing.xs,
      zIndex: 6,
    },
    coordsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    livePulseDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#10B981',
    },
    coordsText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
    },
    geocodingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(37, 99, 235, 0.9)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    miniSpinner: {
      transform: [{ scale: 0.7 }],
    },
    geocodingText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
    },
    pinContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
    },
    pinIconWrapper: {
      marginBottom: 32,
    },
    pinShadow: {
      position: 'absolute',
      width: 14,
      height: 6,
      borderRadius: 7,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      bottom: 96,
      transform: [{ scale: 1 }],
      opacity: 0.8,
    },
    pinShadowDragging: {
      transform: [{ scale: 0.6 }],
      opacity: 0.25,
    },
    floatingControlsCol: {
      position: 'absolute',
      bottom: spacing.lg + 10,
      right: spacing.sm,
      gap: spacing.xs,
      zIndex: 6,
    },
    expandMapBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.background.paper,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border.light,
      ...shadows.medium,
    },
    expandText: {
      fontWeight: '700',
      fontSize: 11,
    },
    zoomControlsBox: {
      backgroundColor: colors.background.paper,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.light,
      ...shadows.medium,
      alignSelf: 'flex-end',
    },
    mapControlBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    controlDivider: {
      height: 1,
      backgroundColor: colors.border.light,
    },
    tapInstructionBar: {
      position: 'absolute',
      bottom: spacing.xs + 2,
      left: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
      zIndex: 6,
    },
    tapInstructionText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
    searchItemIconWrap: {
      width: 28,
      height: 28,
      borderRadius: radius.pill,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchLoadingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
    },
    searchLoadingText: {
      fontWeight: '500',
    },
    emptySearchBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.background.default,
    },
    emptySearchTextWrap: {
      flex: 1,
    },
    footerDetails: {
      padding: spacing.md,
      backgroundColor: colors.background.paper,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    footerHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    openFullscreenLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    boldText: {
      fontWeight: '700',
    },
    addressDisplayRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginTop: 2,
    },
    locationIconThumb: {
      width: 38,
      height: 38,
      borderRadius: radius.md,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    addressTextCol: {
      flex: 1,
    },
    addressSummaryTitle: {
      fontWeight: '600',
      lineHeight: 18,
      marginBottom: 3,
    },
    latLngSub: {
      fontWeight: '600',
      fontSize: 11,
    },

    // ── Fullscreen Modal Styles ──────────────────────────────────────────────
    fullscreenContainer: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    fullscreenMapWrap: {
      flex: 1,
      position: 'relative',
    },
    fullMapSkeleton: {
      ...StyleSheet.absoluteFill,
      backgroundColor: '#f1f5f9',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      gap: 8,
    },
    modalTopOverlay: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      zIndex: 10,
    },
    modalSearchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.paper,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: Platform.OS === 'ios' ? spacing.sm : 4,
      borderWidth: 1,
      borderColor: colors.border.light,
      ...shadows.large,
      gap: spacing.xs,
    },
    modalCloseBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      backgroundColor: colors.background.paper,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.light,
      ...shadows.large,
    },
    modalFloatingFabCol: {
      position: 'absolute',
      right: spacing.md,
      gap: spacing.sm,
      zIndex: 8,
    },
    modalFabBtn: {
      width: 46,
      height: 46,
      borderRadius: radius.lg,
      backgroundColor: colors.background.paper,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.light,
      ...shadows.large,
    },
    modalBottomCard: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background.paper,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      ...shadows.large,
      zIndex: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    modalDragHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border.dark || '#CBD5E1',
      alignSelf: 'center',
      marginBottom: spacing.sm,
    },
    modalAddressTitle: {
      marginTop: spacing.xs,
      lineHeight: 22,
    },
    modalCoordsText: {
      marginTop: 2,
      marginBottom: spacing.md,
    },
    resolvingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    modalConfirmBtn: {
      marginTop: spacing.xs,
    },
  });
