import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { SegmentedTabs } from '@shared/components/molecules/SegmentedTabs';
import { Header } from '@shared/components/molecules/Header';
import { ListItemCard } from '@shared/components/molecules/ListItemCard';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { EmptyState } from '@shared/components/molecules/EmptyState';
import { spacing, radius, useTheme } from '@theme/index';
import { complaintApi } from '@infrastructure/api/complaintApi';

const OPEN_STATUSES = [
  'OPEN',
  'PENDING',
  'PENDING_ACCEPTANCE',
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'DISPATCHED',
  'SCHEDULED',
];

const CLOSED_STATUSES = ['RESOLVED', 'COMPLETED', 'CLOSED', 'CANCELLED'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Cross-platform date and time formatter for React Native (Hermes Engine)
 */
export const formatStandardDate = (dateStr?: string | null, includeTime = true): string => {
  if (!dateStr) return 'Recent';
  const str = String(dateStr).trim();

  // Pattern 1: Slash format (e.g. "8/17/2026, 11:30:00 AM" or "6/8/2026, 4:30:00 pm")
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(.*))?/i);
  if (slashMatch) {
    const p1 = parseInt(slashMatch[1], 10);
    const p2 = parseInt(slashMatch[2], 10);
    const year = slashMatch[3];
    const rawTime = slashMatch[4]?.trim();

    // Standard MM/DD/YYYY with fallback if day is first
    let day = p2;
    let monthIndex = p1 - 1;
    if (p1 > 12 && p2 <= 12) {
      day = p1;
      monthIndex = p2 - 1;
    }

    if (monthIndex >= 0 && monthIndex < 12) {
      let formatted = `${day} ${MONTHS[monthIndex]} ${year}`;
      if (includeTime && rawTime) {
        const cleanTime = rawTime.replace(/:00(\s*)/i, '$1').toUpperCase().trim();
        formatted += ` • ${cleanTime}`;
      }
      return formatted;
    }
  }

  // Pattern 2: Dash / ISO format (e.g. "2026-08-19T07:26:24.245Z")
  const dashMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dashMatch) {
    const year = dashMatch[1];
    const monthIndex = parseInt(dashMatch[2], 10) - 1;
    const day = parseInt(dashMatch[3], 10);
    if (monthIndex >= 0 && monthIndex < 12) {
      let formatted = `${day} ${MONTHS[monthIndex]} ${year}`;
      try {
        const d = new Date(str);
        if (includeTime && !isNaN(d.getTime())) {
          const hours = d.getHours();
          const minutes = d.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const h12 = hours % 12 || 12;
          const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
          formatted += ` • ${h12}:${minStr} ${ampm}`;
        }
      } catch (_) {}
      return formatted;
    }
  }

  // Pattern 3: Standard Date Object fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const hours = parsed.getHours();
    const minutes = parsed.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${parsed.getDate()} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}${
      includeTime ? ` • ${h12}:${minStr} ${ampm}` : ''
    }`;
  }

  return str;
};

/**
 * Extract Issue Title and Appliance Name from API response
 */
export const parseServiceTitles = (
  rawTitle?: string,
  brandName?: string,
  productName?: string,
  categoryName?: string
) => {
  const brand = (brandName || '').trim();
  const product = (productName || '').trim();
  const cat = (categoryName || '').trim();

  let appliance = '';
  if (brand || product) {
    if (!brand) appliance = product;
    else if (!product) appliance = brand;
    else if (product.toLowerCase().startsWith(brand.toLowerCase())) {
      appliance = product;
    } else {
      appliance = `${brand} • ${product}`;
    }
  }

  let issueTitle = (rawTitle || '').trim();

  if (rawTitle && rawTitle.includes(' - ')) {
    const parts = rawTitle.split(' - ');
    if (parts.length > 1) {
      issueTitle = parts[0].trim();
      if (!appliance) {
        appliance = parts.slice(1).join(' - ').trim();
      }
    }
  }

  if (!appliance) {
    appliance = cat || 'Home Appliance';
  }

  if (!issueTitle) {
    issueTitle = 'Service Request';
  }

  return { issueTitle, appliance };
};

export const MyComplaintsScreen = ({ navigation }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => makeStyles(colors, insets.bottom), [colors, insets.bottom]);

  const fetchBookings = useCallback(async () => {
    try {
      setErrorMsg(null);
      const res = await complaintApi.getComplaints();

      if (res?.success && Array.isArray(res.data)) {
        const list = res.data.map((c: any) => {
          const rawType = String(c.type || '').trim().toUpperCase();
          const rawTicket = String(c.ticketNumber || '').trim().toUpperCase();
          const isInstallation =
            rawType === 'INSTALLATION' ||
            rawTicket.startsWith('INS-') ||
            String(c.title || '').toLowerCase().includes('installation') ||
            String(c.issueTypeName || '').toLowerCase() === 'installation';

          const type: 'INSTALLATION' | 'COMPLAINT' = isInstallation ? 'INSTALLATION' : 'COMPLAINT';

          const formattedDate = formatStandardDate(c.preferredSlot || c.createdAt);
          const ticketNumber =
            c.ticketNumber ||
            (c.id
              ? `${type === 'INSTALLATION' ? 'INS' : 'SRV'}-${String(c.id).substring(0, 8).toUpperCase()}`
              : undefined);

          const { issueTitle, appliance } = parseServiceTitles(
            c.title,
            c.brandName,
            c.productName,
            c.categoryName
          );

          const shopkeeperName = c.shopkeeper?.shopName || c.shopkeeper?.ownerName;
          const mechanicName = c.assignedMechanicName || c.assignedFreelancerName || null;

          return {
            id: c.id,
            ticketNumber,
            type,
            title: c.title,
            issueTitle,
            appliance,
            categoryName: c.categoryName,
            brandName: c.brandName,
            productName: c.productName,
            issueTypeName: c.issueTypeName,
            shopkeeperName,
            mechanicName,
            preferredSlot: c.preferredSlot,
            createdAt: c.createdAt,
            isWarranty: c.isWarranty,
            warrantyType: c.warrantyType,
            agreedPrice: c.agreedPrice,
            date: formattedDate,
            status: (c.status || 'OPEN').toUpperCase(),
            invoice: c.invoice,
            visits: c.visits,
            raw: c,
          };
        });
        setItems(list);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      setErrorMsg(err?.error?.message || 'Could not load services & complaints');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const openCount = items.filter((i) => OPEN_STATUSES.includes(i.status)).length;
  const closedCount = items.filter((i) => CLOSED_STATUSES.includes(i.status)).length;
  const installationCount = items.filter((i) => i.type === 'INSTALLATION').length;

  const filtered = items.filter((c) => {
    if (activeTab === 'open') return OPEN_STATUSES.includes(c.status);
    if (activeTab === 'closed') return CLOSED_STATUSES.includes(c.status);
    if (activeTab === 'installations') return c.type === 'INSTALLATION';
    return true;
  });

  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="My Services & Complaints"
        subtitle="Track support tickets, visits & requests"
        onBackPress={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      <View style={styles.tabWrapper}>
        <SegmentedTabs
          tabs={[
            { id: 'all', label: 'All', count: items.length },
            { id: 'open', label: 'Active', count: openCount },
            { id: 'closed', label: 'Completed', count: closedCount },
            ...(installationCount > 0
              ? [{ id: 'installations', label: 'Installations', count: installationCount }]
              : []),
          ]}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      </View>

      {errorMsg && (
        <View style={styles.errorBanner}>
          <AppIcon name="alert-circle-outline" size="sm" color={colors.status.danger} />
          <AppText variant="bodySm" style={styles.errorText}>
            {errorMsg}
          </AppText>
          <TouchableOpacity onPress={fetchBookings} activeOpacity={0.75}>
            <AppText variant="labelSm" style={styles.retryText}>
              Retry
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <AppText variant="bodyMd" style={styles.loadingText}>
            Loading service requests & tickets...
          </AppText>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => (item.id ? `${item.id}-${index}` : `complaint-${index}`)}
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
              iconName="document-text-outline"
              title="No Requests Found"
              description={`You don't have any ${activeTab === 'all' ? 'services or complaints' : activeTab} logged.`}
            />
          }
          renderItem={({ item }) => {
            const isResolved =
              item.status === 'RESOLVED' || item.status === 'COMPLETED' || item.status === 'CLOSED';
            const isCancelled = item.status === 'CANCELLED';
            const isInProgress = item.status === 'IN_PROGRESS';

            let variant: 'warning' | 'info' | 'success' | 'danger' | 'primary' = 'warning';
            let icon = item.type === 'INSTALLATION' ? 'construct-outline' : 'warning-outline';
            let iconColor = colors.category.orangeIcon;
            let iconBg = colors.category.orangeBg;

            if (isResolved) {
              variant = 'success';
              icon = 'checkmark-circle-outline';
              iconColor = colors.category.emeraldIcon;
              iconBg = colors.category.emeraldBg;
            } else if (isCancelled) {
              variant = 'danger';
              icon = 'close-circle-outline';
              iconColor = colors.status.danger;
              iconBg = colors.status.dangerBg;
            } else if (isInProgress) {
              variant = 'primary';
              icon = item.type === 'INSTALLATION' ? 'construct-outline' : 'build-outline';
              iconColor = colors.primary.main;
              iconBg = colors.primary.light;
            } else if (item.status === 'ASSIGNED' || item.status === 'ACCEPTED') {
              variant = 'info';
              icon = 'person-outline';
              iconColor = colors.category.indigoIcon;
              iconBg = colors.category.indigoBg;
            } else if (item.status === 'PENDING' || item.status === 'PENDING_ACCEPTANCE' || item.status === 'OPEN') {
              variant = 'warning';
              icon = 'time-outline';
              iconColor = colors.status.warning;
              iconBg = colors.category.orangeBg;
            }

            const metaParts = [
              item.ticketNumber ? `Ref: ${item.ticketNumber}` : `Ref: #${String(item.id).substring(0, 8)}`,
              item.type === 'INSTALLATION' ? 'Installation' : 'Complaint',
              item.isWarranty ? 'WARRANTY' : (item.agreedPrice !== null && item.agreedPrice !== undefined && item.agreedPrice > 0 ? `₹${item.agreedPrice}` : null),
            ].filter(Boolean);

            return (
              <ListItemCard
                iconName={icon}
                iconColor={iconColor}
                iconBgColor={iconBg}
                title={item.issueTitle}
                subtitle={item.appliance}
                metaText={metaParts.join(' • ')}
                statusLabel={item.status}
                statusVariant={variant}
                onPress={() => navigation.navigate('ComplaintDetailScreen', { ticket: item, id: item.id })}
                footerContent={
                  <View style={styles.footerRowInner}>
                    <View style={styles.footerItem}>
                      <AppText variant="caption" color="textMuted">
                        {item.preferredSlot ? 'Appointment Slot' : 'Created On'}
                      </AppText>
                      <AppText variant="labelSm" style={styles.footerDateText}>
                        {item.date}
                      </AppText>
                    </View>
                    <View style={styles.footerItemRight}>
                      <AppText variant="caption" color="textMuted">
                        Technician
                      </AppText>
                      {item.mechanicName ? (
                        <View style={styles.techChipRow}>
                          <AppIcon name="person" size="xs" color={colors.primary.main} />
                          <AppText variant="labelSm" color="primary" style={styles.footerTechText}>
                            {item.mechanicName}
                          </AppText>
                        </View>
                      ) : (
                        <AppText variant="caption" color="textMuted" style={styles.footerUnassignedText}>
                          Unassigned
                        </AppText>
                      )}
                    </View>
                  </View>
                }
              />
            );
          }}
        />
      )}

      {/* Modern Fixed Circular Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.floatingFab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('BookServiceScreen')}
        accessibilityLabel="Book Service"
      >
        <AppIcon name="add" size="lg" color={colors.text.inverse} />
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any, bottomInset: number) => {
  const safeBottom = bottomInset > 0 ? bottomInset : 16;
  return StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      flex: 1,
    },
    tabWrapper: {
      marginVertical: spacing.xs,
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
      color: colors.status.danger,
    },
    retryText: {
      color: colors.status.danger,
      fontWeight: '700',
    },
    loaderCenter: {
      paddingVertical: spacing.xxl,
      alignItems: 'center',
    },
    loadingText: {
      color: colors.text.muted,
      marginTop: spacing.sm,
    },
    listContent: {
      paddingBottom: safeBottom + 60,
    },
    footerRowInner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    footerItem: {
      flex: 1,
    },
    footerItemRight: {
      alignItems: 'flex-end',
    },
    footerDateText: {
      fontWeight: '700',
      color: colors.text.primary,
      marginTop: 1,
    },
    techChipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 1,
    },
    footerTechText: {
      fontWeight: '700',
    },
    footerUnassignedText: {
      fontStyle: 'italic',
      marginTop: 1,
    },
    floatingFab: {
      position: 'absolute',
      bottom: safeBottom + 8,
      right: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.cta.main,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: colors.cta.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
    },
  });
};
