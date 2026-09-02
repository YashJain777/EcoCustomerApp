/**
 * @file ComplaintDetailScreen.tsx
 * @feature Complaints / Screens
 * @responsibility Detailed view for Service Tickets and Installation Requests with technician allocation, dealer, customer, appliance specifications, timeline stepper, and price estimate / invoice breakdown.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Badge, type BadgeVariant } from '@shared/components/atoms/Badge';
import { Button } from '@shared/components/atoms/Button';
import { Header } from '@shared/components/molecules/Header';
import { Card } from '@shared/components/atoms/Card';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { TimelineStepper } from '@shared/components/molecules/TimelineStepper';
import { spacing, radius, useTheme } from '@theme/index';
import { complaintApi } from '@infrastructure/api/complaintApi';
import { bookingApi } from '@infrastructure/api/bookingApi';
import type { ComplaintTicket, ComplaintServiceJob } from '@core/types/api';

const RESCHEDULE_OPTIONS = [
  {
    label: 'Tomorrow, 10:00 AM',
    getIso: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(10, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: 'Tomorrow, 02:30 PM',
    getIso: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(14, 30, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: 'Day after, 11:00 AM',
    getIso: () => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      d.setHours(11, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: 'Day after, 04:00 PM',
    getIso: () => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      d.setHours(16, 0, 0, 0);
      return d.toISOString();
    },
  },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Cross-platform date and time formatter for React Native (Hermes Engine)
 */
export const formatStandardDate = (dateStr?: string | null, includeTime = true): string => {
  if (!dateStr) return 'N/A';
  const str = String(dateStr).trim();

  // Pattern 1: Slash format (e.g. "8/17/2026, 11:30:00 AM" or "6/8/2026, 4:30:00 pm")
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(.*))?/i);
  if (slashMatch) {
    const p1 = parseInt(slashMatch[1], 10);
    const p2 = parseInt(slashMatch[2], 10);
    const year = slashMatch[3];
    const rawTime = slashMatch[4]?.trim();

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
 * Extract Issue Title and Appliance Name from raw title/brand/product
 */
export const parseServiceTitles = (
  rawTitle?: string,
  brandName?: string | null,
  productName?: string | null,
  categoryName?: string | null,
  serviceTypeName?: string | null
) => {
  const brand = (brandName || '').trim();
  const product = (productName || '').trim();
  const cat = (categoryName || '').trim();
  const service = (serviceTypeName || '').trim();

  let appliance = '';
  if (brand && product && !product.toLowerCase().startsWith(brand.toLowerCase())) {
    appliance = `${brand} • ${product}`;
  } else if (product && product !== 'Home Appliance') {
    appliance = product;
  } else if (brand) {
    appliance = brand;
  } else if (cat) {
    appliance = cat;
  }

  let issueTitle = (rawTitle || '').trim();

  if (rawTitle && rawTitle.includes(' - ')) {
    const parts = rawTitle.split(' - ');
    if (parts.length > 1) {
      issueTitle = parts[0].trim();
      if (!appliance) {
        const titleAppliance = parts.slice(1).join(' - ').trim();
        if (titleAppliance && titleAppliance !== 'Home Appliance') {
          appliance = titleAppliance;
        }
      }
    }
  }

  if (!appliance) {
    appliance = cat || (service ? `${service} Unit` : 'Home Appliance');
  }

  if (!issueTitle) {
    issueTitle = service || 'Service Request';
  }

  return { issueTitle, appliance };
};

export const ComplaintDetailScreen = ({ route, navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets.bottom), [colors, insets.bottom]);

  const initialTicket: Partial<ComplaintTicket> = route.params?.ticket?.raw || route.params?.ticket || {};
  const ticketId = route.params?.ticketId || route.params?.id || initialTicket.id;

  const [ticketData, setTicketData] = useState<Partial<ComplaintTicket>>(initialTicket);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [cancelling, setCancelling] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const fetchTicketDetails = useCallback(async () => {
    if (!ticketId) return;
    try {
      setErrorMsg(null);
      const res = await complaintApi.getComplaintById(ticketId);
      if (res?.success && res.data) {
        setTicketData(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err?.error?.message || err?.message || 'Could not refresh ticket details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTicketDetails();
  };

  // 1. Normalized Base Fields
  const rawType = String(ticketData?.type || '').trim().toUpperCase();
  const rawTicketNo = String(ticketData?.ticketNumber || '').trim().toUpperCase();
  const isInstallation =
    rawType === 'INSTALLATION' ||
    rawTicketNo.startsWith('INS-') ||
    String(ticketData?.title || '').toLowerCase().includes('installation');

  const type: 'INSTALLATION' | 'COMPLAINT' = isInstallation ? 'INSTALLATION' : 'COMPLAINT';

  const ticketNumber =
    ticketData?.ticketNumber ||
    (ticketId
      ? `${type === 'INSTALLATION' ? 'INS' : 'SRV'}-${String(ticketId).substring(0, 8).toUpperCase()}`
      : 'REF-PENDING');

  const { issueTitle, appliance } = parseServiceTitles(
    ticketData?.title,
    ticketData?.brandName || ticketData?.saleItem?.brandName,
    ticketData?.productName || ticketData?.saleItem?.productName,
    ticketData?.categoryName || ticketData?.saleItem?.categoryName,
    ticketData?.serviceType?.name
  );

  const status = (ticketData?.status || 'OPEN').toUpperCase();
  const isResolved = status === 'RESOLVED' || status === 'COMPLETED' || status === 'CLOSED';
  const isClosed = isResolved || status === 'CANCELLED';
  const isPending = status === 'PENDING' || status === 'OPEN' || status === 'PENDING_ACCEPTANCE';
  const isCancelled = status === 'CANCELLED';

  const createdAtFormatted = formatStandardDate(ticketData?.createdAt);
  const preferredSlotFormatted = ticketData?.preferredSlot ? formatStandardDate(ticketData.preferredSlot) : null;

  // 2. Extracted Nested Objects & Relations
  const customer = ticketData?.customer;
  const shopkeeper = ticketData?.shopkeeper;
  const complaintType = ticketData?.complaintType;
  const serviceType = ticketData?.serviceType;
  const saleItem = ticketData?.saleItem;

  // 3. Service Jobs, Visits & Parts
  const serviceJobs: ComplaintServiceJob[] = Array.isArray(ticketData?.serviceJobs) ? ticketData.serviceJobs : [];
  const primaryJob: ComplaintServiceJob | null = serviceJobs.length > 0 ? serviceJobs[0] : null;

  const visitsList =
    Array.isArray(ticketData?.visits) && ticketData.visits.length > 0
      ? ticketData.visits
      : serviceJobs.flatMap((j) => j.visits || []);

  const partsList: any[] = visitsList.flatMap((v: any) => v.parts || v.partsReplaced || []);

  // 4. Technician Information
  const mechanicObj =
    primaryJob?.mechanic ||
    primaryJob?.proposedMechanic ||
    (visitsList?.[0] as any)?.mechanic?.user ||
    (visitsList?.[0] as any)?.mechanic ||
    null;

  const mechanicName =
    ticketData?.assignedMechanicName ||
    mechanicObj?.fullName ||
    null;

  const mechanicMobile =
    mechanicObj?.mobile ||
    null;

  const mechanicJobStatus = primaryJob?.status || null;

  // 5. Warranty & Pricing Breakdown
  const isWarranty = ticketData?.isWarranty === true || ticketData?.warrantyType === 'WARRANTY' || ticketData?.pricing?.isFreeService === true;
  const agreedPriceVal = ticketData?.pricing?.agreedPrice ?? ticketData?.agreedPrice ?? null;
  const baseLaborCharge = agreedPriceVal !== null && agreedPriceVal !== undefined ? Number(agreedPriceVal) : null;
  const partsSubtotal = partsList.reduce(
    (sum: number, p: any) => sum + Number(p.quantity || 1) * Number(p.cost || 0),
    0
  );

  const calculatedTotal = isWarranty ? 0 : (baseLaborCharge !== null ? baseLaborCharge + partsSubtotal : partsSubtotal);
  const finalTotalAmount = ticketData?.invoice?.totalInvoiceAmount
    ? Number(ticketData.invoice.totalInvoiceAmount)
    : calculatedTotal;

  // Active OTP code if available
  const activeOtpCode =
    ticketData?.otpCode ||
    visitsList.find((v: any) => v.otpCode && !v.otpVerified)?.otpCode ||
    null;

  const handleCancelTicket = () => {
    Alert.alert(
      'Cancel Request',
      `Are you sure you want to cancel ${type === 'INSTALLATION' ? 'installation' : 'service ticket'} ${ticketNumber}?`,
      [
        { text: 'No, Keep Active', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await complaintApi.cancelComplaint(ticketId);
              setTicketData((prev) => ({ ...prev, status: 'CANCELLED' }));
              Alert.alert('Cancelled', 'Request has been cancelled successfully.');
            } catch (err: any) {
              Alert.alert('Action Failed', err?.error?.message || err?.message || 'Could not cancel request');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleReopenTicket = () => {
    Alert.alert('Reopen Request', `Would you like to reopen ticket ${ticketNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reopen Ticket',
        onPress: async () => {
          setReopening(true);
          try {
            await complaintApi.reopenComplaint(ticketId);
            setTicketData((prev) => ({ ...prev, status: 'OPEN' }));
            Alert.alert('Reopened', 'Your request has been reopened for follow-up inspection.');
          } catch (err: any) {
            Alert.alert('Action Failed', err?.error?.message || err?.message || 'Could not reopen request');
          } finally {
            setReopening(false);
          }
        },
      },
    ]);
  };

  const handleRescheduleConfirm = async (slot: (typeof RESCHEDULE_OPTIONS)[0]) => {
    setShowRescheduleModal(false);
    setRescheduling(true);
    try {
      const newScheduledIso = slot.getIso();
      const res = await bookingApi.rescheduleBooking(ticketId, newScheduledIso);
      if (res?.success || res?.data) {
        setTicketData((prev) => ({ ...prev, preferredSlot: newScheduledIso }));
        Alert.alert('Appointment Rescheduled! 📅', `Appointment moved to ${slot.label}.`);
      } else {
        Alert.alert('Reschedule Failed', res?.error?.message || 'Failed to reschedule appointment');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.error?.message || err?.message || 'Could not reschedule appointment');
    } finally {
      setRescheduling(false);
    }
  };

  const handleCall = (phone?: string | null) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone) {
      Linking.openURL(`tel:${cleanPhone}`).catch(() => {
        Alert.alert('Call Error', 'Could not open phone dialer.');
      });
    }
  };

  const handleEmail = (email?: string | null) => {
    if (!email) return;
    Linking.openURL(`mailto:${email.trim()}`).catch(() => {
      Alert.alert('Email Error', 'Could not open email client.');
    });
  };

  const statusBadgeVariant: BadgeVariant = useMemo(() => {
    if (isResolved) return 'success';
    if (isCancelled) return 'danger';
    if (status === 'IN_PROGRESS' || status === 'ASSIGNED') return 'info';
    return 'warning';
  }, [status, isResolved, isCancelled]);

  const steps = [
    {
      title: type === 'INSTALLATION' ? 'Installation Requested' : 'Ticket Created',
      time: createdAtFormatted,
      isCompleted: true,
    },
    {
      title: mechanicName
        ? `Technician Assigned (${mechanicName})`
        : shopkeeper?.shopName
        ? `Service Partner: ${shopkeeper.shopName}`
        : 'Service Engineer Assignment',
      time: mechanicName ? (mechanicJobStatus === 'PENDING_ACCEPTANCE' ? 'Assigned' : 'Confirmed') : isClosed ? 'Completed' : 'Pending',
      isCompleted: Boolean(mechanicName) || isClosed,
      isActive: isPending && !mechanicName,
    },
    {
      title: visitsList.length > 0 ? 'Technician Visited Site' : 'Site Inspection & Service',
      time: visitsList.length > 0 ? formatStandardDate((visitsList[0] as any).createdAt || (visitsList[0] as any).visitDate) : (status === 'IN_PROGRESS' ? 'Active' : isClosed ? 'Completed' : '-'),
      isCompleted: visitsList.length > 0 || isClosed,
      isActive: status === 'IN_PROGRESS',
    },
    {
      title: type === 'INSTALLATION' ? 'Installation Completed & Verified' : 'Service Completed & Resolved',
      time: isClosed && !isCancelled ? (ticketData?.updatedAt ? formatStandardDate(ticketData.updatedAt) : 'Completed') : '-',
      isCompleted: isResolved,
    },
  ];

  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title={type === 'INSTALLATION' ? 'Installation Details' : 'Service Ticket Details'}
        subtitle={`Ref: ${ticketNumber}`}
        onBackPress={() => navigation.goBack()}
      />

      {errorMsg && (
        <View style={styles.errorBanner}>
          <AppIcon name="alert-circle-outline" size="sm" color={colors.status.danger} />
          <AppText variant="bodySm" style={styles.errorText}>
            {errorMsg}
          </AppText>
          <TouchableOpacity onPress={fetchTicketDetails} activeOpacity={0.75}>
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
            Loading service specifications...
          </AppText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary.main]}
              tintColor={colors.primary.main}
            />
          }
        >
          {/* Main Hero Card */}
          <Card style={styles.heroCard} padding="md">
            <View style={styles.heroHeader}>
              <View style={styles.headerLeftGroup}>
                <AppText variant="mono" color="primary" style={styles.boldText}>
                  {ticketNumber}
                </AppText>
                <View style={styles.typeBadgeWrapper}>
                  <AppIcon
                    name={type === 'INSTALLATION' ? 'construct-outline' : 'warning-outline'}
                    size="xs"
                    color={type === 'INSTALLATION' ? colors.primary.main : colors.category.orangeIcon}
                  />
                  <AppText variant="caption" color="textSecondary" style={styles.typeBadgeText}>
                    {type === 'INSTALLATION' ? 'Installation' : 'Complaint'}
                  </AppText>
                </View>
              </View>

              <Badge label={status.replace('_', ' ')} variant={statusBadgeVariant} />
            </View>

            <AppText variant="headingLg" color="textPrimary" style={styles.titleText}>
              {serviceType?.name || issueTitle}
            </AppText>

            <View style={styles.pillRow}>
              {serviceType?.name ? (
                <View style={styles.servicePill}>
                  <AppIcon name="build-outline" size="xs" color={colors.primary.main} />
                  <AppText variant="caption" color="primary" style={styles.pillText}>
                    {serviceType.name}
                  </AppText>
                </View>
              ) : null}

              {complaintType?.name ? (
                <View style={styles.issuePill}>
                  <AppIcon name="alert-circle-outline" size="xs" color={colors.status.warning} />
                  <AppText variant="caption" style={styles.warningPillText}>
                    {complaintType.name}
                  </AppText>
                </View>
              ) : null}

              <View style={styles.appliancePill}>
                <AppIcon name="cube-outline" size="xs" color={colors.text.secondary} />
                <AppText variant="caption" color="textSecondary" style={styles.pillText}>
                  {appliance}
                </AppText>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Description / Problem Statement */}
            <View style={styles.infoRow}>
              <AppIcon name="document-text-outline" size="sm" color={colors.primary.main} />
              <View style={styles.infoContent}>
                <AppText variant="caption" color="textMuted">
                  {type === 'INSTALLATION' ? 'Installation Notes' : 'Issue Description'}
                </AppText>
                <AppText variant="bodyMd" color="textPrimary" style={styles.descriptionText}>
                  {ticketData?.cleanDescription || ticketData?.description || ticketData?.rawDescription || issueTitle}
                </AppText>
              </View>
            </View>

            {/* Preferred / Scheduled Appointment Slot or Creation Date */}
            {preferredSlotFormatted ? (
              <View style={styles.infoRow}>
                <AppIcon name="calendar-outline" size="sm" color={colors.category.orangeIcon} />
                <View style={styles.infoContent}>
                  <AppText variant="caption" color="textMuted">
                    Appointment Slot
                  </AppText>
                  <AppText variant="bodyMd" color="textPrimary" style={styles.boldText}>
                    {preferredSlotFormatted}
                  </AppText>
                </View>
              </View>
            ) : (
              <View style={styles.infoRow}>
                <AppIcon name="time-outline" size="sm" color={colors.text.muted} />
                <View style={styles.infoContent}>
                  <AppText variant="caption" color="textMuted">
                    Created On
                  </AppText>
                  <AppText variant="bodyMd" color="textSecondary">
                    {createdAtFormatted}
                  </AppText>
                </View>
              </View>
            )}

            {/* Warranty Badge Banner */}
            <View style={styles.warrantyRow}>
              <AppIcon
                name={isWarranty ? 'shield-checkmark-outline' : 'shield-outline'}
                size="sm"
                color={isWarranty ? colors.category.emeraldIcon : colors.status.warning}
              />
              <AppText
                variant="labelSm"
                style={isWarranty ? styles.warrantyCoveredText : styles.warrantyNonCoveredText}
              >
                {isWarranty
                  ? 'Covered under Active Warranty (Free Labor & Spares)'
                  : 'Out of Warranty (Standard Inspection & Charges Apply)'}
              </AppText>
            </View>
          </Card>

          {/* Secure Completion OTP Card (if active code present and not closed) */}
          {activeOtpCode && !isClosed && (
            <Card style={styles.otpCard} padding="md">
              <View style={styles.otpHeaderRow}>
                <View style={styles.otpIconThumb}>
                  <AppIcon name="key-outline" size="sm" color={colors.primary.main} />
                </View>
                <View style={styles.otpTitleGroup}>
                  <AppText variant="labelMd" color="textPrimary" style={styles.boldText}>
                    Service Completion Verification OTP
                  </AppText>
                  <AppText variant="caption" color="textMuted">
                    Share this code with technician upon job completion
                  </AppText>
                </View>
              </View>

              <View style={styles.otpCodeContainer}>
                <AppText variant="displayMd" color="primary" style={styles.otpText}>
                  {activeOtpCode}
                </AppText>
              </View>
            </Card>
          )}

          {/* Equipment & Registered Appliance Details Card (if saleItem is linked) */}
          {saleItem && (
            <>
              <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
                Appliance & Equipment Details
              </AppText>
              <Card style={styles.applianceCard} padding="md">
                <View style={styles.applianceRow}>
                  <View style={styles.applianceIconThumb}>
                    <AppIcon name="cube-outline" size="sm" color={colors.primary.main} />
                  </View>
                  <View style={styles.applianceInfo}>
                    <AppText variant="labelMd" color="textPrimary" style={styles.boldText} numberOfLines={1}>
                      {saleItem.productName || appliance}
                    </AppText>
                    <View style={styles.applianceMetaRow}>
                      {saleItem.brandName ? (
                        <AppText variant="caption" color="textSecondary">
                          Brand: {saleItem.brandName}
                        </AppText>
                      ) : null}
                      {saleItem.productModel?.name ? (
                        <AppText variant="caption" color="textSecondary">
                          • Model: {saleItem.productModel.name}
                        </AppText>
                      ) : null}
                      {saleItem.categoryName ? (
                        <AppText variant="caption" color="textMuted">
                          • {saleItem.categoryName}
                        </AppText>
                      ) : null}
                    </View>
                    {saleItem.warranty && (
                      <View style={styles.applianceWarrantyChip}>
                        <AppIcon
                          name={saleItem.warranty.active ? 'shield-checkmark' : 'shield-outline'}
                          size="xs"
                          color={saleItem.warranty.active ? colors.category.emeraldIcon : colors.status.warning}
                        />
                        <AppText
                          variant="caption"
                          style={saleItem.warranty.active ? styles.warrantyCoveredText : styles.warrantyNonCoveredText}
                        >
                          {saleItem.warranty.active ? 'Active Manufacturer Warranty' : 'Expired / Non-Warranty Unit'}
                        </AppText>
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            </>
          )}

          {/* Assigned Technician & Dealer Cards Section */}
          {(mechanicName || isPending || shopkeeper?.shopName) && (
            <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
              Service Partner & Technician
            </AppText>
          )}

          {mechanicName ? (
            <Card style={styles.technicianCard} padding="md">
              <View style={styles.techRow}>
                <View style={styles.techAvatar}>
                  <AppIcon name="person" size="md" color={colors.primary.main} />
                </View>
                <View style={styles.techInfo}>
                  <View style={styles.techHeaderLine}>
                    <AppText variant="headingSm" color="textPrimary" style={styles.boldText} numberOfLines={1}>
                      {mechanicName}
                    </AppText>
                    <Badge
                      label={mechanicJobStatus === 'PENDING_ACCEPTANCE' ? 'Assigned (Pending Accept)' : 'Assigned Technician'}
                      variant={mechanicJobStatus === 'PENDING_ACCEPTANCE' ? 'warning' : 'info'}
                    />
                  </View>
                  <AppText variant="caption" color="textSecondary" style={styles.techDesignation} numberOfLines={1}>
                    Certified Service Field Technician
                  </AppText>
                  {mechanicMobile ? (
                    <TouchableOpacity
                      style={styles.phoneButton}
                      activeOpacity={0.7}
                      onPress={() => handleCall(mechanicMobile)}
                    >
                      <AppIcon name="call" size="xs" color={colors.primary.main} />
                      <AppText variant="caption" color="primary" style={styles.contactPhoneText}>
                        {mechanicMobile}
                      </AppText>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </Card>
          ) : isPending ? (
            <Card style={styles.technicianCard} padding="md">
              <View style={styles.techRow}>
                <View style={styles.pendingTechAvatar}>
                  <AppIcon name="time-outline" size="md" color={colors.status.warning} />
                </View>
                <View style={styles.techInfo}>
                  <AppText variant="labelMd" color="textPrimary" style={styles.boldText}>
                    Technician Allocation in Progress
                  </AppText>
                  <AppText variant="caption" color="textSecondary" style={styles.techDesignation}>
                    An authorized field engineer is being assigned to your request.
                  </AppText>
                </View>
              </View>
            </Card>
          ) : null}

          {shopkeeper?.shopName ? (
            <Card style={styles.dealerCard} padding="md">
              <View style={styles.dealerRow}>
                <View style={styles.dealerIconThumb}>
                  <AppIcon name="storefront-outline" size="sm" color={colors.category.indigoIcon} />
                </View>
                <View style={styles.dealerInfo}>
                  <AppText variant="labelMd" color="textPrimary" style={styles.boldText} numberOfLines={1}>
                    {shopkeeper.shopName}
                  </AppText>
                  {shopkeeper.ownerName ? (
                    <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                      Owner: {shopkeeper.ownerName}
                    </AppText>
                  ) : null}
                  <View style={styles.contactActionRow}>
                    {shopkeeper.mobile ? (
                      <TouchableOpacity
                        style={styles.dealerPhoneButton}
                        activeOpacity={0.7}
                        onPress={() => handleCall(shopkeeper.mobile)}
                      >
                        <AppIcon name="call" size="xs" color={colors.category.indigoIcon} />
                        <AppText variant="caption" style={styles.dealerPhoneText}>
                          {shopkeeper.mobile}
                        </AppText>
                      </TouchableOpacity>
                    ) : null}
                    {shopkeeper.email ? (
                      <TouchableOpacity
                        style={styles.dealerEmailButton}
                        activeOpacity={0.7}
                        onPress={() => handleEmail(shopkeeper.email)}
                      >
                        <AppIcon name="mail-outline" size="xs" color={colors.text.secondary} />
                        <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                          {shopkeeper.email}
                        </AppText>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {shopkeeper.gstNumber ? (
                    <AppText variant="caption" color="textMuted" numberOfLines={1} style={styles.metaSpacing}>
                      GSTIN: {shopkeeper.gstNumber}
                    </AppText>
                  ) : null}
                </View>
              </View>
            </Card>
          ) : null}

          {/* Customer & Location Details Card */}
          {customer && (
            <>
              <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
                Customer & Location Details
              </AppText>
              <Card style={styles.customerCard} padding="md">
                <View style={styles.customerRow}>
                  <View style={styles.customerIconThumb}>
                    <AppIcon name="location-outline" size="sm" color={colors.primary.main} />
                  </View>
                  <View style={styles.customerInfo}>
                    <AppText variant="labelMd" color="textPrimary" style={styles.boldText} numberOfLines={1}>
                      {customer.fullName || 'Customer'}
                    </AppText>
                    <View style={styles.contactActionRow}>
                      {customer.mobile ? (
                        <TouchableOpacity
                          style={styles.phoneButton}
                          activeOpacity={0.7}
                          onPress={() => handleCall(customer.mobile)}
                        >
                          <AppIcon name="call" size="xs" color={colors.primary.main} />
                          <AppText variant="caption" color="primary" style={styles.contactPhoneText}>
                            {customer.mobile}
                          </AppText>
                        </TouchableOpacity>
                      ) : null}
                      {customer.email ? (
                        <TouchableOpacity
                          style={styles.customerEmailButton}
                          activeOpacity={0.7}
                          onPress={() => handleEmail(customer.email)}
                        >
                          <AppIcon name="mail-outline" size="xs" color={colors.text.secondary} />
                          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                            {customer.email}
                          </AppText>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {customer.address ? (
                      <AppText variant="bodySm" color="textSecondary" style={styles.addressText}>
                        {customer.address} {customer.pinCode ? `- ${customer.pinCode}` : ''}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              </Card>
            </>
          )}

          {/* Service Lifecycle Progress Stepper */}
          <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
            Service Lifecycle Progress
          </AppText>
          <Card style={styles.timelineCard} padding="md">
            <TimelineStepper steps={steps} />
          </Card>

          {/* Pre-Completion Price Estimate & Terms Card (Shown while service is Active / Open / In-Progress) */}
          {!isResolved && !isCancelled && (
            <>
              <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
                Estimated Service Charges
              </AppText>
              <Card style={styles.estimateCard} padding="md">
                <View style={styles.invoiceHeaderRow}>
                  <View style={styles.invoiceHeaderLeft}>
                    <View style={styles.estimateIconThumb}>
                      <AppIcon name="wallet-outline" size="sm" color={colors.primary.main} />
                    </View>
                    <View style={styles.invoiceTitleWrap}>
                      <AppText variant="labelMd" color="textPrimary" style={styles.boldText}>
                        Booking Price Estimate
                      </AppText>
                      <AppText variant="caption" color="textMuted">
                        Payable upon service completion
                      </AppText>
                    </View>
                  </View>
                  <Badge label="ESTIMATE" variant="neutral" />
                </View>

                <View style={styles.divider} />

                {/* Visiting / Fixed Labor Rate */}
                <View style={styles.billRow}>
                  <View style={styles.billItemLeft}>
                    <AppText variant="bodySm" color="textSecondary" style={styles.billLabel} numberOfLines={1}>
                      Standard Service / Visiting Fee
                    </AppText>
                    <AppText variant="caption" color="textMuted" numberOfLines={1}>
                      {isWarranty ? 'Covered under active warranty' : 'Agreed upfront service rate'}
                    </AppText>
                  </View>
                  <AppText variant="mono" color={isWarranty ? 'textMuted' : 'textPrimary'} style={styles.billAmount}>
                    {isWarranty
                      ? '₹0.00'
                      : baseLaborCharge !== null
                      ? `₹${baseLaborCharge.toFixed(2)}`
                      : 'Quote on Inspection'}
                  </AppText>
                </View>

                {/* Spare Parts Note */}
                <View style={styles.billRow}>
                  <View style={styles.billItemLeft}>
                    <AppText variant="bodySm" color="textSecondary" style={styles.billLabel} numberOfLines={1}>
                      Spare Parts & Consumables
                    </AppText>
                    <AppText variant="caption" color="textMuted" numberOfLines={1}>
                      If required during inspection
                    </AppText>
                  </View>
                  <AppText variant="mono" color="textSecondary" style={styles.billAmount}>
                    As per actuals
                  </AppText>
                </View>

                {/* Warranty saving banner if warranty */}
                {isWarranty && (
                  <View style={styles.warrantySavingBox}>
                    <AppIcon name="shield-checkmark" size="xs" color={colors.category.emeraldIcon || colors.status.success} />
                    <AppText variant="caption" style={styles.warrantySavingText}>
                      Warranty Applied: 100% Free Labor & Spare Coverage
                    </AppText>
                  </View>
                )}

                <View style={styles.divider} />

                {/* Estimated Total */}
                <View style={[styles.billRow, styles.totalBillRow]}>
                  <View style={styles.billItemLeft}>
                    <AppText variant="labelMd" color="textPrimary" style={styles.boldText}>
                      Estimated Payable Amount
                    </AppText>
                    <AppText variant="caption" color="textMuted">
                      Pay to technician (Cash / UPI)
                    </AppText>
                  </View>
                  <AppText variant="headingMd" color="primary" style={styles.totalAmountText}>
                    {isWarranty
                      ? '₹0.00'
                      : baseLaborCharge !== null
                      ? `₹${baseLaborCharge.toFixed(2)}`
                      : 'Inspection Quote'}
                  </AppText>
                </View>

                <View style={styles.estimateNoticeBox}>
                  <AppIcon name="information-circle-outline" size="xs" color={colors.text.secondary} />
                  <AppText variant="caption" color="textSecondary" style={styles.estimateNoticeText}>
                    Final itemized tax invoice will be generated automatically once service is completed.
                  </AppText>
                </View>
              </Card>
            </>
          )}

          {/* Replaced Spare Parts & Consumables (if any) */}
          {partsList.length > 0 && (
            <>
              <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
                Replaced Spare Parts & Components
              </AppText>
              <Card style={styles.partsCard} padding="md">
                {partsList.map((part: any, idx: number) => {
                  const qty = Number(part.quantity || 1);
                  const cost = Number(part.cost || 0);
                  const itemTotal = qty * cost;

                  return (
                    <View key={part.id || idx} style={styles.partItemRow}>
                      <View style={styles.partItemLeft}>
                        <AppText variant="bodyMd" color="textPrimary" style={styles.boldText} numberOfLines={1}>
                          {part.partName}
                        </AppText>
                        <AppText variant="caption" color="textMuted">
                          Quantity: {qty} Unit{qty > 1 ? 's' : ''} × ₹{cost.toFixed(2)}
                        </AppText>
                      </View>
                      <View style={styles.partItemRight}>
                        {isWarranty ? (
                          <Badge label="FREE (Covered)" variant="success" />
                        ) : (
                          <AppText variant="mono" color="textPrimary" style={styles.partCostText}>
                            ₹{itemTotal.toFixed(2)}
                          </AppText>
                        )}
                      </View>
                    </View>
                  );
                })}
                <View style={styles.partsSubtotalRow}>
                  <AppText variant="labelMd" color="textSecondary" style={styles.boldText}>
                    Parts Subtotal:
                  </AppText>
                  <View style={styles.partSubtotalRight}>
                    {isWarranty ? (
                      <AppText variant="labelMd" color="success" style={styles.boldText}>
                        ₹0.00 (Covered)
                      </AppText>
                    ) : (
                      <AppText variant="mono" color="textPrimary" style={styles.boldText}>
                        ₹{partsSubtotal.toFixed(2)}
                      </AppText>
                    )}
                  </View>
                </View>
              </Card>
            </>
          )}

          {/* Technician Field Visit Logs */}
          {visitsList.length > 0 && (
            <>
              <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
                Technician Visit Logs
              </AppText>
              {visitsList.map((v: any, idx: number) => (
                <Card key={v.id || idx} style={styles.visitCard} padding="md">
                  <View style={styles.visitHeaderRow}>
                    <View style={styles.visitTechInfo}>
                      <AppIcon name="shield-checkmark" size="sm" color={colors.status.success} />
                      <AppText variant="labelMd" color="textPrimary" style={styles.boldText}>
                        Visit on {formatStandardDate(v.visitDate || v.createdAt)}
                      </AppText>
                    </View>
                    <Badge label={v.otpVerified ? 'OTP VERIFIED' : 'VISITED'} variant="success" />
                  </View>
                  {v.notes ? (
                    <View style={styles.notesBox}>
                      <AppText variant="caption" color="textMuted">
                        Technician Notes:
                      </AppText>
                      <AppText variant="bodySm" color="textPrimary">
                        {v.notes}
                      </AppText>
                    </View>
                  ) : null}
                </Card>
              ))}
            </>
          )}

          {/* Official Itemized Bill & Tax Invoice Breakdown — Shown only after service is completed/resolved */}
          {isResolved && (
            <>
              <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
                Service Invoice & Final Bill
              </AppText>
              <Card style={styles.invoiceCard} padding="md">
                <View style={styles.invoiceHeaderRow}>
                  <View style={styles.invoiceHeaderLeft}>
                    <View style={styles.invoiceIconThumb}>
                      <AppIcon name="receipt-outline" size="sm" color={colors.primary.main} />
                    </View>
                    <View style={styles.invoiceTitleWrap}>
                      <AppText variant="labelMd" color="textPrimary" style={styles.boldText} numberOfLines={1}>
                        {ticketData?.invoice?.invoiceNumber || (ticketNumber ? ticketNumber.replace('SRV-', 'INV-') : 'INV-SERVICE')}
                      </AppText>
                      <AppText variant="caption" color="textMuted" numberOfLines={1}>
                        Issued: {createdAtFormatted}
                      </AppText>
                    </View>
                  </View>
                  <Badge
                    label={ticketData?.invoice?.paymentStatus || 'PAID'}
                    variant={ticketData?.invoice?.paymentStatus === 'PAID' || !isCancelled ? 'success' : 'warning'}
                  />
                </View>

                <View style={styles.divider} />

                {/* Base Labor / Inspection Charge */}
                <View style={styles.billRow}>
                  <View style={styles.billItemLeft}>
                    <AppText variant="bodySm" color="textSecondary" style={styles.billLabel} numberOfLines={1}>
                      Inspection & Labor Charge
                    </AppText>
                    {isWarranty && (
                      <AppText variant="caption" color="textMuted" numberOfLines={1}>
                        Covered under warranty
                      </AppText>
                    )}
                  </View>
                  <AppText variant="mono" color={isWarranty ? 'textMuted' : 'textPrimary'} style={styles.billAmount}>
                    {isWarranty
                      ? '₹0.00'
                      : baseLaborCharge !== null
                      ? `₹${baseLaborCharge.toFixed(2)}`
                      : '₹0.00'}
                  </AppText>
                </View>

                {/* Parts Total */}
                <View style={styles.billRow}>
                  <View style={styles.billItemLeft}>
                    <AppText variant="bodySm" color="textSecondary" style={styles.billLabel} numberOfLines={1}>
                      Replaced Spare Parts Total
                    </AppText>
                    {partsList.length > 0 ? (
                      <AppText variant="caption" color="textMuted" numberOfLines={1}>
                        {partsList.length} component(s) replaced
                      </AppText>
                    ) : isWarranty ? (
                      <AppText variant="caption" color="textMuted" numberOfLines={1}>
                        No chargeable parts
                      </AppText>
                    ) : null}
                  </View>
                  <AppText variant="mono" color={isWarranty ? 'textMuted' : 'textPrimary'} style={styles.billAmount}>
                    {isWarranty ? '₹0.00' : partsList.length > 0 ? `₹${partsSubtotal.toFixed(2)}` : '₹0.00'}
                  </AppText>
                </View>

                {/* Warranty Saving Banner if under warranty */}
                {isWarranty && (
                  <View style={styles.warrantySavingBox}>
                    <AppIcon name="shield-checkmark" size="xs" color={colors.category.emeraldIcon || colors.status.success} />
                    <AppText variant="caption" style={styles.warrantySavingText}>
                      Warranty Applied: 100% Free Labor & Spare Coverage
                    </AppText>
                  </View>
                )}

                <View style={styles.divider} />

                {/* Total Bill Amount */}
                <View style={[styles.billRow, styles.totalBillRow]}>
                  <View style={styles.billItemLeft}>
                    <AppText variant="labelMd" color="textPrimary" style={styles.boldText}>
                      Total Bill Amount
                    </AppText>
                    <AppText variant="caption" color="textMuted">
                      Settled in Full
                    </AppText>
                  </View>
                  <AppText
                    variant="headingMd"
                    color="textPrimary"
                    style={styles.totalAmountText}
                  >
                    ₹{finalTotalAmount.toFixed(2)}
                  </AppText>
                </View>
              </Card>
            </>
          )}

          {/* Customer Review & Rating Section for Completed Services with an Assigned Technician */}
          {isResolved && Boolean(mechanicName || primaryJob?.rating) && (
            <>
              <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
                Service Feedback & Rating
              </AppText>
              <Card style={styles.reviewCard} padding="md">
                {primaryJob?.rating ? (
                  <View style={styles.reviewedBox}>
                    <View style={styles.reviewHeaderRow}>
                      <View style={styles.reviewStarGroup}>
                        <AppIcon name="star" size="sm" color={colors.status.warning} />
                        <AppText variant="labelLg" color="textPrimary" style={styles.boldText}>
                          {primaryJob.rating} / 5 Rating
                        </AppText>
                      </View>
                      <Badge label="REVIEWED" variant="success" />
                    </View>
                    {primaryJob.feedback && (
                      <AppText variant="bodyMd" color="textSecondary" style={styles.feedbackQuote}>
                        "{primaryJob.feedback}"
                      </AppText>
                    )}
                  </View>
                ) : (
                  <View style={styles.unreviewedBox}>
                    <View style={styles.ratingPromptRow}>
                      <View style={styles.ratingPromptIconWrap}>
                        <AppIcon name="star" size="md" color={colors.status.warning} />
                      </View>
                      <View style={styles.ratingPromptTextWrap}>
                        <AppText variant="labelLg" color="textPrimary" style={styles.boldText}>
                          Rate Your Service Experience
                        </AppText>
                        <AppText variant="caption" color="textSecondary">
                          Help us maintain high quality service by rating {mechanicName ? `technician ${mechanicName}` : 'your technician'}.
                        </AppText>
                      </View>
                    </View>
                    <Button
                      title="Rate & Review Service"
                      variant="cta"
                      onPress={() =>
                        navigation.navigate('SubmitReviewScreen', {
                          jobId: primaryJob?.id || ticketId,
                          jobType: type === 'INSTALLATION' ? 'INSTALLATION' : 'SERVICE_JOB',
                          description: issueTitle,
                          mechanicName: mechanicName || undefined,
                        })
                      }
                      style={styles.reviewCtaBtn}
                    />
                  </View>
                )}
              </Card>
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.actionBtnSection}>
            {isPending && (
              <View style={styles.btnRow}>
                <Button
                  title={rescheduling ? 'Rescheduling...' : 'Reschedule Slot'}
                  variant="outline"
                  onPress={() => setShowRescheduleModal(true)}
                  loading={rescheduling}
                  disabled={rescheduling || cancelling}
                  style={styles.flexBtn}
                />
                <Button
                  title={cancelling ? 'Cancelling...' : 'Cancel Request'}
                  variant="outline"
                  onPress={handleCancelTicket}
                  loading={cancelling}
                  disabled={cancelling || rescheduling}
                  style={styles.flexBtn}
                />
              </View>
            )}

            {isCancelled && (
              <Button
                title={reopening ? 'Reopening...' : 'Reopen Ticket'}
                variant="outline"
                onPress={handleReopenTicket}
                loading={reopening}
                disabled={reopening}
                style={styles.fullWidthBtn}
              />
            )}
          </View>
        </ScrollView>
      )}

      {/* Reschedule Modal */}
      <Modal visible={showRescheduleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText variant="headingMd" color="textPrimary">
                Select New Appointment Slot
              </AppText>
              <TouchableOpacity onPress={() => setShowRescheduleModal(false)}>
                <AppIcon name="close" size="sm" color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {RESCHEDULE_OPTIONS.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalSlotRow}
                activeOpacity={0.7}
                onPress={() => handleRescheduleConfirm(slot)}
              >
                <AppIcon name="calendar-outline" size="sm" color={colors.primary.main} />
                <AppText variant="bodyMd" color="textPrimary" style={styles.modalSlotText}>
                  {slot.label}
                </AppText>
                <AppIcon name="chevron-forward" size="xs" color={colors.text.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    scrollContent: {
      paddingTop: 0,
      paddingBottom: safeBottom + 40,
    },
    heroCard: {
      marginBottom: spacing.md,
    },
    heroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    headerLeftGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    typeBadgeWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.neutral[100],
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 2,
      borderRadius: radius.sm,
      gap: 3,
    },
    typeBadgeText: {
      fontSize: 10,
      fontWeight: '600',
    },
    titleText: {
      marginTop: 2,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.xs + 2,
    },
    appliancePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.neutral[100],
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    issuePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.status.warningBg,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    servicePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primary.light,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    pillText: {
      fontWeight: '600',
      fontSize: 11,
    },
    warningPillText: {
      fontWeight: '600',
      fontSize: 11,
      color: colors.status.warning,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.light,
      marginVertical: spacing.sm + 2,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginVertical: 4,
      gap: spacing.sm,
    },
    infoContent: {
      flex: 1,
    },
    descriptionText: {
      marginTop: 2,
      lineHeight: 20,
    },
    warrantyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      paddingTop: spacing.xs + 2,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      gap: spacing.xs,
    },
    warrantyCoveredText: {
      flex: 1,
      color: colors.category.emeraldIcon,
    },
    warrantyNonCoveredText: {
      flex: 1,
      color: colors.text.muted,
    },
    otpCard: {
      backgroundColor: colors.primary.light,
      borderColor: colors.primary.main,
      borderWidth: 1,
      marginBottom: spacing.md,
    },
    otpHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    otpIconThumb: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background.paper,
      alignItems: 'center',
      justifyContent: 'center',
    },
    otpTitleGroup: {
      flex: 1,
    },
    otpCodeContainer: {
      backgroundColor: colors.background.paper,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
    },
    otpText: {
      letterSpacing: 8,
      fontWeight: '800',
    },
    sectionTitle: {
      marginBottom: spacing.xs + 2,
      marginTop: spacing.xs,
    },
    applianceCard: {
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    applianceRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    applianceIconThumb: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 2,
    },
    applianceInfo: {
      flex: 1,
      minWidth: 0,
    },
    applianceMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 2,
    },
    applianceWarrantyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    technicianCard: {
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    techRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
    },
    techAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    pendingTechAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.neutral[100],
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    techInfo: {
      flex: 1,
      minWidth: 0,
    },
    techHeaderLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.xs,
    },
    techDesignation: {
      marginTop: 2,
    },
    phoneButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: colors.primary.light,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      marginTop: 4,
    },
    dealerPhoneButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.category.indigoBg,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    dealerEmailButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.neutral[100],
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      maxWidth: 180,
    },
    customerEmailButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.neutral[100],
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      maxWidth: 180,
    },
    contactActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: 4,
    },
    dealerPhoneText: {
      fontWeight: '700',
      color: colors.category.indigoIcon,
    },
    contactPhoneText: {
      fontWeight: '700',
      color: colors.primary.main,
    },
    metaSpacing: {
      marginTop: 4,
    },
    dealerCard: {
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    dealerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    dealerIconThumb: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.category.indigoBg,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 2,
    },
    dealerInfo: {
      flex: 1,
      minWidth: 0,
    },
    customerCard: {
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    customerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    customerIconThumb: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 2,
    },
    customerInfo: {
      flex: 1,
      minWidth: 0,
    },
    addressText: {
      marginTop: 4,
      lineHeight: 18,
    },
    timelineCard: {
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    partsCard: {
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    partItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      gap: spacing.sm,
    },
    partItemLeft: {
      flex: 1,
      minWidth: 0,
    },
    partItemRight: {
      alignItems: 'flex-end',
      flexShrink: 0,
    },
    partCostText: {
      fontWeight: '700',
      textAlign: 'right',
    },
    partsSubtotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.sm,
      marginTop: spacing.xs,
      gap: spacing.sm,
    },
    partSubtotalRight: {
      alignItems: 'flex-end',
      flexShrink: 0,
    },
    visitCard: {
      marginBottom: spacing.sm,
    },
    visitHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    visitTechInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    notesBox: {
      backgroundColor: colors.neutral[100],
      padding: spacing.sm,
      borderRadius: radius.sm,
      marginTop: spacing.sm,
    },
    estimateCard: {
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    estimateIconThumb: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    estimateNoticeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.neutral[100],
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.sm,
      marginTop: spacing.sm,
      gap: spacing.xs,
    },
    estimateNoticeText: {
      flex: 1,
      lineHeight: 16,
    },
    invoiceCard: {
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    invoiceHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    invoiceHeaderLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
    },
    invoiceIconThumb: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    invoiceTitleWrap: {
      flex: 1,
      minWidth: 0,
    },
    billRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      gap: spacing.sm,
    },
    billItemLeft: {
      flex: 1,
      minWidth: 0,
    },
    billLabel: {
      lineHeight: 18,
    },
    billAmount: {
      fontWeight: '600',
      textAlign: 'right',
      flexShrink: 0,
    },
    warrantySavingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.category.emeraldBg || '#DCFCE7',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.sm,
      marginVertical: spacing.xs,
      gap: spacing.xs,
    },
    warrantySavingText: {
      color: colors.category.emeraldIcon || '#15803D',
      fontWeight: '700',
      flex: 1,
      fontSize: 11,
    },
    totalBillRow: {
      marginTop: 0,
      paddingTop: 0,
    },
    totalAmountText: {
      fontWeight: '800',
      textAlign: 'right',
      flexShrink: 0,
    },
    reviewCard: {
      marginBottom: spacing.md,
      backgroundColor: colors.background.paper,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    reviewedBox: {
      gap: spacing.xs,
    },
    reviewHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    reviewStarGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    feedbackQuote: {
      fontStyle: 'italic',
      marginTop: spacing.xs,
      color: colors.text.secondary,
    },
    unreviewedBox: {
      gap: spacing.sm,
    },
    ratingPromptRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    ratingPromptIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.category.orangeBg || '#FEF3C7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingPromptTextWrap: {
      flex: 1,
    },
    reviewCtaBtn: {
      marginTop: spacing.xs,
    },
    actionBtnSection: {
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    btnRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    flexBtn: {
      flex: 1,
    },
    fullWidthBtn: {
      width: '100%',
    },
    boldText: {
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background.paper,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      paddingBottom: safeBottom + 16,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    modalSlotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.neutral[100],
      marginBottom: spacing.xs,
      gap: spacing.sm,
    },
    modalSlotText: {
      flex: 1,
      fontWeight: '600',
    },
  });
};
