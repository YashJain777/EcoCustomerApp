/**
 * @file AmcPlansScreen.tsx
 * @feature AMC / Screens
 * @responsibility Comprehensive Annual Maintenance Contract (AMC) management and discovery screen.
 *                 Allows customers to track active protection plans, view logged maintenance visits,
 *                 and discover + purchase verified local AMC plans by appliance category.
 *                 Adheres strictly to DESIGN_SYSTEM.md standards.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { SegmentedTabs } from '@shared/components/molecules/SegmentedTabs';
import { Header } from '@shared/components/molecules/Header';
import { Badge } from '@shared/components/atoms/Badge';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { EmptyState } from '@shared/components/molecules/EmptyState';
import { Card } from '@shared/components/atoms/Card';
import { Button } from '@shared/components/atoms/Button';
import { spacing, radius, shadows, useTheme } from '@theme/index';
import { amcApi } from '@infrastructure/api/amcApi';
import { bookingApi } from '@infrastructure/api/bookingApi';
import { customerApi } from '@infrastructure/api/customerApi';
import { LocalAmcPlan, MyAmcPlan } from '@core/types/amc.types';
import { ProductCategory } from '@core/types/api';
import { Select, SelectOption } from '@shared/components/molecules/Select';
import { AmcPlanCard } from '../components/AmcPlanCard';
import { MySubscriptionCard } from '../components/MySubscriptionCard';
import { AmcCheckoutSheet } from '../components/AmcCheckoutSheet';

type MainTab = 'my_plans' | 'discover';
type SubFilter = 'all' | 'active' | 'expired';

export const AmcPlansScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Main Tab State
  const [mainTab, setMainTab] = useState<MainTab>('my_plans');
  const [subFilter, setSubFilter] = useState<SubFilter>('active');

  // Data States
  const [myPlans, setMyPlans] = useState<MyAmcPlan[]>([]);
  const [localPlans, setLocalPlans] = useState<LocalAmcPlan[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Location info
  const [userLocationLabel, setUserLocationLabel] = useState<string>('My Area (10 km radius)');
  const [userCoordinates, setUserCoordinates] = useState<{ lat?: number; lng?: number }>({});

  // Loading & Refreshing
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Checkout Sheet
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState<LocalAmcPlan | null>(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  // Fetch Customer Address for Location-Aware AMC Discovery
  useEffect(() => {
    customerApi.getAddresses()
      .then((res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          const defaultAddr = res.data.find((a) => a.isDefault) || res.data[0];
          if (defaultAddr.cityName) {
            setUserLocationLabel(`${defaultAddr.cityName} (Within 15 km)`);
          }
          if (defaultAddr.latitude && defaultAddr.longitude) {
            setUserCoordinates({ lat: defaultAddr.latitude, lng: defaultAddr.longitude });
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Appliance Categories for Filter Strip
  useEffect(() => {
    bookingApi.getCategories({ limit: 20 })
      .then((res) => {
        if (res?.success && res.data) {
          const items = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
          setCategories(items);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch All AMC Data
  const fetchData = useCallback(async () => {
    try {
      setErrorMsg(null);
      const [myRes, localRes] = await Promise.allSettled([
        amcApi.getMyPlans(),
        amcApi.getLocalPlans({
          lat: userCoordinates.lat,
          lng: userCoordinates.lng,
          categoryId: selectedCategoryId || undefined,
        }),
      ]);

      if (myRes.status === 'fulfilled' && (myRes.value?.success || myRes.value?.data)) {
        const raw = myRes.value.data || (myRes.value as any);
        setMyPlans(Array.isArray(raw) ? raw : []);
      } else {
        setMyPlans([]);
      }

      if (localRes.status === 'fulfilled' && (localRes.value?.success || localRes.value?.data)) {
        const raw = localRes.value.data || (localRes.value as any);
        setLocalPlans(Array.isArray(raw) ? raw : []);
      } else {
        setLocalPlans([]);
      }
    } catch (err: any) {
      setErrorMsg(err?.error?.message || err?.message || 'Failed to load AMC data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userCoordinates.lat, userCoordinates.lng, selectedCategoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filtered Subscriptions
  const activePlansCount = useMemo(
    () => myPlans.filter((p) => p.status === 'ACTIVE').length,
    [myPlans]
  );
  const expiredPlansCount = useMemo(
    () => myPlans.filter((p) => p.status === 'EXPIRED').length,
    [myPlans]
  );

  const filteredMyPlans = useMemo(() => {
    if (subFilter === 'active') return myPlans.filter((p) => p.status === 'ACTIVE');
    if (subFilter === 'expired') return myPlans.filter((p) => p.status === 'EXPIRED');
    return myPlans;
  }, [myPlans, subFilter]);

  const categoryOptions: SelectOption[] = useMemo(() => {
    const allOption: SelectOption = {
      label: 'All Appliance Categories',
      value: '',
      sublabel: 'View all protection plans across all appliance categories',
      icon: 'grid-outline',
    };
    const catOptions: SelectOption[] = categories.map((cat) => ({
      label: cat.name,
      value: cat.id,
      sublabel: cat.description || `AMC protection plans for ${cat.name}`,
      icon: 'construct-outline',
    }));
    return [allOption, ...catOptions];
  }, [categories]);

  // Open Checkout Sheet
  const handleOpenSubscribe = (plan: LocalAmcPlan) => {
    setSelectedPlanForPurchase(plan);
    setCheckoutVisible(true);
  };

  // Handle Successful Purchase
  const handlePurchaseSuccess = (purchased: MyAmcPlan) => {
    setMainTab('my_plans');
    setSubFilter('active');
    fetchData();
  };

  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="AMC & Protection Plans"
        subtitle="Annual maintenance from certified specialists"
        onBackPress={() => navigation.goBack()}
      />

      {/* Main Mode Segmented Tabs */}
      <View style={styles.tabWrapper}>
        <SegmentedTabs
          tabs={[
            { id: 'my_plans', label: 'My Protection Plans', count: myPlans.length },
            { id: 'discover', label: 'Discover Local Plans', count: localPlans.length },
          ]}
          activeTab={mainTab}
          onSelectTab={(tabId) => setMainTab(tabId as MainTab)}
        />
      </View>

      {errorMsg ? (
        <View style={styles.errorBanner}>
          <AppIcon name="alert-circle-outline" size="sm" color={colors.status.danger} />
          <AppText variant="caption" color="textSecondary" style={styles.errorText}>
            {errorMsg}
          </AppText>
          <TouchableOpacity onPress={fetchData} activeOpacity={0.7}>
            <AppText variant="labelSm" color="primary">
              Retry
            </AppText>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Mode 1: My Protection Plans */}
      {mainTab === 'my_plans' && (
        <View style={styles.flex1}>
          {/* Sub-Filter Pills (Active / Expired) */}
          <View style={styles.subFilterRow}>
            <TouchableOpacity
              style={[
                styles.subFilterChip,
                subFilter === 'active' && styles.subFilterChipActive,
              ]}
              onPress={() => setSubFilter('active')}
              activeOpacity={0.8}
            >
              <AppText
                variant="labelSm"
                style={subFilter === 'active' ? styles.subFilterTextActive : styles.subFilterText}
              >
                Active ({activePlansCount})
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.subFilterChip,
                subFilter === 'expired' && styles.subFilterChipActive,
              ]}
              onPress={() => setSubFilter('expired')}
              activeOpacity={0.8}
            >
              <AppText
                variant="labelSm"
                style={subFilter === 'expired' ? styles.subFilterTextActive : styles.subFilterText}
              >
                Expired ({expiredPlansCount})
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.subFilterChip,
                subFilter === 'all' && styles.subFilterChipActive,
              ]}
              onPress={() => setSubFilter('all')}
              activeOpacity={0.8}
            >
              <AppText
                variant="labelSm"
                style={subFilter === 'all' ? styles.subFilterTextActive : styles.subFilterText}
              >
                All ({myPlans.length})
              </AppText>
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loaderCenter}>
              <ActivityIndicator size="large" color={colors.primary.main} />
              <AppText variant="bodySm" color="textMuted" style={styles.loadingText}>
                Loading your protection subscriptions...
              </AppText>
            </View>
          ) : (
            <FlatList
              data={filteredMyPlans}
              keyExtractor={(item, index) => item.id || `my-amc-${index}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary.main]}
                  tintColor={colors.primary.main}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <EmptyState
                    iconName="shield-outline"
                    title={
                      subFilter === 'active'
                        ? 'No Active AMC Subscriptions'
                        : 'No AMC Plans in this Filter'
                    }
                    description="Protect your appliances against costly breakdowns with certified annual maintenance."
                  />
                  <Button
                    title="Explore Nearby AMC Plans →"
                    variant="primary"
                    size="medium"
                    onPress={() => setMainTab('discover')}
                    style={styles.emptyCta}
                  />
                </View>
              }
              renderItem={({ item }) => (
                <MySubscriptionCard subscription={item} />
              )}
            />
          )}
        </View>
      )}

      {/* Mode 2: Discover Local Plans */}
      {mainTab === 'discover' && (
        <View style={styles.flex1}>
          {/* Location Radius Header Bar */}
          <View style={styles.locationBar}>
            <View style={styles.locationLeft}>
              <AppIcon name="location" size="xs" color={colors.primary.main} />
              <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                {userLocationLabel}
              </AppText>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('SavedAddressesScreen')}
              activeOpacity={0.7}
            >
              <AppText variant="caption" color="primary" style={styles.changeLocText}>
                Change
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Appliance Category Filter Dropdown */}
          <Select
            label="Filter by Appliance Category"
            placeholder="Select appliance category..."
            value={selectedCategoryId}
            options={categoryOptions}
            onSelect={(opt) => setSelectedCategoryId(opt.value)}
            leftIcon={<AppIcon name="grid-outline" size="sm" color={colors.primary.main} />}
            searchable
            searchPlaceholder="Search appliance categories..."
            style={styles.categoryDropdown}
          />

          {loading && !refreshing ? (
            <View style={styles.loaderCenter}>
              <ActivityIndicator size="large" color={colors.primary.main} />
              <AppText variant="bodySm" color="textMuted" style={styles.loadingText}>
                Discovering local AMC protection plans...
              </AppText>
            </View>
          ) : (
            <FlatList
              data={localPlans}
              keyExtractor={(item, index) => item.id || `local-amc-${index}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary.main]}
                  tintColor={colors.primary.main}
                />
              }
              ListEmptyComponent={
                <EmptyState
                  iconName="search-outline"
                  title="No Local AMC Plans Found"
                  description="There are currently no active maintenance plans for this category in your area. Try changing the category or location."
                />
              }
              renderItem={({ item }) => (
                <AmcPlanCard plan={item} onSubscribe={handleOpenSubscribe} />
              )}
            />
          )}
        </View>
      )}

      {/* AMC Checkout Bottom Sheet Modal */}
      <AmcCheckoutSheet
        visible={checkoutVisible}
        plan={selectedPlanForPurchase}
        onClose={() => setCheckoutVisible(false)}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.md,
    },
    flex1: {
      flex: 1,
    },
    tabWrapper: {
      marginVertical: spacing.xs + 2,
    },
    subFilterRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
    },
    subFilterChip: {
      paddingVertical: 6,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.background.default,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    subFilterChipActive: {
      backgroundColor: colors.primary.main,
      borderColor: colors.primary.main,
    },
    subFilterText: {
      color: colors.text.secondary,
    },
    subFilterTextActive: {
      color: colors.text.inverse,
      fontWeight: '700',
    },
    locationBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.background.default,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
      marginVertical: spacing.xs,
    },
    locationLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
    },
    changeLocText: {
      fontWeight: '700',
      marginLeft: spacing.xs,
    },
    categoryDropdown: {
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    loaderCenter: {
      paddingVertical: spacing.xxl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: spacing.sm,
    },
    listContent: {
      paddingBottom: spacing.xxl,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    emptyCta: {
      marginTop: spacing.md,
      minWidth: 220,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.status.dangerBg,
      padding: spacing.sm,
      borderRadius: radius.sm,
      marginBottom: spacing.xs,
      gap: spacing.xs,
    },
    errorText: {
      color: colors.status.danger,
      flex: 1,
    },
  });
