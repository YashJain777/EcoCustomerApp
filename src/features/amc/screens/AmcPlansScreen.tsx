import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { SegmentedTabs } from '@shared/components/molecules/SegmentedTabs';
import { Badge } from '@shared/components/atoms/Badge';
import { Header } from '@shared/components/molecules/Header';
import { Card } from '@shared/components/atoms/Card';
import { AppIcon } from '@shared/components/atoms/Icon';
import { EmptyState } from '@shared/components/molecules/EmptyState';
import { spacing, radius, shadows, useTheme } from '@theme/index';
import { amcApi } from '@infrastructure/api/amcApi';
import { AmcSubscription, AmcPlan } from '@core/types/api';

export const AmcPlansScreen = ({ navigation }: any) => {
  const [subscriptions, setSubscriptions] = useState<AmcSubscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<AmcPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buying, setBuying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const fetchData = useCallback(async () => {
    try {
      setErrorMsg(null);
      const [subRes, planRes] = await Promise.allSettled([
        amcApi.getMySubscriptions(),
        amcApi.getPlans(),
      ]);

      if (subRes.status === 'fulfilled' && subRes.value?.success && Array.isArray(subRes.value.data)) {
        setSubscriptions(subRes.value.data);
      } else {
        setSubscriptions([]);
      }

      if (planRes.status === 'fulfilled' && planRes.value?.success && Array.isArray(planRes.value.data)) {
        setAvailablePlans(planRes.value.data);
      }
    } catch (err: any) {
      setErrorMsg(err?.error?.message || 'Failed to fetch AMC subscriptions');
      setSubscriptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const activeCount = subscriptions.filter((s) => s.status?.toUpperCase() === 'ACTIVE').length;
  const expiredCount = subscriptions.filter((s) => s.status?.toUpperCase() === 'EXPIRED').length;

  const filteredSubs = subscriptions.filter((s) => {
    const status = s.status?.toUpperCase();
    if (activeTab === 'active') return status === 'ACTIVE';
    if (activeTab === 'expired') return status === 'EXPIRED';
    return true;
  });

  const handleBuyPlan = async () => {
    if (availablePlans.length === 0) {
      Alert.alert('AMC Plans', 'No new AMC plans are available right now. Please check back later.');
      return;
    }

    const planToBuy = availablePlans[0];
    Alert.alert(
      'Purchase Protection Plan',
      `Would you like to buy ${planToBuy.name} for ₹${planToBuy.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Buy',
          onPress: async () => {
            setBuying(true);
            try {
              const res = await amcApi.buyPlan({ amcPlanId: planToBuy.id });
              if (res?.success) {
                Alert.alert('AMC Subscription Active! 🛡️', `You have successfully subscribed to ${planToBuy.name}.`);
                fetchData();
              } else {
                Alert.alert('Purchase Failed', res?.error?.message || 'Could not process AMC subscription.');
              }
            } catch (err: any) {
              Alert.alert('Purchase Error', err?.error?.message || err?.message || 'Could not process purchase');
            } finally {
              setBuying(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="AMC & Subscriptions"
        subtitle="Annual maintenance contract plans"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.tabWrapper}>
        <SegmentedTabs
          tabs={[
            { id: 'active', label: 'Active', count: activeCount },
            { id: 'expired', label: 'Expired', count: expiredCount },
          ]}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      </View>

      {errorMsg && (
        <View style={styles.errorBanner}>
          <AppIcon name="alert-circle-outline" size="sm" color={colors.status.danger} />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={fetchData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading AMC subscriptions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSubs}
          keyExtractor={(item, index) => (item.id ? `${item.id}-${index}` : `amc-${index}`)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={8}
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
              iconName="shield-outline"
              title="No AMC Plans Found"
              description="You don't have any AMC subscriptions in this category."
            />
          }
          renderItem={({ item }) => {
            const isExpired = item.status?.toUpperCase() === 'EXPIRED';
            const startDateStr = item.startDate ? new Date(item.startDate).toLocaleDateString('en-IN') : 'N/A';
            const endDateStr = item.endDate ? new Date(item.endDate).toLocaleDateString('en-IN') : 'N/A';

            return (
              <Card style={styles.amcCard} padding="lg">
                <View style={styles.cardHeader}>
                  <Badge
                    label={isExpired ? 'EXPIRED AMC' : 'ACTIVE AMC'}
                    variant={isExpired ? 'danger' : 'success'}
                  />
                  <View style={styles.shieldBadge}>
                    <AppIcon name="shield-checkmark" size="md" color={colors.status.warning} />
                  </View>
                </View>

                <Text style={styles.planName}>{item.planName || item.amcPlan?.name || 'Gold AMC Plan'}</Text>
                <Text style={styles.applianceText}>{item.applianceName || 'Registered Appliance'}</Text>
                <Text style={styles.metaText}>
                  Valid: {startDateStr} — {endDateStr}
                </Text>
                <Text style={styles.amountText}>
                  Subscription Amount: ₹{item.amount || item.amcPlan?.price || 2499}
                </Text>

                <TouchableOpacity style={styles.benefitsBtn} activeOpacity={0.7}>
                  <Text style={styles.benefitsBtnText}>View Included Services & Benefits</Text>
                  <AppIcon name="chevron-forward" size="xs" color={colors.cta.main} />
                </TouchableOpacity>
              </Card>
            );
          }}
        />
      )}

      <TouchableOpacity
        style={styles.buyNewBtn}
        activeOpacity={0.85}
        onPress={handleBuyPlan}
        disabled={buying}
      >
        {buying ? (
          <ActivityIndicator size="small" color={colors.cta.main} style={styles.btnIcon} />
        ) : (
          <AppIcon name="shield-checkmark-outline" size="sm" color={colors.cta.main} style={styles.btnIcon} />
        )}
        <Text style={styles.buyNewBtnText}>{buying ? 'Processing...' : 'Buy New AMC Protection Plan'}</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
    },
    iconActionBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.background.paper,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    tabWrapper: {
      marginVertical: spacing.sm,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.status.dangerBg,
      padding: spacing.sm + 2,
      borderRadius: radius.sm,
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    errorText: {
      flex: 1,
      fontSize: 12,
      color: colors.status.danger,
    },
    retryText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.status.danger,
    },
    loaderCenter: {
      paddingVertical: spacing.xxl,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 13,
      color: colors.text.muted,
      marginTop: spacing.sm,
    },
    listContent: {
      paddingBottom: 90,
    },
    amcCard: {
      marginBottom: spacing.md,
      borderRadius: radius.lg,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    shieldBadge: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.status.warningBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    planName: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text.primary,
    },
    applianceText: {
      fontSize: 14,
      color: colors.text.secondary,
      marginTop: 2,
      fontWeight: '500',
    },
    metaText: {
      fontSize: 12,
      color: colors.text.muted,
      marginTop: 4,
    },
    amountText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text.primary,
      marginTop: spacing.xs,
    },
    benefitsBtn: {
      marginTop: spacing.md,
      backgroundColor: colors.background.default,
      borderRadius: radius.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.cta.main + '40',
    },
    benefitsBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.cta.main,
    },
    buyNewBtn: {
      position: 'absolute',
      bottom: spacing.md,
      left: spacing.lg,
      right: spacing.lg,
      backgroundColor: colors.background.paper,
      borderRadius: radius.lg,
      paddingVertical: spacing.sm + 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.cta.main,
      ...shadows.ctaGlow,
    },
    btnIcon: {
      marginRight: 8,
    },
    buyNewBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.cta.main,
    },
  });

