/**
 * @file SavedAddressesScreen.tsx
 * @feature Settings / Screens
 * @responsibility Multi-address management — list, add, edit, set-default, delete.
 *                 Integrates Google Maps-style interactive map location & pin picker
 *                 with automatic reverse geocoding into address form fields.
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Header } from '@shared/components/molecules/Header';
import { Card } from '@shared/components/atoms/Card';
import { Input } from '@shared/components/atoms/Input';
import { Button } from '@shared/components/atoms/Button';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { Badge } from '@shared/components/atoms/Badge';
import { Select, SelectOption } from '@shared/components/molecules/Select';
import {
  MapLocationPicker,
  GeocodedAddressResult,
} from '@shared/components/molecules/MapLocationPicker';
import {
  customerApi,
  CustomerAddress,
  CreateAddressPayload,
  UpdateAddressPayload,
  LocationItem,
} from '@infrastructure/api/customerApi';
import { spacing, radius, shadows, useTheme } from '@theme/index';

type AddressType = 'HOME' | 'WORK' | 'OFFICE' | 'OTHER';

const ADDRESS_TYPES: Array<{ type: AddressType; label: string; icon: string }> = [
  { type: 'HOME', label: 'Home', icon: 'home-outline' },
  { type: 'WORK', label: 'Work', icon: 'briefcase-outline' },
  { type: 'OFFICE', label: 'Office', icon: 'business-outline' },
  { type: 'OTHER', label: 'Other', icon: 'location-outline' },
];

const TYPE_COLORS: Record<AddressType, { bg: string; text: string }> = {
  HOME: { bg: '#EEF0FF', text: '#2719A3' },
  WORK: { bg: '#FFF7ED', text: '#C05621' },
  OFFICE: { bg: '#F0FFF4', text: '#22543D' },
  OTHER: { bg: '#FAF5FF', text: '#6B46C1' },
};

interface FormState {
  label: string;
  addressType: AddressType;
  houseNo: string;
  street: string;
  landmark: string;
  countryId: string;
  stateId: string;
  cityId: string;
  pinCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

const EMPTY_FORM: FormState = {
  label: '',
  addressType: 'HOME',
  houseNo: '',
  street: '',
  landmark: '',
  countryId: '',
  stateId: '',
  cityId: '',
  pinCode: '',
  latitude: undefined,
  longitude: undefined,
  isDefault: false,
};

function addressToForm(addr: CustomerAddress): FormState {
  return {
    label: addr.label || '',
    addressType: (addr.addressType as AddressType) || 'HOME',
    houseNo: addr.houseNo || '',
    street: addr.street || '',
    landmark: addr.landmark || '',
    countryId: addr.countryId || '',
    stateId: addr.stateId || '',
    cityId: addr.cityId || '',
    pinCode: addr.pinCode || '',
    latitude: addr.latitude,
    longitude: addr.longitude,
    isDefault: addr.isDefault ?? false,
  };
}

export const SavedAddressesScreen: React.FC<any> = ({ navigation }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets), [colors, insets]);

  const [pageLoading, setPageLoading] = useState(true);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [countries, setCountries] = useState<SelectOption[]>([]);
  const [states, setStates] = useState<SelectOption[]>([]);
  const [cities, setCities] = useState<SelectOption[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // Form fields
  const [label, setLabel] = useState('');
  const [addressType, setAddressType] = useState<AddressType>('HOME');
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [countryId, setCountryId] = useState('');
  const [stateId, setStateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  const loadAddresses = useCallback(async () => {
    setPageLoading(true);
    try {
      const [addrRes, countriesRes] = await Promise.allSettled([
        customerApi.getAddresses(),
        customerApi.getCountries(),
      ]);
      if (addrRes.status === 'fulfilled' && addrRes.value?.data) {
        const raw = addrRes.value.data;
        setAddresses(Array.isArray(raw) ? raw : [raw]);
      }
      if (countriesRes.status === 'fulfilled' && countriesRes.value?.data) {
        setCountries(countriesRes.value.data.map((c: LocationItem) => ({ label: c.name, value: c.id })));
      }
    } catch (_e) {
      /* no-op */
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const doLoadStates = useCallback(async (cid: string) => {
    setStatesLoading(true);
    setStates([]);
    setCities([]);
    try {
      const res = await customerApi.getStates(cid);
      if (res?.data) setStates(res.data.map((s: LocationItem) => ({ label: s.name, value: s.id })));
      return res?.data || [];
    } catch (_e) {
      return [];
    } finally {
      setStatesLoading(false);
    }
  }, []);

  const doLoadCities = useCallback(async (sid: string) => {
    setCitiesLoading(true);
    setCities([]);
    try {
      const res = await customerApi.getCities(sid);
      if (res?.data) setCities(res.data.map((c: LocationItem) => ({ label: c.name, value: c.id })));
      return res?.data || [];
    } catch (_e) {
      return [];
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  // ── Handle Location Picked on Map ─────────────────────────────────────────
  const handleMapLocationSelect = useCallback(
    async (result: GeocodedAddressResult) => {
      setLatitude(result.latitude);
      setLongitude(result.longitude);

      if (result.houseNo) setHouseNo(result.houseNo);
      if (result.street) setStreet(result.street);
      if (result.landmark) setLandmark(result.landmark);
      if (result.pinCode) setPinCode(result.pinCode);

      // Auto-match Country
      let targetCountryId = countryId;
      if (result.country && countries.length > 0) {
        const matchedC = countries.find(
          (c) =>
            c.label.toLowerCase().includes(result.country!.toLowerCase()) ||
            result.country!.toLowerCase().includes(c.label.toLowerCase())
        );
        if (matchedC) {
          targetCountryId = matchedC.value;
          setCountryId(matchedC.value);
        }
      }
      if (!targetCountryId && countries.length > 0) {
        const defaultC =
          countries.find((c) => c.label.toLowerCase().includes('india')) || countries[0];
        targetCountryId = defaultC.value;
        setCountryId(targetCountryId);
      }

      // Auto-match State and City
      if (targetCountryId) {
        const rawStates = await doLoadStates(targetCountryId);
        let targetStateId = '';
        if (result.state && rawStates && rawStates.length > 0) {
          const matchedS = rawStates.find(
            (s: LocationItem) =>
              s.name.toLowerCase().includes(result.state!.toLowerCase()) ||
              result.state!.toLowerCase().includes(s.name.toLowerCase())
          );
          if (matchedS) {
            targetStateId = matchedS.id;
            setStateId(matchedS.id);
          }
        }

        if (targetStateId) {
          const rawCities = await doLoadCities(targetStateId);
          if (result.city && rawCities && rawCities.length > 0) {
            const matchedCity = rawCities.find(
              (c: LocationItem) =>
                c.name.toLowerCase().includes(result.city!.toLowerCase()) ||
                result.city!.toLowerCase().includes(c.name.toLowerCase())
            );
            if (matchedCity) {
              setCityId(matchedCity.id);
            }
          }
        }
      }
    },
    [countryId, countries, doLoadStates, doLoadCities]
  );

  const applyForm = (f: FormState) => {
    setLabel(f.label);
    setAddressType(f.addressType);
    setHouseNo(f.houseNo);
    setStreet(f.street);
    setLandmark(f.landmark);
    setCountryId(f.countryId);
    setStateId(f.stateId);
    setCityId(f.cityId);
    setPinCode(f.pinCode);
    setLatitude(f.latitude);
    setLongitude(f.longitude);
    setIsDefault(f.isDefault);
  };

  const openAdd = () => {
    setEditingId(null);
    applyForm(EMPTY_FORM);
    setStates([]);
    setCities([]);
    setErrorMsg(null);
    setFormVisible(true);
  };

  const openEdit = async (addr: CustomerAddress) => {
    setEditingId(addr.id || null);
    applyForm(addressToForm(addr));
    setErrorMsg(null);
    setFormVisible(true);
    if (addr.countryId) await doLoadStates(addr.countryId);
    if (addr.stateId) await doLoadCities(addr.stateId);
  };

  const onCountrySelect = async (opt: SelectOption) => {
    setCountryId(opt.value);
    setStateId('');
    setCityId('');
    await doLoadStates(opt.value);
  };

  const onStateSelect = async (opt: SelectOption) => {
    setStateId(opt.value);
    setCityId('');
    await doLoadCities(opt.value);
  };

  const handleSave = async () => {
    setErrorMsg(null);
    if (!houseNo.trim() && !street.trim()) {
      setErrorMsg('Please enter house/flat or street address');
      return;
    }
    if (pinCode.trim().length < 4) {
      setErrorMsg('Please enter a valid PIN code');
      return;
    }

    setSaving(true);
    try {
      const composite = [houseNo, street, landmark ? `Near ${landmark}` : null]
        .filter(Boolean)
        .join(', ');

      const payload = {
        label: label.trim() || undefined,
        houseNo: houseNo.trim() || undefined,
        street: street.trim() || undefined,
        landmark: landmark.trim() || undefined,
        address: composite,
        countryId: countryId || undefined,
        stateId: stateId || undefined,
        cityId: cityId || undefined,
        pinCode: pinCode.trim(),
        latitude,
        longitude,
        addressType,
        isDefault,
      };

      let res: any;
      if (editingId) {
        res = await customerApi.updateAddress(editingId, payload as UpdateAddressPayload);
      } else {
        res = await customerApi.createAddress(payload as CreateAddressPayload);
      }

      if (res?.success || res?.data) {
        setFormVisible(false);
        setStatusMsg(
          editingId ? 'Address updated successfully! 📍' : 'New address added successfully! 📍'
        );
        await loadAddresses();
      } else {
        setErrorMsg('Could not save address. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.error?.message || err?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addr: CustomerAddress) => {
    if (!addr.id || addr.isDefault) return;
    setSettingDefault(addr.id);
    try {
      await customerApi.setDefaultAddress(addr.id);
      setStatusMsg('Default service address updated! ⭐');
      await loadAddresses();
    } catch (_e) {
      Alert.alert('Error', 'Could not set as default. Please try again.');
    } finally {
      setSettingDefault(null);
    }
  };

  const handleDelete = (addr: CustomerAddress) => {
    if (!addr.id) return;
    Alert.alert(
      'Delete Address',
      `Are you sure you want to remove "${addr.label || addr.address || 'this address'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!addr.id) return;
            setDeleting(addr.id);
            try {
              await customerApi.deleteAddress(addr.id);
              setStatusMsg('Address removed 🗑️');
              await loadAddresses();
            } catch (_e) {
              Alert.alert('Error', 'Could not delete address.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper style={styles.container} keyboardAvoiding>
      <Header
        title="Saved Addresses"
        subtitle="Manage your service visit locations"
        onBackPress={() => navigation.goBack()}
      />

      {statusMsg ? (
        <View style={styles.statusToast}>
          <AppIcon name="checkmark-circle" size="xs" color="#059669" />
          <AppText variant="labelSm" style={styles.statusToastText}>
            {statusMsg}
          </AppText>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {pageLoading ? (
          <ActivityIndicator size="small" color={colors.primary.main} style={styles.loader} />
        ) : addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <AppIcon name="location-outline" size="xl" color={colors.primary.main} />
            </View>
            <AppText variant="headingMd" color="textPrimary" style={styles.emptyTitle}>
              No Saved Addresses
            </AppText>
            <AppText variant="bodySm" color="textSecondary" style={styles.emptySubtitle}>
              Add your home, office, or work address to quickly request technician visits.
            </AppText>
            <Button
              title="Add New Address"
              variant="cta"
              size="medium"
              onPress={openAdd}
              style={styles.emptyBtn}
            />
          </View>
        ) : (
          <>
            <View style={styles.sectionHeaderRow}>
              <AppText variant="headingSm" color="textPrimary">
                Your Addresses ({addresses.length})
              </AppText>
              <AppText variant="caption" color="textMuted">
                {addresses.find((a) => a.isDefault)?.label || '1 Default Location'}
              </AppText>
            </View>

            {addresses.map((addr) => {
              const typeColors = TYPE_COLORS[(addr.addressType as AddressType) || 'HOME'];
              const isDeleting = deleting === addr.id;
              const isSettingDef = settingDefault === addr.id;
              return (
                <Card key={addr.id} style={styles.addrCard} padding="md">
                  <View style={styles.addrTopRow}>
                    <View style={[styles.typePill, { backgroundColor: typeColors.bg }]}>
                      <AppIcon
                        name={
                          addr.addressType === 'WORK'
                            ? 'briefcase-outline'
                            : addr.addressType === 'OFFICE'
                            ? 'business-outline'
                            : addr.addressType === 'OTHER'
                            ? 'location-outline'
                            : 'home-outline'
                        }
                        size="xs"
                        color={typeColors.text}
                      />
                      <AppText variant="caption" style={[styles.typePillText, { color: typeColors.text }]}>
                        {addr.addressType}
                      </AppText>
                    </View>

                    {addr.isDefault ? (
                      <View style={styles.defaultBadge}>
                        <AppIcon name="checkmark-circle" size="xs" color="#059669" />
                        <AppText variant="caption" style={styles.defaultBadgeText}>
                          DEFAULT LOCATION
                        </AppText>
                      </View>
                    ) : (
                      <View style={styles.savedBadge}>
                        <AppText variant="caption" style={styles.savedBadgeText}>
                          SAVED
                        </AppText>
                      </View>
                    )}

                    <View style={styles.flex1} />

                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => openEdit(addr)}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="create-outline" size="sm" color={colors.primary.main} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleDelete(addr)}
                      disabled={isDeleting}
                      activeOpacity={0.7}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color={colors.status.danger} />
                      ) : (
                        <AppIcon name="trash-outline" size="sm" color={colors.status.danger} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {addr.label ? (
                    <AppText variant="labelMd" color="textPrimary" style={styles.addrLabel}>
                      {addr.label}
                    </AppText>
                  ) : null}

                  <AppText variant="bodySm" color="textSecondary" style={styles.addrText}>
                    {addr.address || [addr.houseNo, addr.street].filter(Boolean).join(', ')}
                  </AppText>

                  <View style={styles.addrMeta}>
                    {addr.pinCode ? (
                      <View style={styles.metaChip}>
                        <AppIcon name="pin-outline" size="xs" color={colors.text.muted} />
                        <AppText variant="caption" color="textMuted" style={styles.metaChipText}>
                          PIN: {addr.pinCode}
                        </AppText>
                      </View>
                    ) : null}

                    {addr.latitude && addr.longitude ? (
                      <View style={styles.metaChip}>
                        <AppIcon name="location-outline" size="xs" color={colors.primary.main} />
                        <AppText variant="caption" color="primary" style={styles.metaChipText}>
                          GPS: {addr.latitude.toFixed(3)}, {addr.longitude.toFixed(3)}
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  {!addr.isDefault && (
                    <TouchableOpacity
                      style={styles.setDefaultBtn}
                      onPress={() => handleSetDefault(addr)}
                      disabled={isSettingDef}
                      activeOpacity={0.7}
                    >
                      {isSettingDef ? (
                        <ActivityIndicator size="small" color={colors.primary.main} />
                      ) : (
                        <>
                          <AppIcon name="star-outline" size="xs" color={colors.primary.main} />
                          <AppText variant="labelSm" color="primary" style={styles.setDefaultText}>
                            Set as Default Service Address
                          </AppText>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </Card>
              );
            })}

            <TouchableOpacity style={styles.addMoreBtn} onPress={openAdd} activeOpacity={0.8}>
              <AppIcon name="add-circle-outline" size="md" color={colors.primary.main} />
              <AppText variant="labelLg" color="primary" style={styles.addMoreText}>
                Add New Address
              </AppText>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── Add / Edit Modal with Interactive Map Pin Picker ───────────────────── */}
      <Modal
        visible={formVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setFormVisible(false)}
      >
        <ScreenWrapper style={styles.modalScreenWrapper} keyboardAvoiding>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleGroup}>
              <AppText variant="headingSm" color="textPrimary">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </AppText>
              <AppText variant="caption" color="textMuted">
                {editingId
                  ? 'Update your service location on the map'
                  : 'Pin exact location on map to auto-fill address'}
              </AppText>
            </View>
            <TouchableOpacity
              onPress={() => setFormVisible(false)}
              style={styles.modalClose}
              activeOpacity={0.7}
            >
              <AppIcon name="close-outline" size="md" color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* ── Interactive Google Maps-style Pin Picker ── */}
            <AppText variant="labelMd" color="textPrimary" style={styles.mapSectionLabel}>
              1. Pin Location on Map:
            </AppText>
            <MapLocationPicker
              initialLatitude={latitude}
              initialLongitude={longitude}
              onLocationSelect={handleMapLocationSelect}
            />

            {/* ── Address Details Manual Review & Refine ── */}
            <AppText variant="labelMd" color="textPrimary" style={styles.detailsSectionLabel}>
              2. Review & Refine Address Details:
            </AppText>

            {/* Label Input */}
            <Input
              label="Address Label (Optional)"
              placeholder="e.g. Home, Office 2nd Floor, Parent's House"
              value={label}
              onChangeText={setLabel}
              leftIcon={<AppIcon name="bookmark-outline" size="sm" color={colors.primary.main} />}
            />

            {/* Address Type Chips */}
            <AppText variant="labelSm" color="textPrimary" style={styles.fieldLabel}>
              Address Type
            </AppText>
            <View style={styles.chipsRow}>
              {ADDRESS_TYPES.map((item) => {
                const active = addressType === item.type;
                return (
                  <TouchableOpacity
                    key={item.type}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setAddressType(item.type)}
                    activeOpacity={0.75}
                  >
                    <AppIcon
                      name={item.icon}
                      size="xs"
                      color={active ? colors.text.inverse : colors.primary.main}
                    />
                    <AppText
                      variant="caption"
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {item.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* House/Flat */}
            <View style={styles.gap}>
              <Input
                label="House / Flat / Building *"
                placeholder="e.g. Flat 402, Block B, Sunshine Heights"
                value={houseNo}
                onChangeText={(v) => {
                  setHouseNo(v);
                  setErrorMsg(null);
                }}
                leftIcon={<AppIcon name="home-outline" size="sm" color={colors.primary.main} />}
              />
            </View>

            {/* Street */}
            <View style={styles.gap}>
              <Input
                label="Street / Area / Colony *"
                placeholder="e.g. Green Avenue, Sector 15"
                value={street}
                onChangeText={(v) => {
                  setStreet(v);
                  setErrorMsg(null);
                }}
                leftIcon={<AppIcon name="location-outline" size="sm" color={colors.primary.main} />}
              />
            </View>

            {/* Landmark */}
            <View style={styles.gap}>
              <Input
                label="Landmark (Optional)"
                placeholder="e.g. Near Metro Station / Opposite Axis Bank"
                value={landmark}
                onChangeText={setLandmark}
                leftIcon={<AppIcon name="flag-outline" size="sm" color={colors.primary.main} />}
              />
            </View>

            {/* Country Selector */}
            <View style={styles.gap}>
              <Select
                label="Country"
                placeholder="Select country"
                value={countryId}
                options={countries}
                onSelect={onCountrySelect}
                searchable
                searchPlaceholder="Search Country…"
                leftIcon={<AppIcon name="globe-outline" size="sm" color={colors.primary.main} />}
              />
            </View>

            {/* State Selector */}
            <View style={styles.gap}>
              {statesLoading ? (
                <View style={styles.cascadeRow}>
                  <ActivityIndicator size="small" color={colors.primary.main} />
                  <AppText variant="caption" color="textMuted">Loading states…</AppText>
                </View>
              ) : (
                <Select
                  label="State / Province"
                  placeholder={!countryId ? 'Select country first' : 'Select state'}
                  value={stateId}
                  options={states}
                  onSelect={onStateSelect}
                  searchable
                  searchPlaceholder="Search State…"
                  disabled={!countryId || states.length === 0}
                  leftIcon={<AppIcon name="map-outline" size="sm" color={colors.primary.main} />}
                />
              )}
            </View>

            {/* City Selector */}
            <View style={styles.gap}>
              {citiesLoading ? (
                <View style={styles.cascadeRow}>
                  <ActivityIndicator size="small" color={colors.primary.main} />
                  <AppText variant="caption" color="textMuted">Loading cities…</AppText>
                </View>
              ) : (
                <Select
                  label="City / District"
                  placeholder={!stateId ? 'Select state first' : 'Select city'}
                  value={cityId}
                  options={cities}
                  onSelect={(opt) => setCityId(opt.value)}
                  searchable
                  searchPlaceholder="Search City…"
                  disabled={!stateId || cities.length === 0}
                  leftIcon={<AppIcon name="business-outline" size="sm" color={colors.primary.main} />}
                />
              )}
            </View>

            {/* PIN Code */}
            <View style={styles.gap}>
              <Input
                label="PIN Code *"
                placeholder="e.g. 110001"
                keyboardType="number-pad"
                maxLength={10}
                value={pinCode}
                onChangeText={(v) => {
                  setPinCode(v);
                  setErrorMsg(null);
                }}
                leftIcon={<AppIcon name="pin-outline" size="sm" color={colors.primary.main} />}
              />
            </View>

            {/* Set as Default Toggle */}
            <TouchableOpacity
              style={styles.defaultToggle}
              onPress={() => setIsDefault(!isDefault)}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleBox, isDefault && styles.toggleBoxActive]}>
                {isDefault && <AppIcon name="checkmark" size="xs" color={colors.text.inverse} />}
              </View>
              <AppText variant="bodyMd" color="textPrimary" style={styles.defaultToggleText}>
                Set as default service address
              </AppText>
            </TouchableOpacity>

            {/* Inline Error Message */}
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <AppIcon name="alert-circle-outline" size="xs" color={colors.status.danger} />
                <AppText variant="bodySm" style={styles.errorText}>{errorMsg}</AppText>
              </View>
            ) : null}
          </ScrollView>

          {/* Sticky Bottom Action Bar */}
          <View style={styles.modalBottomBar}>
            <Button
              title={saving ? 'Saving Address…' : editingId ? 'Update Address' : 'Save Service Address'}
              variant="cta"
              size="large"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.saveBtn}
            />
          </View>
        </ScreenWrapper>
      </Modal>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: spacing.md,
    },
    scroll: {
      paddingVertical: spacing.sm,
      paddingBottom: Math.max(insets.bottom + 40, spacing.xxl),
    },
    loader: {
      marginVertical: spacing.xl,
    },
    statusToast: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#D1FAE5',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      marginBottom: spacing.xs,
      borderWidth: 1,
      borderColor: '#A7F3D0',
      gap: 6,
    },
    statusToastText: {
      fontWeight: '700',
      color: '#047857',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    gap: {
      marginTop: spacing.md,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxl * 1.5,
      gap: spacing.md,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary.main + '14',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontWeight: '800',
    },
    emptySubtitle: {
      textAlign: 'center',
      maxWidth: 280,
      lineHeight: 18,
    },
    emptyBtn: {
      marginTop: spacing.sm,
      minWidth: 200,
    },
    addrCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
      ...shadows.small,
      marginBottom: spacing.md,
    },
    addrTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs + 2,
    },
    typePill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
      marginRight: spacing.xs,
      gap: 4,
    },
    typePillText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    defaultBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#D1FAE5',
      paddingHorizontal: spacing.xs + 4,
      paddingVertical: 2,
      borderRadius: radius.pill,
      gap: 3,
    },
    defaultBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#059669',
      letterSpacing: 0.5,
    },
    savedBadge: {
      backgroundColor: colors.background.default,
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    savedBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.text.muted,
    },
    iconBtn: {
      padding: spacing.xs,
      marginLeft: spacing.xs,
    },
    addrLabel: {
      fontWeight: '700',
      marginBottom: 2,
    },
    addrText: {
      lineHeight: 19,
    },
    addrMeta: {
      flexDirection: 'row',
      marginTop: spacing.xs + 4,
      gap: spacing.sm,
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.default,
      paddingHorizontal: spacing.xs + 4,
      paddingVertical: 2,
      borderRadius: radius.sm,
      gap: 4,
    },
    metaChipText: {
      fontSize: 11,
      fontWeight: '600',
    },
    setDefaultBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      gap: 4,
    },
    setDefaultText: {
      fontWeight: '700',
    },
    addMoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.primary.main,
      borderStyle: 'dashed',
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      gap: spacing.xs,
      marginTop: spacing.xs,
      backgroundColor: colors.primary.main + '08',
    },
    addMoreText: {
      fontWeight: '700',
    },
    modalScreenWrapper: {
      flex: 1,
      paddingHorizontal: spacing.md,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      marginBottom: spacing.xs,
    },
    modalTitleGroup: {
      flex: 1,
    },
    modalClose: {
      padding: spacing.xs,
    },
    modalScroll: {
      paddingVertical: spacing.sm,
      paddingBottom: spacing.xl,
    },
    mapSectionLabel: {
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    detailsSectionLabel: {
      fontWeight: '700',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    fieldLabel: {
      fontWeight: '700',
      marginBottom: spacing.xs + 2,
      marginTop: spacing.md,
    },
    chipsRow: {
      flexDirection: 'row',
      gap: spacing.xs + 2,
    },
    chip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background.default,
      borderRadius: radius.md,
      paddingVertical: spacing.xs + 4,
      borderWidth: 1,
      borderColor: colors.border.main,
      gap: 4,
    },
    chipActive: {
      backgroundColor: colors.primary.main,
      borderColor: colors.primary.main,
    },
    chipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text.primary,
    },
    chipTextActive: {
      color: colors.text.inverse,
    },
    cascadeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      gap: spacing.xs,
    },
    defaultToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    toggleBox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleBoxActive: {
      backgroundColor: colors.primary.main,
    },
    defaultToggleText: {
      fontWeight: '600',
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.status?.dangerLight || '#FEE2E2',
      borderRadius: radius.sm,
      padding: spacing.sm,
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    errorText: {
      color: colors.status.danger,
      flex: 1,
    },
    modalBottomBar: {
      paddingTop: spacing.sm,
      paddingBottom: Math.max(insets.bottom, spacing.sm),
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      backgroundColor: colors.background.default,
    },
    saveBtn: {},
    flex1: { flex: 1 },
  });
