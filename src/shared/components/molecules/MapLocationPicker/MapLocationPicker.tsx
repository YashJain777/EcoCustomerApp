/**
 * @file MapLocationPicker.tsx
 * @layer Shared / Molecules
 * @responsibility Google Maps-style interactive map location & pin picker.
 *                 Allows users to search localities, drag/pan the map, drop pins,
 *                 auto-detect GPS, and auto-reverse geocode into address form fields.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  TextInput,
  ScrollView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { Card } from '@shared/components/atoms/Card';
import { Badge } from '@shared/components/atoms/Badge';
import { spacing, radius, useTheme } from '@theme/index';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// Default fallback coordinate (New Delhi, India)
const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.2090;

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  initialLatitude,
  initialLongitude,
  onLocationSelect,
  style,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [lat, setLat] = useState<number>(initialLatitude || DEFAULT_LAT);
  const [lng, setLng] = useState<number>(initialLongitude || DEFAULT_LNG);
  const [zoom, setZoom] = useState<number>(16);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [addressSummary, setAddressSummary] = useState<string>('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Reverse Geocode Function ──────────────────────────────────────────────
  const reverseGeocode = useCallback(
    async (targetLat: number, targetLng: number) => {
      try {
        setIsGeocoding(true);
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}&addressdetails=1`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'EcoSystemCustomerApp/1.0' },
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
          onLocationSelect(result);
        } else {
          setAddressSummary(`Lat: ${targetLat.toFixed(5)}, Lng: ${targetLng.toFixed(5)}`);
          onLocationSelect({
            latitude: targetLat,
            longitude: targetLng,
            displayName: `Lat: ${targetLat.toFixed(5)}, Lng: ${targetLng.toFixed(5)}`,
          });
        }
      } catch (err) {
        console.warn('Reverse geocode error:', err);
        setAddressSummary(`Lat: ${targetLat.toFixed(5)}, Lng: ${targetLng.toFixed(5)}`);
      } finally {
        setIsGeocoding(false);
      }
    },
    [onLocationSelect]
  );

  useEffect(() => {
    reverseGeocode(lat, lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── GPS Current Location Handler ──────────────────────────────────────────
  const requestAndroidPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your GPS to pinpoint your service address.',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setIsDetectingGps(true);
      const hasPerm = await requestAndroidPermission();
      if (!hasPerm) {
        throw new Error('Location permission not granted');
      }

      Geolocation.getCurrentPosition(
        (pos) => {
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          setLat(newLat);
          setLng(newLng);
          setZoom(17);
          reverseGeocode(newLat, newLng);
          setIsDetectingGps(false);
        },
        async () => {
          try {
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            if (ipData && ipData.latitude && ipData.longitude) {
              setLat(ipData.latitude);
              setLng(ipData.longitude);
              reverseGeocode(ipData.latitude, ipData.longitude);
            }
          } catch {}
          setIsDetectingGps(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    } catch {
      setIsDetectingGps(false);
    }
  };

  // ── Locality / Area Search Handler ────────────────────────────────────────
  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim() || text.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          text
        )}&addressdetails=1&limit=5`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'EcoSystemCustomerApp/1.0' },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setSearchResults(data);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.warn('Search geocode error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  const handleSelectSearchResult = (item: any) => {
    const selectedLat = parseFloat(item.lat);
    const selectedLng = parseFloat(item.lon);
    if (!isNaN(selectedLat) && !isNaN(selectedLng)) {
      setLat(selectedLat);
      setLng(selectedLng);
      setZoom(17);
      setSearchQuery('');
      setShowSearchResults(false);
      reverseGeocode(selectedLat, selectedLng);
    }
  };

  // ── Pan Map / Tap Map to Move Pin ─────────────────────────────────────────
  const handleMapTap = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const mapWidth = SCREEN_WIDTH - spacing.lg * 2;
    const mapHeight = 220;

    const offsetX = locationX - mapWidth / 2;
    const offsetY = locationY - mapHeight / 2;

    const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
    const deltaLat = -(offsetY * metersPerPixel) / 111320;
    const deltaLng = (offsetX * metersPerPixel) / (111320 * Math.cos((lat * Math.PI) / 180));

    const newLat = parseFloat((lat + deltaLat).toFixed(6));
    const newLng = parseFloat((lng + deltaLng).toFixed(6));

    setLat(newLat);
    setLng(newLng);
    reverseGeocode(newLat, newLng);
  };

  const mapImageUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=600x320&maptype=mapnik&markers=${lat},${lng},ol-marker`;

  return (
    <Card style={[styles.container, style]} padding="none" variant="outlined">
      {/* ── Top Search & Locate Header ───────────────────────────────────── */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <AppIcon name="search-outline" size="sm" color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search locality, street or landmark..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
            autoCorrect={false}
          />
          {isSearching ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon name="close-circle" size="xs" color={colors.text.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* GPS Button */}
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={handleUseCurrentLocation}
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

      {/* ── Search Auto-Complete Dropdown ─────────────────────────────────── */}
      {showSearchResults && searchResults.length > 0 && (
        <View style={styles.searchResultsDropdown}>
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
                <AppIcon name="location-outline" size="xs" color={colors.primary.main} />
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
        </View>
      )}

      {/* ── Interactive Map Viewport ───────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.mapViewport}
        activeOpacity={0.95}
        onPress={handleMapTap}
      >
        <Image
          source={{ uri: mapImageUrl }}
          style={styles.mapImage}
          resizeMode="cover"
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
              <ActivityIndicator size="small" color={colors.text.inverse} style={styles.miniSpinner} />
              <AppText variant="caption" style={styles.geocodingText}>
                Resolving...
              </AppText>
            </View>
          )}
        </View>

        {/* Center Google Maps-style Pin Indicator */}
        <View style={styles.pinContainer} pointerEvents="none">
          <View style={styles.pinPulseRing} />
          <View style={styles.pinShadow} />
          <View style={styles.pinIconWrapper}>
            <AppIcon name="location" size="lg" color="#EF4444" />
          </View>
        </View>

        {/* Map Control Buttons (Zoom +/- & Hint) */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapControlBtn}
            onPress={() => setZoom((z) => Math.min(z + 1, 18))}
            activeOpacity={0.8}
            accessibilityLabel="Zoom In"
          >
            <AppIcon name="add" size="sm" color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.controlDivider} />
          <TouchableOpacity
            style={styles.mapControlBtn}
            onPress={() => setZoom((z) => Math.max(z - 1, 12))}
            activeOpacity={0.8}
            accessibilityLabel="Zoom Out"
          >
            <AppIcon name="remove" size="sm" color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Tap to Pin Instruction Bar */}
        <View style={styles.tapInstructionBar}>
          <AppIcon name="hand-left-outline" size="xs" color={colors.text.inverse} />
          <AppText variant="caption" style={styles.tapInstructionText}>
            Tap anywhere on map to reposition pin
          </AppText>
        </View>
      </TouchableOpacity>

      {/* ── Bottom Selected Address Card ─────────────────────────────────── */}
      <View style={styles.footerDetails}>
        <View style={styles.footerHeaderRow}>
          <Badge label="Pinned Location" variant="primary" />
          <AppText variant="caption" color="textMuted">
            Auto-filled below
          </AppText>
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
              📍 Latitude: {lat.toFixed(6)} • Longitude: {lng.toFixed(6)}
            </AppText>
          </View>
        </View>
      </View>
    </Card>
  );
};

const makeStyles = (colors: any) =>
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
      backgroundColor: colors.neutral[200],
      position: 'relative',
      overflow: 'hidden',
    },
    mapImage: {
      width: '100%',
      height: '100%',
    },
    coordsBadgeContainer: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      flexDirection: 'row',
      gap: spacing.xs,
      zIndex: 5,
    },
    coordsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
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
      fontFamily: 'monospace',
    },
    geocodingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(37, 99, 235, 0.85)',
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
      zIndex: 4,
    },
    pinIconWrapper: {
      marginBottom: 26,
    },
    pinPulseRing: {
      position: 'absolute',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(239, 68, 68, 0.25)',
      borderWidth: 1.5,
      borderColor: '#EF4444',
      bottom: 92,
    },
    pinShadow: {
      position: 'absolute',
      width: 14,
      height: 6,
      borderRadius: 7,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      bottom: 98,
    },
    mapControls: {
      position: 'absolute',
      bottom: spacing.lg + 10,
      right: spacing.sm,
      backgroundColor: colors.background.paper,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.light,
      elevation: 4,
      shadowColor: colors.neutral[900],
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      zIndex: 5,
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
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
      zIndex: 5,
    },
    tapInstructionText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
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
  });
