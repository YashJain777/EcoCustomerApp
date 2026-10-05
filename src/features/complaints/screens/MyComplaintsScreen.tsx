import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { SegmentedTabs } from '@shared/components/molecules/SegmentedTabs';
import { Header } from '@shared/components/molecules/Header';
import { ListItemCard } from '@shared/components/molecules/ListItemCard';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { EmptyState } from '@shared/components/molecules/EmptyState';
import { AppCalendarView } from '@shared/components/molecules/AppCalendarView';
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

const COMPLETED_STATUSES = ['RESOLVED', 'COMPLETED', 'CLOSED'];
const CANCELLED_STATUSES = ['CANCELLED', 'REJECTED'];

const DATE_FILTER_TABS = [
  { key: 'ALL', label: 'All Dates' },
  { key: 'TODAY', label: 'Today' },
  { key: 'TOMORROW', label: 'Tomorrow' },
  { key: 'THIS_WEEK', label: 'This Week' },
  { key: 'THIS_MONTH', label: 'This Month' },
];

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

    let day = p1;
    let monthIndex = p2 - 1;
    if (p2 > 12 && p1 <= 12) {
      day = p2;
      monthIndex = p1 - 1;
    }

    if (monthIndex >= 0 && monthIndex < 12) {
      let formatted = `${day} ${MONTHS[monthIndex]} ${year}`;
      if (includeTime && rawTime) {
        const cleanTime = rawTime.replace(/:\d{2}:00/g, (m) => m.slice(0, 3)).toUpperCase().trim();
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
 * Formats a single time string (e.g. "6:00 PM", "1:00 PM", "18:00") into a standard 1-hour time range (e.g. "06:00 PM - 07:00 PM").
 */
export const formatSlotTimeString = (rawTime?: string | null): string => {
  if (!rawTime) return '';
  const str = String(rawTime).trim();

  // If already a range (contains '-' or '–'), return formatted range
  if (str.includes('-') || str.includes('–')) {
    return str;
  }

  // Handle single time formats like "6:00 PM", "06:00 PM", "6 PM", "18:00"
  const match = str.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(AM|PM)?$/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const min = parseInt(match[2] || '0', 10);
    const ampm = match[3]?.toUpperCase();

    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    const startH12 = hour % 12 || 12;
    const startAmPm = hour >= 12 ? 'PM' : 'AM';
    const startFormatted = `${startH12 < 10 ? '0' : ''}${startH12}:${min < 10 ? '0' : ''}${min} ${startAmPm}`;

    const endHour = (hour + 1) % 24;
    const endH12 = endHour % 12 || 12;
    const endAmPm = endHour >= 12 ? 'PM' : 'AM';
    const endFormatted = `${endH12 < 10 ? '0' : ''}${endH12}:${min < 10 ? '0' : ''}${min} ${endAmPm}`;

    return `${startFormatted} - ${endFormatted}`;
  }

  return str;
};

/**
 * Extracts a 1-hour time range from an ISO date string or Date object
 */
export const extractSlotTimeRangeFromDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const startStr = `${h12 < 10 ? '0' : ''}${h12}:${minStr} ${ampm}`;

      const endHours = (hours + 1) % 24;
      const endH12 = endHours % 12 || 12;
      const endAmPm = endHours >= 12 ? 'PM' : 'AM';
      const endStr = `${endH12 < 10 ? '0' : ''}${endH12}:${minStr} ${endAmPm}`;

      return `${startStr} - ${endStr}`;
    }
  } catch (_) {}
  return '';
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

  const [selectedDateFilter, setSelectedDateFilter] = useState('ALL');
  const [customDate, setCustomDate] = useState('');
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

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

          let appointmentSlot: string;
          let isScheduled = false;
          if (c.scheduledAt) {
            isScheduled = true;
            const formattedDateOnly = formatStandardDate(c.scheduledAt, false);
            const timePart = c.preferredTimeSlot
              ? formatSlotTimeString(c.preferredTimeSlot)
              : extractSlotTimeRangeFromDate(c.scheduledAt);
            appointmentSlot = timePart ? `${formattedDateOnly} • ${timePart}` : formatStandardDate(c.scheduledAt, true);
          } else if (c.preferredSlot && typeof c.preferredSlot === 'string') {
            isScheduled = true;
            if (c.preferredSlot.includes('•')) {
              const parts = c.preferredSlot.split('•').map((p: string) => p.trim());
              const datePart = formatStandardDate(parts[0], false);
              const timePart = formatSlotTimeString(parts[1]);
              appointmentSlot = `${datePart} • ${timePart}`;
            } else {
              appointmentSlot = formatStandardDate(c.preferredSlot, true);
              if (appointmentSlot.includes('•')) {
                const parts = appointmentSlot.split('•').map((p: string) => p.trim());
                appointmentSlot = `${parts[0]} • ${formatSlotTimeString(parts[1])}`;
              }
            }
          } else if (c.preferredVisitDate) {
            isScheduled = true;
            const datePart = formatStandardDate(c.preferredVisitDate, false);
            const timePart = c.preferredTimeSlot
              ? formatSlotTimeString(c.preferredTimeSlot)
              : extractSlotTimeRangeFromDate(c.preferredVisitDate);
            appointmentSlot = timePart ? `${datePart} • ${timePart}` : formatStandardDate(c.preferredVisitDate, true);
          } else if (c.preferredTimeSlot) {
            isScheduled = true;
            appointmentSlot = `Scheduled • ${formatSlotTimeString(c.preferredTimeSlot)}`;
          } else if (c.description && /\[Preferred:\s*([^\]]+)\]/i.test(c.description)) {
            const match = c.description.match(/\[Preferred:\s*([^\]]+)\]/i);
            isScheduled = true;
            const rawMatch = match ? match[1] : 'Scheduled Visit';
            if (rawMatch.includes('•')) {
              const parts = rawMatch.split('•').map((p: string) => p.trim());
              appointmentSlot = `${parts[0]} • ${formatSlotTimeString(parts[1])}`;
            } else {
              appointmentSlot = rawMatch;
            }
          } else {
            isScheduled = false;
            appointmentSlot = 'As per technician availability';
          }
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

          const startOtp = c.startOtp || c.serviceJobs?.[0]?.visits?.[0]?.startOtp || null;
          const completionOtp = c.completionOtp || c.serviceJobs?.[0]?.visits?.[0]?.completionOtp || null;
          const isStartOtpVerified = Boolean(c.serviceJobs?.[0]?.visits?.[0]?.otpVerified || c.startOtpVerified);
          const isCompletionOtpVerified = Boolean(c.serviceJobs?.[0]?.visits?.[0]?.completionOtpVerified || c.completionOtpVerified);

          return {
            id: c.id,
            ticketNumber,
            type,
            title: c.title,
            description: c.description,
            issueTitle,
            appliance,
            categoryName: c.categoryName,
            brandName: c.brandName,
            productName: c.productName,
            issueTypeName: c.issueTypeName,
            shopkeeperName,
            mechanicName,
            preferredSlot: isScheduled ? appointmentSlot : null,
            isImmediateSlot: !isScheduled,
            appointmentSlot,
            createdAt: formatStandardDate(c.createdAt),
            isWarranty: c.isWarranty,
            warrantyType: c.warrantyType,
            agreedPrice: c.agreedPrice,
            date: appointmentSlot,
            status: (c.status || 'OPEN').toUpperCase(),
            invoice: c.invoice,
            visits: c.visits || c.serviceJobs?.[0]?.visits || [],
            startOtp,
            completionOtp,
            isStartOtpVerified,
            isCompletionOtpVerified,
            raw: c,
          };
        });
        setItems(list);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.warn('[MyComplaintsScreen] fetchBookings failed:', err);
      const msg =
        err?.error?.message ||
        err?.message ||
        (typeof err?.error === 'string' ? err.error : null) ||
        'Could not load services & complaints';
      setErrorMsg(msg);
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

  const isMatchDate = useCallback(
    (item: any) => {
      if (selectedDateFilter === 'ALL' && !customDate) return true;

      // Filter specifically based on "Request Placed On" date (createdAt)
      const rawDate = item.raw?.createdAt || item.raw?.scheduledAt || item.raw?.preferredVisitDate;
      if (!rawDate) return true;

      const d = dayjs(rawDate);
      if (!d.isValid()) return true;

      const dStr = d.format('YYYY-MM-DD');
      const dMonth = d.format('YYYY-MM');

      const now = dayjs();
      const today = now.format('YYYY-MM-DD');
      const tomorrow = now.add(1, 'day').format('YYYY-MM-DD');
      const startOfWeek = now.startOf('week').format('YYYY-MM-DD');
      const endOfWeek = now.endOf('week').format('YYYY-MM-DD');
      const thisMonth = now.format('YYYY-MM');

      if (customDate) return dStr === customDate;
      if (selectedDateFilter === 'TODAY') return dStr === today;
      if (selectedDateFilter === 'TOMORROW') return dStr === tomorrow;
      if (selectedDateFilter === 'THIS_WEEK') return dStr >= startOfWeek && dStr <= endOfWeek;
      if (selectedDateFilter === 'THIS_MONTH') return dMonth === thisMonth;

      return true;
    },
    [selectedDateFilter, customDate]
  );

  const openCount = items.filter((i) => OPEN_STATUSES.includes(i.status)).length;
  const completedCount = items.filter((i) => COMPLETED_STATUSES.includes(i.status)).length;
  const cancelledCount = items.filter((i) => CANCELLED_STATUSES.includes(i.status)).length;
  const installationCount = items.filter((i) => i.type === 'INSTALLATION').length;

  const filtered = items.filter((c) => {
    let statusMatch = true;
    if (activeTab === 'open') statusMatch = OPEN_STATUSES.includes(c.status);
    else if (activeTab === 'closed') statusMatch = COMPLETED_STATUSES.includes(c.status);
    else if (activeTab === 'cancelled') statusMatch = CANCELLED_STATUSES.includes(c.status);
    else if (activeTab === 'installations') statusMatch = c.type === 'INSTALLATION';

    if (!statusMatch) return false;

    return isMatchDate(c);
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
            { id: 'closed', label: 'Completed', count: completedCount },
            { id: 'cancelled', label: 'Cancelled', count: cancelledCount },
            ...(installationCount > 0
              ? [{ id: 'installations', label: 'Installations', count: installationCount }]
              : []),
          ]}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      </View>

      {/* ── Single-Line Horizontal Date Filter Chips ───────────────────────────── */}
      <View style={styles.dateFilterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateFilterScrollContent}
        >
          {DATE_FILTER_TABS.map((tab) => {
            const isSelected = selectedDateFilter === tab.key && !customDate;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                onPress={() => {
                  setSelectedDateFilter(tab.key);
                  setCustomDate('');
                }}
                activeOpacity={0.75}
              >
                {tab.key === 'ALL' && (
                  <AppIcon
                    name="calendar-outline"
                    size="xs"
                    color={isSelected ? colors.text.inverse : colors.text.secondary}
                  />
                )}
                <AppText
                  variant="caption"
                  style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}
                  numberOfLines={1}
                >
                  {tab.label}
                </AppText>
              </TouchableOpacity>
            );
          })}

          {/* Custom Calendar Date Picker Trigger */}
          <TouchableOpacity
            style={[
              styles.dateChip,
              (customDate || selectedDateFilter === 'CUSTOM') && styles.dateChipSelected,
            ]}
            onPress={() => setShowDatePickerModal(true)}
            activeOpacity={0.75}
          >
            <AppIcon
              name="funnel-outline"
              size="xs"
              color={
                customDate || selectedDateFilter === 'CUSTOM'
                  ? colors.text.inverse
                  : colors.text.secondary
              }
            />
            <AppText
              variant="caption"
              style={[
                styles.dateChipText,
                (customDate || selectedDateFilter === 'CUSTOM') && styles.dateChipTextSelected,
              ]}
              numberOfLines={1}
            >
              {customDate ? dayjs(customDate).format('DD MMM YYYY') : 'Pick Date 📅'}
            </AppText>
            {customDate ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setCustomDate('');
                  setSelectedDateFilter('ALL');
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <AppIcon name="close-circle" size="xs" color={colors.text.inverse} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        </ScrollView>
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
                  <View style={styles.footerContainer}>
                    {/* Request Placed On Row */}
                    {item.createdAt ? (
                      <View style={styles.requestPlacedRow}>
                        <AppIcon name="time-outline" size="xs" color={colors.text.secondary} />
                        <AppText variant="caption" color="textMuted">
                          Request Placed On:{' '}
                          <AppText variant="caption" color="textPrimary" style={styles.boldText}>
                            {item.createdAt}
                          </AppText>
                        </AppText>
                      </View>
                    ) : null}

                    <View style={styles.footerRowInner}>
                      <View style={styles.footerItem}>
                        <AppText variant="caption" color="textMuted">
                          Appointment Slot
                        </AppText>
                        <View style={styles.slotValueRow}>
                          <AppIcon
                            name={item.isImmediateSlot ? 'flash-outline' : 'calendar-outline'}
                            size="xs"
                            color={item.isImmediateSlot ? colors.category.orangeIcon : colors.primary.main}
                          />
                          <AppText variant="labelSm" style={styles.footerDateText}>
                            {item.appointmentSlot}
                          </AppText>
                        </View>
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
                        ) : isResolved ? (
                          <View style={styles.techChipRow}>
                            <AppIcon name="checkmark-done" size="xs" color={colors.status.success} />
                            <AppText variant="labelSm" style={styles.footerResolvedText}>
                              Completed
                            </AppText>
                          </View>
                        ) : (
                          <View style={styles.techChipRow}>
                            <AppIcon name="time-outline" size="xs" color={colors.status.warning} />
                            <AppText variant="caption" color="textMuted" style={styles.footerUnassignedText}>
                              Assigning expert...
                            </AppText>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Active Doorstep Security OTP Quick Strip (Industry Standard UX) */}
                    {!isResolved && !isCancelled && (
                      <View style={styles.otpQuickContainer}>
                        {!item.isStartOtpVerified && item.startOtp ? (
                          <View style={styles.otpBannerStart}>
                            <View style={styles.otpBannerLeft}>
                              <AppIcon name="shield-checkmark" size="xs" color={colors.primary.main} />
                              <AppText variant="caption" color="textMuted">
                                Doorstep Start OTP:
                              </AppText>
                              <AppText variant="labelSm" style={styles.otpStartValue}>
                                {item.startOtp}
                              </AppText>
                            </View>
                            <View style={styles.otpBadgePillPrimary}>
                              <AppText variant="caption" style={styles.otpBadgePillTextPrimary}>
                                Share on arrival
                              </AppText>
                            </View>
                          </View>
                        ) : isInProgress && item.completionOtp && !item.isCompletionOtpVerified ? (
                          <View style={styles.otpBannerCompletion}>
                            <View style={styles.otpBannerLeft}>
                              <AppIcon name="key-outline" size="xs" color={colors.status.warning} />
                              <AppText variant="caption" color="textMuted">
                                Completion OTP:
                              </AppText>
                              <AppText variant="labelSm" style={styles.otpCompletionValue}>
                                {item.completionOtp}
                              </AppText>
                            </View>
                            <View style={styles.otpBadgePillWarning}>
                              <AppText variant="caption" style={styles.otpBadgePillTextWarning}>
                                Share after test
                              </AppText>
                            </View>
                          </View>
                        ) : item.isStartOtpVerified && !isResolved ? (
                          <View style={styles.otpBannerProgress}>
                            <AppIcon name="construct-outline" size="xs" color={colors.category.emeraldIcon} />
                            <AppText variant="caption" style={styles.otpProgressText}>
                              Work in progress • Technician on site
                            </AppText>
                          </View>
                        ) : null}
                      </View>
                    )}
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

      {/* Interactive Calendar Date Picker Modal */}
      <Modal
        visible={showDatePickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowDatePickerModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleGroup}>
                <AppIcon name="calendar" size="sm" color={colors.primary.main} />
                <AppText variant="headingSm" color="textPrimary" style={styles.boldText}>
                  Filter Services by Date
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setShowDatePickerModal(false)}>
                <AppIcon name="close" size="sm" color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWrap}>
              <AppCalendarView
                selectedDate={customDate || dayjs().format('YYYY-MM-DD')}
                onSelectDate={(dStr) => {
                  setCustomDate(dStr);
                  setSelectedDateFilter('CUSTOM');
                  setShowDatePickerModal(false);
                }}
                minDate="2024-01-01"
              />
            </View>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.clearDateFilterBtn}
                onPress={() => {
                  setCustomDate('');
                  setSelectedDateFilter('ALL');
                  setShowDatePickerModal(false);
                }}
              >
                <AppText variant="labelSm" color="primary" style={styles.boldText}>
                  Clear Date Filter
                </AppText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    dateFilterWrap: {
      marginBottom: spacing.sm,
    },
    dateFilterScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    dateChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      backgroundColor: colors.background.paper,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    dateChipSelected: {
      backgroundColor: colors.primary.main,
      borderColor: colors.primary.main,
    },
    dateChipText: {
      color: colors.text.secondary,
      fontWeight: '600',
    },
    dateChipTextSelected: {
      color: colors.text.inverse,
      fontWeight: '800',
    },
    boldText: {
      fontWeight: '700',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.background.paper,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    modalHeaderTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    calendarWrap: {
      marginBottom: spacing.md,
    },
    modalFooterRow: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearDateFilterBtn: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.light,
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
    footerContainer: {
      width: '100%',
      gap: spacing.xs + 2,
    },
    requestPlacedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      marginBottom: 2,
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
    slotValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    footerItemRight: {
      alignItems: 'flex-end',
    },
    footerDateText: {
      fontWeight: '700',
      color: colors.text.primary,
    },
    techChipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    footerTechText: {
      fontWeight: '700',
    },
    footerResolvedText: {
      fontWeight: '600',
      color: colors.status.success,
    },
    footerUnassignedText: {
      fontStyle: 'italic',
    },
    otpQuickContainer: {
      marginTop: spacing.xs,
    },
    otpBannerStart: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.primary.light,
      borderRadius: radius.sm,
      paddingVertical: 5,
      paddingHorizontal: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    otpBannerCompletion: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.status.warningBg,
      borderRadius: radius.sm,
      paddingVertical: 5,
      paddingHorizontal: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    otpBannerProgress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.category.emeraldBg,
      borderRadius: radius.sm,
      paddingVertical: 5,
      paddingHorizontal: spacing.sm,
    },
    otpProgressText: {
      color: colors.category.emeraldIcon,
      fontWeight: '600',
    },
    otpBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    otpStartValue: {
      fontWeight: '800',
      letterSpacing: 1.5,
      color: colors.primary.main,
    },
    otpCompletionValue: {
      fontWeight: '800',
      letterSpacing: 1.5,
      color: colors.status.warning,
    },
    otpBadgePillPrimary: {
      backgroundColor: colors.primary.main,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.xs,
    },
    otpBadgePillTextPrimary: {
      color: colors.text.inverse,
      fontWeight: '700',
      fontSize: 10,
    },
    otpBadgePillWarning: {
      backgroundColor: colors.status.warning,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.xs,
    },
    otpBadgePillTextWarning: {
      color: colors.text.inverse,
      fontWeight: '700',
      fontSize: 10,
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
