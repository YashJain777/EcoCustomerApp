import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { HeroBanner } from '@shared/components/molecules/HeroBanner';
import { MetricStat } from '@shared/components/molecules/MetricStat';
import { QuickGridCard } from '@shared/components/molecules/QuickGridCard';
import { Card } from '@shared/components/atoms/Card';
import { Badge } from '@shared/components/atoms/Badge';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { dashboardApi } from '@infrastructure/api/dashboardApi';
import { customerApi } from '@infrastructure/api/customerApi';
import { CustomerDashboardData, CustomerProfile } from '@core/types/api';
import { spacing, radius, shadows, useTheme } from '@theme/index';

export const CustomerHomeScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [dashboardData, setDashboardData] = useState<CustomerDashboardData | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      const [dashRes, profileRes] = await Promise.allSettled([
        dashboardApi.getDashboard(),
        customerApi.getProfile(),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        setDashboardData(dashRes.value.data);
      }
      if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
        setProfile(profileRes.value.data);
      }
    } catch (err) {
      // Handled gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const rawData: any = dashboardData || {};
  const statsData = rawData.stats || rawData;

  const stats = {
    totalProducts:
      statsData.totalProducts ??
      statsData.totalRegisteredProducts ??
      statsData.registeredProducts ??
      0,
    activeBookings:
      statsData.activeBookings ??
      statsData.activeServices ??
      0,
    openComplaints:
      statsData.openComplaints ??
      statsData.pendingServices ??
      statsData.pendingComplaints ??
      0,
    activeAmcCount:
      statsData.activeAmcCount ??
      statsData.warrantyProducts ??
      statsData.activeWarranties ??
      0,
  };

  const customerName = profile?.name || (profile as any)?.fullName || '';

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary.main]} />
        }
      >
        {/* Top Header Bar with Avatar & Notifications */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SettingsScreen')}
            style={styles.profileRow}
          >
            {profile?.profilePic ? (
              <Image source={{ uri: profile.profilePic }} style={styles.avatarHeaderImg} />
            ) : (
              <View style={styles.avatarHeaderCircle}>
                <AppIcon name="person" size="md" color={colors.text.inverse} />
              </View>
            )}
            <View>
              <AppText variant="headingLg" color="textPrimary">
                Hi, {customerName ? <AppText variant="headingLg" color="primary">{customerName}</AppText> : 'Welcome Back'}
              </AppText>
              <AppText variant="caption" color="textSecondary">Smart Ecosystem Account</AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('NotificationCenterScreen')}
            activeOpacity={0.7}
          >
            <AppIcon name="notifications-outline" size="md" color={colors.text.primary} />
            <View style={styles.badgeDot} />
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <HeroBanner
          badgeText="SMART ECOSYSTEM"
          title="All Appliances Protected"
          subtitle="Manage products, track warranties, and book instant service visits."
          actionText="Scan & Add Product"
          onPressAction={() => navigation.navigate('CustomerQRScanScreen')}
        />

        {/* Symmetrical Metric Stats */}
        <AppText variant="headingLg" color="textPrimary" style={styles.sectionTitle}>Overview</AppText>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary.main} style={styles.loaderMargin} />
        ) : (
          <View style={styles.statsRow}>
            <MetricStat
              number={stats.totalProducts}
              label="My Products"
              iconName="cube-outline"
              iconColor={colors.category.productsIcon}
              bgColor={colors.category.productsBg}
              onPress={() => navigation.navigate('MyProductsScreenTab')}
            />
            <MetricStat
              number={stats.activeAmcCount}
              label="Active AMC/Warranty"
              iconName="shield-checkmark-outline"
              iconColor={colors.category.warrantyIcon}
              bgColor={colors.category.warrantyBg}
              onPress={() => navigation.navigate('MyProductsScreenTab')}
            />
            <MetricStat
              number={stats.openComplaints}
              label="Open Tickets"
              iconName="document-text-outline"
              iconColor={colors.category.complaintIcon}
              bgColor={colors.category.complaintBg}
              onPress={() => navigation.navigate('BookingsScreenTab')}
            />
          </View>
        )}

        {/* Quick Actions 4x2 Grid */}
        <AppText variant="headingLg" color="textPrimary" style={styles.sectionTitle}>Quick Actions</AppText>
        <View style={styles.quickGrid}>
          <QuickGridCard
            iconName="qr-code-outline"
            label="Scan QR"
            iconColor={colors.category.dashboardIcon}
            bgColor={colors.category.dashboardBg}
            onPress={() => navigation.navigate('CustomerQRScanScreen')}
          />
          <QuickGridCard
            iconName="cube-outline"
            label="Products"
            badgeCount={stats.totalProducts}
            iconColor={colors.category.productsIcon}
            bgColor={colors.category.productsBg}
            onPress={() => navigation.navigate('MyProductsScreenTab')}
          />
          <QuickGridCard
            iconName="construct-outline"
            label="Book Service"
            iconColor={colors.category.complaintIcon}
            bgColor={colors.category.complaintBg}
            onPress={() => navigation.navigate('BookServiceScreen')}
          />
          <QuickGridCard
            iconName="document-text-outline"
            label="Complaints"
            badgeCount={stats.openComplaints}
            iconColor={colors.category.complaintIcon}
            bgColor={colors.category.complaintBg}
            onPress={() => navigation.navigate('BookingsScreenTab')}
          />
          <QuickGridCard
            iconName="shield-checkmark-outline"
            label="AMC Plans"
            iconColor={colors.category.warrantyIcon}
            bgColor={colors.category.warrantyBg}
            onPress={() => navigation.navigate('AmcPlansScreen')}
          />
          <QuickGridCard
            iconName="wallet-outline"
            label="Wallet"
            iconColor={colors.category.walletIcon}
            bgColor={colors.category.walletBg}
            onPress={() => navigation.navigate('WalletScreen')}
          />
          <QuickGridCard
            iconName="receipt-outline"
            label="Invoices"
            iconColor={colors.category.productsIcon}
            bgColor={colors.category.productsBg}
            onPress={() => navigation.navigate('MyProductsScreenTab')}
          />
          <QuickGridCard
            iconName="headset-outline"
            label="Support"
            iconColor={colors.category.supportIcon}
            bgColor={colors.category.supportBg}
            onPress={() => navigation.navigate('HelpSupportScreen')}
          />
        </View>

        {/* Book Service for Any Appliance Banner */}
        <Card
          style={styles.externalServiceBanner}
          padding="md"
          variant="elevated"
          onPress={() => navigation.navigate('ExternalProductBookingScreen')}
          activeOpacity={0.8}
        >
          <View style={styles.externalBannerIcon}>
            <AppIcon name="construct" size="md" color={colors.primary.main} />
          </View>
          <View style={styles.externalBannerTextCol}>
            <View style={styles.externalBannerBadgeRow}>
              <Badge label="ALL BRANDS & MODELS" variant="primary" />
            </View>
            <AppText variant="headingSm" color="textPrimary" style={styles.externalBannerTitle}>
              Book Any Appliance Service
            </AppText>
            <AppText variant="caption" color="textSecondary">
              AC, Fridge, Washing Machine, TV repair by verified specialists
            </AppText>
          </View>
          <AppIcon name="chevron-forward" size="sm" color={colors.primary.main} />
        </Card>

        {/* Warranty / Appliance Alert Card */}
        {stats.totalProducts > 0 && (
          <>
            <View style={styles.alertHeaderRow}>
              <AppText variant="headingLg" color="textPrimary" style={styles.sectionTitle}>Warranty Protection</AppText>
              <TouchableOpacity onPress={() => navigation.navigate('MyProductsScreenTab')}>
                <AppText variant="labelMd" color="primary" style={styles.viewAllText}>View All</AppText>
              </TouchableOpacity>
            </View>

            <Card style={styles.warrantyAlertCard} padding="md" variant="flat">
              <View style={styles.alertLeftBadge}>
                <AppIcon name="shield-checkmark-outline" size="md" color={colors.text.inverse} />
              </View>
              <View style={styles.alertBody}>
                <AppText variant="headingSm" color="textPrimary" style={styles.alertTitle}>
                  {stats.totalProducts} Appliance(s) Registered
                </AppText>
                <AppText variant="bodyMd" color="textSecondary" style={styles.alertSubtitle}>
                  Warranty & service coverage active
                </AppText>
              </View>
              <TouchableOpacity
                style={styles.renewBtn}
                onPress={() => navigation.navigate('AmcPlansScreen')}
                activeOpacity={0.7}
              >
                <AppText variant="labelMd" color="primary" style={styles.renewBtnText}>Explore AMC</AppText>
              </TouchableOpacity>
            </Card>
          </>
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
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flex: 1,
  },
  avatarHeaderImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.primary.main,
  },
  avatarHeaderCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
  },
  greetingSub: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
    fontWeight: '500',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.background.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.small,
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cta.main,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    color: colors.cta.main,
    fontWeight: '700',
  },
  warrantyAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.warningBg,
    borderColor: colors.border.light,
    borderWidth: 1,
    marginTop: spacing.xs,
    borderRadius: radius.lg,
  },
  alertLeftBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.status.warning,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  alertBody: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  alertSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 1,
  },
  alertExpiry: {
    fontSize: 11,
    color: colors.status.warning,
    fontWeight: '600',
    marginTop: 2,
  },
  renewBtn: {
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.status.warning,
  },
  renewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.status.warning,
  },
  loaderMargin: {
    marginVertical: spacing.md,
  },
  externalServiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderColor: colors.primary.light,
    borderWidth: 1.5,
    borderRadius: radius.xl,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  externalBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  externalBannerTextCol: {
    flex: 1,
  },
  externalBannerBadgeRow: {
    marginBottom: 3,
  },
  externalBannerTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
});
