/**
 * @file CustomerHomeScreen.tsx
 * @feature Dashboard / Screens
 * @responsibility Industry-standard customer home dashboard showcasing total appliance protection, live active service tracker, overview metric stats, streamlined quick actions, and on-demand appliance booking.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { HeroBanner } from '@shared/components/molecules/HeroBanner';
import { MetricStat } from '@shared/components/molecules/MetricStat';
import { QuickGridCard } from '@shared/components/molecules/QuickGridCard';
import { Card } from '@shared/components/atoms/Card';
import { Badge, type BadgeVariant } from '@shared/components/atoms/Badge';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { Button } from '@shared/components/atoms/Button';
import { dashboardApi } from '@infrastructure/api/dashboardApi';
import { customerApi } from '@infrastructure/api/customerApi';
import { complaintApi } from '@infrastructure/api/complaintApi';
import { productApi } from '@infrastructure/api/productApi';
import {
  CustomerDashboardData,
  CustomerProfile,
  ComplaintTicket,
  CustomerProduct,
} from '@core/types/api';
import { spacing, radius, shadows, useTheme } from '@theme/index';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatStandardDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const CustomerHomeScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [dashboardData, setDashboardData] = useState<CustomerDashboardData | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [activeTickets, setActiveTickets] = useState<ComplaintTicket[]>([]);
  const [recentProducts, setRecentProducts] = useState<CustomerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHomeData = useCallback(async () => {
    try {
      const [dashRes, profileRes, complaintsRes, productsRes] = await Promise.allSettled([
        dashboardApi.getDashboard(),
        customerApi.getProfile(),
        complaintApi.getComplaints(),
        productApi.getMyProducts(),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        setDashboardData(dashRes.value.data);
      }
      if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
        setProfile(profileRes.value.data);
      }
      if (complaintsRes.status === 'fulfilled' && Array.isArray(complaintsRes.value?.data)) {
        // Filter for active/open tickets (not resolved, not cancelled)
        const openList = complaintsRes.value.data.filter(
          (t: ComplaintTicket) =>
            t.status === 'OPEN' ||
            t.status === 'PENDING_ACCEPTANCE' ||
            t.status === 'ASSIGNED' ||
            t.status === 'IN_PROGRESS' ||
            t.status === 'REOPENED'
        );
        setActiveTickets(openList);
      }
      if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value?.data)) {
        setRecentProducts(productsRes.value.data.slice(0, 3));
      }
    } catch (err) {
      // Handled gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

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
      recentProducts.length ??
      0,
    activeBookings:
      statsData.activeBookings ??
      statsData.activeServices ??
      activeTickets.length ??
      0,
    openComplaints:
      statsData.openComplaints ??
      statsData.pendingServices ??
      statsData.pendingComplaints ??
      activeTickets.length ??
      0,
    activeAmcCount:
      statsData.activeAmcCount ??
      statsData.warrantyProducts ??
      statsData.activeWarranties ??
      0,
  };

  const customerName = profile?.name || (profile as any)?.fullName || '';
  const primaryActiveTicket = activeTickets.length > 0 ? activeTickets[0] : null;

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
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
            <View style={styles.headerInfoCol}>
              <AppText variant="headingLg" color="textPrimary" numberOfLines={1}>
                Hi, {customerName ? <AppText variant="headingLg" color="primary">{customerName}</AppText> : 'Welcome Back'}
              </AppText>
              <View style={styles.accountBadgeRow}>
                <View style={styles.onlineDot} />
                <AppText variant="caption" color="textSecondary">Smart Ecosystem Account</AppText>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('NotificationCenterScreen')}
            activeOpacity={0.7}
          >
            <AppIcon name="notifications-outline" size="md" color={colors.text.primary} />
            {dashboardData?.notificationsCount ? (
              <View style={styles.badgeDot}>
                <AppText variant="caption" style={styles.badgeDotText}>
                  {dashboardData.notificationsCount > 9 ? '9+' : dashboardData.notificationsCount}
                </AppText>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Live Active Service Tracker Banner (if active job in progress) */}
        {primaryActiveTicket && (
          <Card
            style={styles.activeServiceCard}
            padding="md"
            variant="elevated"
            onPress={() =>
              navigation.navigate('ComplaintDetailScreen', {
                ticketId: primaryActiveTicket.id,
                ticket: primaryActiveTicket,
              })
            }
            activeOpacity={0.85}
          >
            <View style={styles.activeServiceHeader}>
              <View style={styles.activeServiceBadgeWrap}>
                <View style={styles.livePulseDot} />
                <AppText variant="labelSm" color="primary" style={styles.liveTrackingText}>
                  LIVE SERVICE TRACKER
                </AppText>
              </View>
              <Badge
                label={primaryActiveTicket.status.replace('_', ' ')}
                variant={primaryActiveTicket.status === 'IN_PROGRESS' || primaryActiveTicket.status === 'ASSIGNED' ? 'info' : 'warning'}
              />
            </View>

            <View style={styles.activeServiceMain}>
              <View style={styles.activeServiceIconThumb}>
                <AppIcon name="construct" size="md" color={colors.primary.main} />
              </View>
              <View style={styles.activeServiceInfo}>
                <AppText variant="labelMd" color="textPrimary" style={styles.boldText} numberOfLines={1}>
                  {primaryActiveTicket.serviceType?.name || primaryActiveTicket.title || 'Service in Progress'}
                </AppText>
                <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                  Ref: {primaryActiveTicket.ticketNumber || `SRV-${String(primaryActiveTicket.id).substring(0, 8).toUpperCase()}`}
                </AppText>
                {primaryActiveTicket.assignedMechanicName ? (
                  <View style={styles.activeTechRow}>
                    <AppIcon name="person-outline" size="xs" color={colors.primary.main} />
                    <AppText variant="caption" color="primary" style={styles.boldText}>
                      Technician: {primaryActiveTicket.assignedMechanicName}
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.activeTechRow}>
                    <AppIcon name="time-outline" size="xs" color={colors.status.warning} />
                    <AppText variant="caption" color="textMuted">
                      Technician allocation in progress
                    </AppText>
                  </View>
                )}
              </View>
              <AppIcon name="chevron-forward" size="sm" color={colors.primary.main} />
            </View>
          </Card>
        )}

        {/* Hero Banner */}
        <HeroBanner
          badgeText="SMART ECOSYSTEM"
          title="All Appliances Protected"
          subtitle="Manage appliances, track active warranties, and book certified technicians instantly."
          actionText="Scan & Add Product"
          onPressAction={() => navigation.navigate('CustomerQRScanScreenTab')}
        />

        {/* Symmetrical Metric Stats */}
        <View style={styles.sectionHeaderRow}>
          <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>Overview</AppText>
        </View>

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

        {/* Streamlined Quick Actions */}
        <View style={styles.sectionHeaderRow}>
          <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>Quick Actions</AppText>
        </View>

        <View style={styles.quickGrid}>
          <QuickGridCard
            iconName="document-text-outline"
            label="Complaints"
            badgeCount={stats.openComplaints}
            iconColor={colors.category.complaintIcon}
            bgColor={colors.category.complaintBg}
            style={styles.quickCard3Col}
            onPress={() => navigation.navigate('BookingsScreenTab')}
          />
          <QuickGridCard
            iconName="shield-checkmark-outline"
            label="AMC Plans"
            iconColor={colors.category.warrantyIcon}
            bgColor={colors.category.warrantyBg}
            style={styles.quickCard3Col}
            onPress={() => navigation.navigate('AmcPlansScreen')}
          />
          <QuickGridCard
            iconName="receipt-outline"
            label="Invoices"
            iconColor={colors.category.productsIcon}
            bgColor={colors.category.productsBg}
            style={styles.quickCard3Col}
            onPress={() => navigation.navigate('MyProductsScreenTab')}
          />
        </View>

        {/* Book Service for Any Appliance Banner */}
        <Card
          style={styles.externalServiceBanner}
          padding="md"
          variant="elevated"
          onPress={() => navigation.navigate('ExternalProductBookingScreen')}
          activeOpacity={0.85}
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
              AC, Refrigerator, Washing Machine, TV repair by certified technicians
            </AppText>
          </View>
          <AppIcon name="chevron-forward" size="sm" color={colors.primary.main} />
        </Card>

        {/* Registered Appliances Preview (if any) */}
        {recentProducts.length > 0 && (
          <View style={styles.recentProductsSection}>
            <View style={styles.sectionHeaderRow}>
              <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
                Registered Appliances
              </AppText>
              <TouchableOpacity onPress={() => navigation.navigate('MyProductsScreenTab')} activeOpacity={0.7}>
                <AppText variant="labelSm" color="primary" style={styles.viewAllText}>
                  View All ({stats.totalProducts})
                </AppText>
              </TouchableOpacity>
            </View>

            {recentProducts.map((p) => {
              const isWarrantyActive = Boolean(p.warranty?.active && new Date(p.warranty.endDate) >= new Date());
              return (
                <Card
                  key={p.id}
                  style={styles.productItemCard}
                  padding="md"
                  variant="flat"
                  onPress={() => navigation.navigate('ProductDetailScreen', { productId: p.id, product: p })}
                  activeOpacity={0.75}
                >
                  <View style={styles.productRow}>
                    <View style={styles.productIconThumb}>
                      <AppIcon name="cube-outline" size="sm" color={colors.primary.main} />
                    </View>
                    <View style={styles.productInfoCol}>
                      <AppText variant="labelMd" color="textPrimary" style={styles.boldText} numberOfLines={1}>
                        {p.productName || p.modelNumber || 'Registered Appliance'}
                      </AppText>
                      <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                        {p.brandName || p.brand || 'Authorized Unit'} • {p.categoryName || 'Appliance'}
                      </AppText>
                      <View style={styles.productMetaRow}>
                        <AppIcon
                          name={isWarrantyActive ? 'shield-checkmark' : 'shield-outline'}
                          size="xs"
                          color={isWarrantyActive ? colors.category.emeraldIcon : colors.status.warning}
                        />
                        <AppText
                          variant="caption"
                          style={isWarrantyActive ? styles.warrantyActiveText : styles.warrantyExpiredText}
                        >
                          {isWarrantyActive ? 'Warranty Active' : 'Warranty Expired'}
                        </AppText>
                      </View>
                    </View>
                    <AppIcon name="chevron-forward" size="xs" color={colors.text.muted} />
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* AMC Protection / Warranty Extended Banner */}
        {stats.totalProducts > 0 && (
          <Card style={styles.warrantyAlertCard} padding="md" variant="flat">
            <View style={styles.alertLeftBadge}>
              <AppIcon name="shield-checkmark-outline" size="md" color={colors.text.inverse} />
            </View>
            <View style={styles.alertBody}>
              <AppText variant="headingSm" color="textPrimary" style={styles.alertTitle}>
                {stats.totalProducts} Unit(s) in Protection Vault
              </AppText>
              <AppText variant="bodySm" color="textSecondary" style={styles.alertSubtitle}>
                Get zero-cost repair visits with Annual Maintenance Plans.
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.renewBtn}
              onPress={() => navigation.navigate('AmcPlansScreen')}
              activeOpacity={0.7}
            >
              <AppText variant="labelSm" color="primary" style={styles.renewBtnText}>
                Explore AMC
              </AppText>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      flex: 1,
    },
    scrollContent: {
      paddingTop: spacing.xs,
      paddingBottom: spacing.xxl + 20,
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
      minWidth: 0,
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
    headerInfoCol: {
      flex: 1,
      minWidth: 0,
    },
    accountBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 2,
    },
    onlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.category.emeraldIcon || colors.status.success,
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
      top: 6,
      right: 6,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.status.danger,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeDotText: {
      color: colors.text.inverse,
      fontSize: 9,
      fontWeight: '800',
    },
    activeServiceCard: {
      backgroundColor: colors.background.paper,
      borderColor: colors.primary.main,
      borderWidth: 1.5,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    activeServiceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs + 2,
    },
    activeServiceBadgeWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    livePulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.status.danger,
    },
    liveTrackingText: {
      fontWeight: '800',
      letterSpacing: 0.5,
      fontSize: 10,
    },
    activeServiceMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 4,
    },
    activeServiceIconThumb: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    activeServiceInfo: {
      flex: 1,
      minWidth: 0,
    },
    activeTechRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 3,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.xs + 2,
    },
    sectionTitle: {
      fontWeight: '700',
    },
    viewAllText: {
      fontWeight: '700',
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
    quickCard3Col: {
      width: '31%',
    },
    externalServiceBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.paper,
      borderColor: colors.primary.light,
      borderWidth: 1.5,
      borderRadius: radius.xl,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    externalBannerIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm + 2,
      flexShrink: 0,
    },
    externalBannerTextCol: {
      flex: 1,
      minWidth: 0,
    },
    externalBannerBadgeRow: {
      marginBottom: 3,
    },
    externalBannerTitle: {
      fontWeight: '700',
      marginBottom: 2,
    },
    recentProductsSection: {
      marginBottom: spacing.md,
    },
    productItemCard: {
      marginBottom: spacing.xs + 2,
      backgroundColor: colors.background.paper,
      borderColor: colors.border.light,
      borderWidth: 1,
    },
    productRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    productIconThumb: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    productInfoCol: {
      flex: 1,
      minWidth: 0,
    },
    productMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    warrantyActiveText: {
      color: colors.category.emeraldIcon || colors.status.success,
      fontWeight: '700',
      fontSize: 11,
    },
    warrantyExpiredText: {
      color: colors.status.warning,
      fontWeight: '600',
      fontSize: 11,
    },
    warrantyAlertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.status.warningBg,
      borderColor: colors.border.light,
      borderWidth: 1,
      marginTop: spacing.xs,
      borderRadius: radius.lg,
      marginBottom: spacing.md,
    },
    alertLeftBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.status.warning,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
      flexShrink: 0,
    },
    alertBody: {
      flex: 1,
      minWidth: 0,
    },
    alertTitle: {
      fontWeight: '700',
    },
    alertSubtitle: {
      marginTop: 2,
      lineHeight: 16,
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
      fontWeight: '700',
      color: colors.status.warning,
    },
    loaderMargin: {
      marginVertical: spacing.md,
    },
    boldText: {
      fontWeight: '700',
    },
  });
