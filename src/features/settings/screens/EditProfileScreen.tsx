import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Header } from '@shared/components/molecules/Header';
import { Card } from '@shared/components/atoms/Card';
import { Input } from '@shared/components/atoms/Input';
import { Button } from '@shared/components/atoms/Button';
import { AppIcon } from '@shared/components/atoms/Icon';
import { Select, SelectOption } from '@shared/components/molecules/Select';
import { customerApi, LocationItem } from '@infrastructure/api/customerApi';
import { CustomerProfile } from '@core/types/api';
import { spacing, radius, shadows, useTheme } from '@theme/index';

export const EditProfileScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);

  // Location / State / City options
  const [statesList, setStatesList] = useState<LocationItem[]>([]);
  const [citiesList, setCitiesList] = useState<LocationItem[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [profileRes, countriesRes] = await Promise.allSettled([
        customerApi.getProfile(),
        customerApi.getCountries(),
      ]);

      let indiaStateList: LocationItem[] = [];

      if (countriesRes.status === 'fulfilled' && countriesRes.value?.data) {
        const india = countriesRes.value.data.find(c => c.name.toLowerCase() === 'india');
        if (india) {
          const statesRes = await customerApi.getStates(india.id);
          if (statesRes.success && statesRes.data) {
            indiaStateList = statesRes.data;
            setStatesList(indiaStateList);
          }
        } else {
          const statesRes = await customerApi.getStates();
          if (statesRes.success && statesRes.data) {
            indiaStateList = statesRes.data;
            setStatesList(indiaStateList);
          }
        }
      }

      if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
        const p: CustomerProfile = profileRes.value.data;
        setName(p.name || (p as any).fullName || '');
        setMobile(p.mobile || '');
        setEmail(p.email || '');
        setAddress(p.address || '');
        setPinCode(p.pinCode || '');
        if (p.profilePic) {
          setProfilePic(p.profilePic);
        }

        const cityObj = typeof p.city === 'object' ? p.city : null;
        const rawCityName = cityObj ? cityObj.name : (typeof p.city === 'string' ? p.city : undefined);
        const rawCityId = cityObj?.id;
        const rawStateId = cityObj?.stateId;

        if (rawStateId) {
          setSelectedStateId(rawStateId);
          if (rawCityId) {
            setSelectedCityId(rawCityId);
          }
          const stateCitiesRes = await customerApi.getCities(rawStateId);
          if (stateCitiesRes?.data) {
            setCitiesList(stateCitiesRes.data);
          }
        } else if (rawCityId || rawCityName) {
          const allCitiesRes = await customerApi.getCities();
          if (allCitiesRes?.data) {
            const cityMatch = allCitiesRes.data.find(
              (c) => (rawCityId && c.id === rawCityId) || (rawCityName && c.name.toLowerCase() === rawCityName.toLowerCase())
            );

            if (cityMatch) {
              setSelectedCityId(cityMatch.id);
              if (cityMatch.stateId) {
                setSelectedStateId(cityMatch.stateId);
                const stateCities = allCitiesRes.data.filter(c => c.stateId === cityMatch.stateId);
                setCitiesList(stateCities);
              }
            }
          }
        }
      }
    } catch (err) {
      // Gracefully handled
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    Alert.alert(
      'Profile Photo',
      'Choose photo from gallery or take a new picture',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const res = await launchCamera({ mediaType: 'photo', quality: 0.7, includeBase64: true });
              if (res.assets && res.assets[0]) {
                const asset = res.assets[0];
                const uri = asset.base64 ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}` : asset.uri;
                if (uri) setProfilePic(uri);
              }
            } catch (err) {
              Alert.alert('Photo Error', 'Could not open camera.');
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            try {
              const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.7, includeBase64: true });
              if (res.assets && res.assets[0]) {
                const asset = res.assets[0];
                const uri = asset.base64 ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}` : asset.uri;
                if (uri) setProfilePic(uri);
              }
            } catch (err) {
              Alert.alert('Photo Error', 'Could not select photo.');
            }
          },
        },
        ...(profilePic
          ? [
              {
                text: 'Remove Photo',
                style: 'destructive' as const,
                onPress: () => setProfilePic(null),
              },
            ]
          : []),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleStateSelect = async (option: SelectOption) => {
    setSelectedStateId(option.value);
    setSelectedCityId('');
    setCitiesList([]);
    setCitiesLoading(true);

    try {
      const citiesRes = await customerApi.getCities(option.value);
      if (citiesRes?.data) {
        setCitiesList(citiesRes.data);
      }
    } catch (err) {
      // Ignored
    } finally {
      setCitiesLoading(false);
    }
  };

  const handleCitySelect = (option: SelectOption) => {
    setSelectedCityId(option.value);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setErrorMsg('Full name is required');
      return;
    }
    setErrorMsg('');
    setSaveLoading(true);

    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        pinCode: pinCode.trim() || undefined,
        profilePic: profilePic || null,
      };

      if (selectedCityId && selectedCityId.trim().length > 0 && selectedCityId !== 'invalid') {
        payload.cityId = selectedCityId;
      }

      const res = await customerApi.updateProfile(payload);
      setSaveLoading(false);

      if (res.success || res.data) {
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => {
          navigation.goBack();
        }, 1200);
      }
    } catch (err: any) {
      setSaveLoading(false);
      const errorMessage = err?.error?.details?.cityId
        ? 'Please select a valid city from the list.'
        : err?.message || err?.error?.message || 'Failed to update profile details';
      setErrorMsg(errorMessage);
    }
  };

  const stateOptions: SelectOption[] = statesList.map((st) => ({
    label: st.name,
    value: st.id,
  }));

  const cityOptions: SelectOption[] = citiesList.map((ct) => ({
    label: ct.name,
    value: ct.id,
  }));

  return (
    <ScreenWrapper style={styles.container} keyboardAvoiding>
      <Header
        title="Edit Profile"
        subtitle="Update your personal & address details"
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading Profile Details...</Text>
        </View>
      ) : (
        <Card style={styles.formCard} padding="lg">
          {/* Avatar Header */}
          <View style={styles.avatarRow}>
            <TouchableOpacity activeOpacity={0.8} onPress={handlePickPhoto} style={styles.avatarWrapper}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarCircle}>
                  <AppIcon name="person" size="xl" color={colors.text.inverse} />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <AppIcon name="camera-outline" size="xs" color={colors.text.inverse} />
              </View>
            </TouchableOpacity>
            <View style={styles.avatarMeta}>
              <Text style={styles.avatarName}>{name}</Text>
              <TouchableOpacity onPress={handlePickPhoto}>
                <Text style={styles.changePhotoBtnText}>Tap to change photo</Text>
              </TouchableOpacity>
              <Text style={styles.avatarSub}>Verified Customer Account</Text>
            </View>
          </View>

          {/* Personal Information */}
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Input
            label="Full Name *"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="Enter your full name"
            leftIcon={<AppIcon name="person-outline" size="sm" color={colors.primary.main} />}
          />

          <Input
            label="Mobile Number (Verified)"
            value={mobile ? `+91 ${mobile}` : ''}
            editable={false}
            placeholder="Mobile number"
            leftIcon={<AppIcon name="call-outline" size="sm" color={colors.text.muted} />}
            style={styles.readOnlyInput}
          />

          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="e.g. customer@example.com"
            leftIcon={<AppIcon name="mail-outline" size="sm" color={colors.primary.main} />}
          />

          {/* Address Information */}
          <View style={styles.addressHeaderRow}>
            <Text style={styles.sectionTitle}>Address Details</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SavedAddressesScreen')}
              activeOpacity={0.7}
            >
              <Text style={styles.manageLinkText}>Manage Saved Addresses ➔</Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Street Address / Building"
            value={address}
            onChangeText={setAddress}
            placeholder="Flat no., Building, Street name"
            leftIcon={<AppIcon name="location-outline" size="sm" color={colors.primary.main} />}
          />

          {/* State Select */}
          <Select
            label="State"
            placeholder="Select State"
            value={selectedStateId}
            options={stateOptions}
            onSelect={handleStateSelect}
            searchable
            searchPlaceholder="Search State..."
            leftIcon={<AppIcon name="map-outline" size="sm" color={colors.primary.main} />}
          />

          {/* City Select - Filtered strictly by selected State */}
          <Select
            label="City"
            placeholder={
              citiesLoading
                ? 'Loading Cities...'
                : selectedStateId
                ? 'Select City'
                : 'Select State First'
            }
            value={selectedCityId}
            options={cityOptions}
            onSelect={handleCitySelect}
            searchable
            searchPlaceholder="Search City..."
            leftIcon={<AppIcon name="business-outline" size="sm" color={colors.primary.main} />}
            disabled={citiesLoading || (!selectedStateId && cityOptions.length === 0)}
          />

          <Input
            label="Pincode"
            value={pinCode}
            onChangeText={setPinCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="6-digit Pincode"
            leftIcon={<AppIcon name="pin-outline" size="sm" color={colors.primary.main} />}
          />

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

          <Button
            title="Save Profile Changes"
            variant="cta"
            size="large"
            onPress={handleSaveProfile}
            loading={saveLoading}
            style={styles.saveBtn}
          />
        </Card>
      )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  formCard: {
    borderRadius: radius.xl,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.primary.main,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface || colors.background?.default || '#FFFFFF',
    ...shadows.small,
  },
  avatarMeta: {
    flex: 1,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  changePhotoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.main,
    marginTop: 2,
  },
  avatarSub: {
    fontSize: 12,
    color: colors.cta.main,
    fontWeight: '700',
    marginTop: 2,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  manageLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.main,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary.main,
  },
  readOnlyInput: {
    backgroundColor: colors.background.default,
    opacity: 0.8,
  },
  errorText: {
    fontSize: 12,
    color: colors.status.danger,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  successText: {
    fontSize: 12,
    color: colors.status.success,
    textAlign: 'center',
    marginVertical: spacing.xs,
    fontWeight: '700',
  },
  saveBtn: {
    marginTop: spacing.md,
  },
});
