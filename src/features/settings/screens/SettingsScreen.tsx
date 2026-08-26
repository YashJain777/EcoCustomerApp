import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity, Image } from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Header } from '@shared/components/molecules/Header';
import { Card } from '@shared/components/atoms/Card';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { setAuthToken } from '@infrastructure/api/axiosInstance';
import { customerApi } from '@infrastructure/api/customerApi';
import { CustomerProfile } from '@core/types/api';
import { spacing, radius, shadows, useTheme } from '@theme/index';

export const SettingsScreen = ({ navigation }: any) => {
  const { theme, isDark, setThemeMode } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await customerApi.getProfile();
        if (res?.data) {
          setProfile(res.data);
        }
      } catch (err) {
        // Ignored
      }
    };

    fetchProfile();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
    });

    return unsubscribe;
  }, [navigation]);

  const handleLogout = () => {
    setAuthToken(null);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth', params: { screen: 'CustomerLoginScreen' } }],
    });
  };

  const displayName = profile?.name || (profile as any)?.fullName || 'Smart Customer';
  const displayMobile = profile?.mobile ? `+91 ${profile.mobile}` : '';
  const displayEmail = profile?.email || '';

  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="Settings & Profile"
        subtitle="Account preferences & legal"
        onBackPress={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Summary Card */}
        <Card style={styles.profileCard} padding="lg">
          {profile?.profilePic ? (
            <Image source={{ uri: profile.profilePic }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarCircle}>
              <AppIcon name="person" size="lg" color={colors.text.inverse} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <AppText variant="headingMd" color="textPrimary" style={styles.profileName}>
              {displayName}
            </AppText>
            {displayMobile ? (
              <AppText variant="bodySm" color="textSecondary" style={styles.profilePhone}>
                {displayMobile}
              </AppText>
            ) : null}
            {displayEmail ? (
              <AppText variant="caption" color="textMuted" style={styles.profileEmail}>
                {displayEmail}
              </AppText>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfileScreen')}
            activeOpacity={0.7}
            accessibilityLabel="Edit Profile"
          >
            <AppIcon name="create-outline" size="sm" color={colors.primary.main} />
          </TouchableOpacity>
        </Card>

        {/* General Group */}
        <AppText variant="headingSm" color="textPrimary" style={styles.groupTitle}>
          General Preferences
        </AppText>
        <Card style={styles.groupCard} padding="none">
          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SavedAddressesScreen')}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.itemIconBg, { backgroundColor: colors.category.emeraldBg }]}>
                <AppIcon name="location-outline" size="sm" color={colors.category.emeraldIcon} />
              </View>
              <AppText variant="bodyMd" color="textPrimary" style={styles.itemTitle}>
                Saved Service Addresses
              </AppText>
            </View>
            <AppIcon name="chevron-forward" size="xs" color={colors.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MyReviewsScreen')}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.itemIconBg, { backgroundColor: colors.category.amberBg }]}>
                <AppIcon name="star-outline" size="sm" color={colors.category.amberIcon} />
              </View>
              <AppText variant="bodyMd" color="textPrimary" style={styles.itemTitle}>
                My Ratings & Reviews
              </AppText>
            </View>
            <AppIcon name="chevron-forward" size="xs" color={colors.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIconBg, { backgroundColor: colors.category.indigoBg }]}>
                <AppIcon name="globe-outline" size="sm" color={colors.category.indigoIcon} />
              </View>
              <AppText variant="bodyMd" color="textPrimary" style={styles.itemTitle}>
                App Language
              </AppText>
            </View>
            <View style={styles.itemRight}>
              <AppText variant="bodySm" color="textSecondary" style={styles.valueText}>
                English
              </AppText>
              <AppIcon name="chevron-forward" size="xs" color={colors.text.muted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MyReviewsScreen')}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.itemIconBg, { backgroundColor: colors.category.amberBg }]}>
                <AppIcon name="star-outline" size="sm" color={colors.category.amberIcon} />
              </View>
              <AppText variant="bodyMd" color="textPrimary" style={styles.itemTitle}>
                My Ratings & Reviews
              </AppText>
            </View>
            <AppIcon name="chevron-forward" size="xs" color={colors.text.muted} />
          </TouchableOpacity>

          <View style={[styles.settingItem, styles.lastItem]}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIconBg, { backgroundColor: colors.category.purpleBg }]}>
                <AppIcon name="moon-outline" size="sm" color={colors.category.purpleIcon} />
              </View>
              <AppText variant="bodyMd" color="textPrimary" style={styles.itemTitle}>
                Dark Mode
              </AppText>
            </View>
            <Switch
              value={isDark}
              onValueChange={(val) => setThemeMode(val ? 'dark' : 'light')}
              trackColor={{ false: colors.border.main, true: colors.primary.main }}
            />
          </View>
        </Card>

        {/* Privacy & Info Group */}
        <AppText variant="labelMd" style={styles.groupTitle}>Privacy & Legal</AppText>
        <Card style={styles.groupCard} padding="none">
          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIconBg, { backgroundColor: colors.category.amberBg }]}>
                <AppIcon name="shield-checkmark-outline" size="sm" color={colors.category.amberIcon} />
              </View>
              <AppText variant="bodyMd" style={styles.itemTitle}>Privacy Policy</AppText>
            </View>
            <AppIcon name="chevron-forward" size="xs" color={colors.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('TermsConditionsScreen')}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.itemIconBg, { backgroundColor: colors.category.slateBg }]}>
                <AppIcon name="document-text-outline" size="sm" color={colors.category.slateIcon} />
              </View>
              <AppText variant="bodyMd" style={styles.itemTitle}>Terms & Conditions</AppText>
            </View>
            <AppIcon name="chevron-forward" size="xs" color={colors.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, styles.lastItem]}
            onPress={() => navigation.navigate('AboutAppScreen')}
            activeOpacity={0.7}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.itemIconBg, { backgroundColor: colors.category.indigoBg }]}>
                <AppIcon name="information-circle-outline" size="sm" color={colors.category.indigoIcon} />
              </View>
              <AppText variant="bodyMd" style={styles.itemTitle}>About App</AppText>
            </View>
            <View style={styles.itemRight}>
              <AppText variant="bodySm" style={styles.valueText}>Version 1.0.0</AppText>
              <AppIcon name="chevron-forward" size="xs" color={colors.text.muted} />
            </View>
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <AppIcon name="log-out-outline" size="sm" color={colors.status.danger} style={styles.logoutIcon} />
          <AppText variant="labelLg" style={styles.logoutText}>Log Out Account</AppText>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    ...shadows.small,
  },
  avatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
  },
  profilePhone: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
    fontWeight: '500',
  },
  profileEmail: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 1,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  groupCard: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconBg: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 13,
    color: colors.text.muted,
    marginRight: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.dangerBg,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.status.danger + '30',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.status.danger,
  },
});
