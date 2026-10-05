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
import { makeStyles } from './ComplaintDetailScreen.styles';

const RESCHEDULE_OPTIONS = [
  {
    label: 'Tomorrow, 09:00 AM - 10:00 AM',
    getIso: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: 'Tomorrow, 11:00 AM - 12:00 PM',
    getIso: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(11, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: 'Tomorrow, 02:00 PM - 03:00 PM',
    getIso: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(14, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: 'Tomorrow, 04:00 PM - 05:00 PM',
    getIso: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(16, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: 'Day after, 09:00 AM - 10:00 AM',
    getIso: () => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      d.setHours(9, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: 'Day after, 11:00 AM - 12:00 PM',
    getIso: () => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      d.setHours(11, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: 'Day after, 02:00 PM - 03:00 PM',
    getIso: () => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      d.setHours(14, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: 'Day after, 04:00 PM - 05:00 PM',
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
      } catch (_) { }
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
    return `${parsed.getDate()} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}${includeTime ? ` • ${h12}:${minStr} ${ampm}` : ''
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

  // Dynamic Reschedule State
  const [rescheduleDateOffset, setRescheduleDateOffset] = useState<number>(1);
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('09:00 AM - 10:00 AM');
  const [fetchingDynamicSlots, setFetchingDynamicSlots] = useState<boolean>(false);
  const [dynamicSlotsList, setDynamicSlotsList] = useState<Array<{ label: string; isAvailable: boolean; reason?: string }>>([
    { label: '09:00 AM - 10:00 AM', isAvailable: true },
    { label: '10:00 AM - 11:00 AM', isAvailable: true },
    { label: '11:00 AM - 12:00 PM', isAvailable: true },
    { label: '12:00 PM - 01:00 PM', isAvailable: true },
    { label: '01:00 PM - 02:00 PM', isAvailable: true },
    { label: '02:00 PM - 03:00 PM', isAvailable: true },
    { label: '03:00 PM - 04:00 PM', isAvailable: true },
    { label: '04:00 PM - 05:00 PM', isAvailable: true },
    { label: '05:00 PM - 06:00 PM', isAvailable: true },
    { label: '06:00 PM - 07:00 PM', isAvailable: true },
  ]);

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

  // 1. Extracted Nested Objects & Relations
  const customer = ticketData?.customer;
  const shopkeeper = ticketData?.shopkeeper;
  const complaintType = ticketData?.complaintType;
  const serviceType = ticketData?.serviceType;
  const saleItem = ticketData?.saleItem;

  // 2. Service Jobs, Visits & Parts
  const serviceJobs: ComplaintServiceJob[] = Array.isArray(ticketData?.serviceJobs) ? ticketData.serviceJobs : [];
  const primaryJob: ComplaintServiceJob | null = serviceJobs.length > 0 ? serviceJobs[0] : null;

  const visitsList =
    Array.isArray(ticketData?.visits) && ticketData.visits.length > 0
      ? ticketData.visits
      : serviceJobs.flatMap((j) => j.visits || []);

  const partsList: any[] = visitsList.flatMap((v: any) => v.parts || v.partsReplaced || []);
  const primaryVisit: any = visitsList?.[0] || null;

  // 3. Appointment Slot & Booking Date Derivations (Industry Standard)
  const createdAtFormatted = formatStandardDate(ticketData?.createdAt);

  let preferredSlotFormatted: string | null = null;
  let isImmediateSlot = false;

  if (ticketData?.preferredSlot && typeof ticketData.preferredSlot === 'string') {
    if (ticketData.preferredSlot.includes('•')) {
      const parts = ticketData.preferredSlot.split('•').map((p) => p.trim());
      const datePart = formatStandardDate(parts[0], false);
      const timePart = formatSlotTimeString(parts[1]);
      preferredSlotFormatted = `${datePart} • ${timePart}`;
    } else {
      preferredSlotFormatted = formatStandardDate(ticketData.preferredSlot, true);
      if (preferredSlotFormatted.includes('•')) {
        const parts = preferredSlotFormatted.split('•').map((p) => p.trim());
        preferredSlotFormatted = `${parts[0]} • ${formatSlotTimeString(parts[1])}`;
      }
    }
  } else if (ticketData?.preferredVisitDate) {
    const formattedDateOnly = formatStandardDate(ticketData.preferredVisitDate, false);
    const timePart = ticketData?.preferredTimeSlot
      ? formatSlotTimeString(ticketData.preferredTimeSlot)
      : extractSlotTimeRangeFromDate(ticketData.preferredVisitDate);
    preferredSlotFormatted = timePart ? `${formattedDateOnly} • ${timePart}` : formatStandardDate(ticketData.preferredVisitDate, true);
  } else if (ticketData?.scheduledAt) {
    const formattedDateOnly = formatStandardDate(ticketData.scheduledAt, false);
    const timePart = ticketData?.preferredTimeSlot
      ? formatSlotTimeString(ticketData.preferredTimeSlot)
      : extractSlotTimeRangeFromDate(ticketData.scheduledAt);
    preferredSlotFormatted = timePart ? `${formattedDateOnly} • ${timePart}` : formatStandardDate(ticketData.scheduledAt, true);
  } else if (ticketData?.preferredTimeSlot) {
    preferredSlotFormatted = formatSlotTimeString(ticketData.preferredTimeSlot);
  } else if (primaryVisit?.visitDate) {
    const formattedDateOnly = formatStandardDate(primaryVisit.visitDate, false);
    const timePart = extractSlotTimeRangeFromDate(primaryVisit.visitDate);
    preferredSlotFormatted = timePart ? `${formattedDateOnly} • ${timePart}` : formatStandardDate(primaryVisit.visitDate, true);
  } else if (ticketData?.description && /\[Preferred:\s*([^\]]+)\]/i.test(ticketData.description)) {
    const match = ticketData.description.match(/\[Preferred:\s*([^\]]+)\]/i);
    const rawMatch = match ? match[1] : null;
    if (rawMatch && rawMatch.includes('•')) {
      const parts = rawMatch.split('•').map((p) => p.trim());
      preferredSlotFormatted = `${parts[0]} • ${formatSlotTimeString(parts[1])}`;
    } else {
      preferredSlotFormatted = rawMatch;
    }
  }

  if (!preferredSlotFormatted || preferredSlotFormatted === 'N/A') {
    isImmediateSlot = true;
    preferredSlotFormatted = 'Immediate / ASAP (Standard Window)';
  }

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

  // 6. Dual Service Verification Security OTPs (Industry Standard)
  const isStartOtpVerified = Boolean(
    primaryVisit?.otpVerified ||
    ticketData?.startOtpVerified ||
    (status !== 'PENDING' && status !== 'OPEN' && status !== 'PENDING_ACCEPTANCE' && status !== 'ASSIGNED')
  );

  const startOtpCode =
    ticketData?.startOtp ||
    primaryVisit?.startOtp ||
    null;

  const isCompletionOtpVerified =
    isResolved || Boolean(ticketData?.completionOtpVerified || primaryVisit?.completionOtpVerified);

  const completionOtpCode =
    ticketData?.completionOtp ||
    primaryVisit?.completionOtp ||
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

  const upcomingRescheduleDates = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayName = i === 1 ? 'Tomorrow' : i === 2 ? 'Day After' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      list.push({ offset: i, dateStr, dayName, monthDay, fullDate: d });
    }
    return list;
  }, []);

  const selectedRescheduleDateObj = useMemo(() => {
    return upcomingRescheduleDates.find((d) => d.offset === rescheduleDateOffset) || upcomingRescheduleDates[0];
  }, [upcomingRescheduleDates, rescheduleDateOffset]);

  useEffect(() => {
    if (!showRescheduleModal) return;
    const mechanicId = (primaryJob as any)?.mechanicId || (primaryJob as any)?.mechanic?.id;

    const defaultFallbackSlots = [
      { label: '09:00 AM - 10:00 AM', isAvailable: true },
      { label: '10:00 AM - 11:00 AM', isAvailable: true },
      { label: '11:00 AM - 12:00 PM', isAvailable: true },
      { label: '12:00 PM - 01:00 PM', isAvailable: true },
      { label: '01:00 PM - 02:00 PM', isAvailable: true },
      { label: '02:00 PM - 03:00 PM', isAvailable: true },
      { label: '03:00 PM - 04:00 PM', isAvailable: true },
      { label: '04:00 PM - 05:00 PM', isAvailable: true },
      { label: '05:00 PM - 06:00 PM', isAvailable: true },
      { label: '06:00 PM - 07:00 PM', isAvailable: true },
    ];

    if (mechanicId && selectedRescheduleDateObj?.dateStr) {
      setFetchingDynamicSlots(true);
      bookingApi.getMechanicPublicSlots(mechanicId, selectedRescheduleDateObj.dateStr)
        .then((res) => {
          if (res?.success && res?.data?.slots && Array.isArray(res.data.slots) && res.data.slots.length > 0) {
            const mappedSlots = res.data.slots
              .filter((s: any) => s.isActive !== false)
              .map((s: any) => ({
                label: s.label,
                isAvailable: s.isAvailable !== false,
                reason: s.reason || (s.isAvailable === false ? 'Already Booked' : undefined),
              }));
            if (mappedSlots.length > 0) {
              setDynamicSlotsList(mappedSlots);
              const firstAvailable = mappedSlots.find((s: any) => s.isAvailable);
              if (firstAvailable) {
                setRescheduleSlot(firstAvailable.label);
              }
              return;
            }
          }
          setDynamicSlotsList(defaultFallbackSlots);
        })
        .catch(() => {
          setDynamicSlotsList(defaultFallbackSlots);
        })
        .finally(() => setFetchingDynamicSlots(false));
    } else {
      setDynamicSlotsList(defaultFallbackSlots);
    }
  }, [showRescheduleModal, rescheduleDateOffset, selectedRescheduleDateObj, primaryJob]);

  const handleRescheduleConfirmDynamic = async () => {
    if (!selectedRescheduleDateObj) return;
    setShowRescheduleModal(false);
    setRescheduling(true);
    try {
      const d = new Date(selectedRescheduleDateObj.fullDate);
      let hour = 9;
      const match = rescheduleSlot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let h = parseInt(match[1], 10);
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        hour = h;
      }
      d.setHours(hour, 0, 0, 0);
      const scheduledIso = d.toISOString();

      const res = await bookingApi.rescheduleBooking(ticketId, scheduledIso, rescheduleSlot);
      if (res?.success || res?.data) {
        setTicketData((prev) => ({
          ...prev,
          preferredVisitDate: scheduledIso,
          preferredTimeSlot: rescheduleSlot,
          preferredSlot: `${selectedRescheduleDateObj.dateStr} • ${rescheduleSlot}`,
        }));
        Alert.alert(
          'Appointment Rescheduled! 📅',
          `Appointment moved to ${selectedRescheduleDateObj.dayName} (${selectedRescheduleDateObj.monthDay}) at ${rescheduleSlot}.`
        );
        fetchTicketDetails();
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

  const steps = isCancelled
    ? [
      {
        title: type === 'INSTALLATION' ? 'Installation Requested' : 'Ticket Created',
        time: createdAtFormatted,
        isCompleted: true,
      },
      {
        title: 'Service Request Cancelled',
        time: ticketData?.updatedAt ? formatStandardDate(ticketData.updatedAt) : 'Cancelled',
        isCompleted: false,
        isActive: false,
        isCancelled: true,
      },
    ]
    : [
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
        time: mechanicName ? (mechanicJobStatus === 'PENDING_ACCEPTANCE' ? 'Assigned' : 'Confirmed') : isResolved ? 'Completed' : 'Pending',
        isCompleted: Boolean(mechanicName) || isResolved,
        isActive: isPending && !mechanicName,
      },
      {
        title: visitsList.length > 0 ? 'Technician Visited Site' : 'Site Inspection & Service',
        time: visitsList.length > 0 ? formatStandardDate((visitsList[0] as any).createdAt || (visitsList[0] as any).visitDate) : (status === 'IN_PROGRESS' ? 'Active' : isResolved ? 'Completed' : '-'),
        isCompleted: visitsList.length > 0 || isResolved,
        isActive: status === 'IN_PROGRESS',
      },
      {
        title: type === 'INSTALLATION' ? 'Installation Completed & Verified' : 'Service Completed & Resolved',
        time: isResolved ? (ticketData?.updatedAt ? formatStandardDate(ticketData.updatedAt) : 'Completed') : '-',
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
                  {ticketData?.description || issueTitle}
                </AppText>
              </View>
            </View>

            {/* Preferred / Scheduled Appointment Slot */}
            <View style={styles.infoRow}>
              <AppIcon name="calendar-outline" size="sm" color={colors.category.orangeIcon} />
              <View style={styles.infoContent}>
                <View style={styles.slotTitleRow}>
                  <AppText variant="caption" color="textMuted">
                    Appointment Slot
                  </AppText>
                  {isImmediateSlot && (
                    <Badge
                      label="ASAP Window"
                      variant="primary"
                    />
                  )}
                </View>
                <AppText variant="bodyMd" color="textPrimary" style={styles.boldText}>
                  {preferredSlotFormatted}
                </AppText>
              </View>
            </View>

            {/* Request Placed On (Creation Date) */}
            <View style={styles.infoRow}>
              <AppIcon name="time-outline" size="sm" color={colors.text.muted} />
              <View style={styles.infoContent}>
                <AppText variant="caption" color="textMuted">
                  Request Placed On
                </AppText>
                <AppText variant="bodyMd" color="textSecondary">
                  {createdAtFormatted}
                </AppText>
              </View>
            </View>

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

          {/* Dual Service Security Verification OTP Card (Industry Standard) */}
          {!isCancelled && (startOtpCode || completionOtpCode) && (
            <Card style={styles.dualOtpCard} padding="md">
              {/* Header */}
              <View style={styles.dualOtpHeaderRow}>
                <View style={styles.dualOtpHeaderThumb}>
                  <AppIcon name="shield-checkmark-outline" size="sm" color={colors.primary.main} />
                </View>
                <View style={styles.dualOtpHeaderContent}>
                  <AppText variant="labelLg" color="textPrimary" style={styles.boldText}>
                    Doorstep Service Verification
                  </AppText>
                  <AppText variant="caption" color="textMuted">
                    Two-step security codes for safe doorstep fulfillment
                  </AppText>
                </View>
              </View>

              {/* Step 1: Start Service OTP */}
              <View style={styles.otpStepCard}>
                <View style={styles.otpStepTopRow}>
                  <View style={styles.otpStepLabelGroup}>
                    <AppText variant="labelMd" color="textPrimary" style={styles.boldText}>
                      1. Start Service OTP
                    </AppText>
                    <AppText variant="caption" color="textMuted" style={styles.otpStepDesc}>
                      {isStartOtpVerified
                        ? 'Verified by technician upon arrival at doorstep'
                        : 'Share with technician when they arrive to begin work'}
                    </AppText>
                  </View>
                  <Badge
                    label={isStartOtpVerified ? 'VERIFIED ✓' : 'SHARE ON ARRIVAL'}
                    variant={isStartOtpVerified ? 'success' : 'primary'}
                  />
                </View>

                {startOtpCode && (
                  <View style={isStartOtpVerified ? styles.otpCodeBoxVerified : styles.otpCodeBoxActive}>
                    <AppText
                      variant="headingLg"
                      style={isStartOtpVerified ? styles.otpCodeTextVerified : styles.otpCodeTextPrimary}
                    >
                      {startOtpCode.split('').join('  ')}
                    </AppText>
                    {isStartOtpVerified && (
                      <View style={styles.otpVerifiedIndicator}>
                        <AppIcon name="checkmark-circle" size="sm" color={colors.status.success} />
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Divider */}
              <View style={styles.dualOtpDivider} />

              {/* Step 2: Completion Service OTP */}
              <View style={styles.otpStepCard}>
                <View style={styles.otpStepTopRow}>
                  <View style={styles.otpStepLabelGroup}>
                    <AppText variant="labelMd" color="textPrimary" style={styles.boldText}>
                      2. Completion Service OTP
                    </AppText>
                    <AppText variant="caption" color="textMuted" style={styles.otpStepDesc}>
                      {isCompletionOtpVerified
                        ? 'Job completed & signed off successfully'
                        : status === 'IN_PROGRESS'
                          ? 'Share ONLY after technician finishes work & you test appliance'
                          : 'Keep ready. Required once technician completes repairs'}
                    </AppText>
                  </View>
                  <Badge
                    label={
                      isCompletionOtpVerified
                        ? 'COMPLETED ✓'
                        : status === 'IN_PROGRESS'
                          ? 'ACTIVE • SHARE AFTER WORK'
                          : 'PENDING START'
                    }
                    variant={
                      isCompletionOtpVerified
                        ? 'success'
                        : status === 'IN_PROGRESS'
                          ? 'warning'
                          : 'neutral'
                    }
                  />
                </View>

                {completionOtpCode && (
                  <View
                    style={
                      isCompletionOtpVerified
                        ? styles.otpCodeBoxVerified
                        : status === 'IN_PROGRESS'
                          ? styles.otpCodeBoxWarning
                          : styles.otpCodeBoxNeutral
                    }
                  >
                    <AppText
                      variant="headingLg"
                      style={
                        isCompletionOtpVerified
                          ? styles.otpCodeTextVerified
                          : status === 'IN_PROGRESS'
                            ? styles.otpCodeTextWarning
                            : styles.otpCodeTextNeutral
                      }
                    >
                      {completionOtpCode.split('').join('  ')}
                    </AppText>
                    {isCompletionOtpVerified && (
                      <View style={styles.otpVerifiedIndicator}>
                        <AppIcon name="checkmark-circle" size="sm" color={colors.status.success} />
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Security Advisory Bar */}
              <View style={styles.dualOtpSecurityBar}>
                <AppIcon name="lock-closed-outline" size="xs" color={colors.text.muted} />
                <AppText variant="caption" color="textMuted" style={styles.securityBarText}>
                  For your security, never share OTPs over phone calls or prior to testing.
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

          {shopkeeper?.shopName && ((ticketData as any)?.shopkeeperId || !(ticketData as any)?.mechanicId) ? (
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

            {(isResolved || status === 'CLOSED') && (
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

      {/* Dynamic Reschedule Modal */}
      <Modal visible={showRescheduleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <AppText variant="headingMd" color="textPrimary">
                  Reschedule Appointment
                </AppText>
                <AppText variant="caption" color="textSecondary">
                  Select preferred date and 1-hour time slot
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setShowRescheduleModal(false)}>
                <AppIcon name="close" size="sm" color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Step 1: Select Date */}
            <AppText variant="labelSm" color="textSecondary" style={styles.rescheduleSectionTitle}>
              1. SELECT PREFERRED DATE
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScrollWrap}>
              {upcomingRescheduleDates.map((item) => {
                const isSelected = item.offset === rescheduleDateOffset;
                return (
                  <TouchableOpacity
                    key={item.offset}
                    activeOpacity={0.8}
                    style={[
                      styles.dateChip,
                      isSelected && { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
                    ]}
                    onPress={() => setRescheduleDateOffset(item.offset)}
                  >
                    <AppText
                      variant="caption"
                      style={[styles.dateChipSub, isSelected && { color: '#FFFFFF' }]}
                    >
                      {item.dayName}
                    </AppText>
                    <AppText
                      variant="labelMd"
                      style={[styles.dateChipMain, isSelected && { color: '#FFFFFF' }]}
                    >
                      {item.monthDay}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Step 2: Select 1-Hour Time Window */}
            <AppText variant="labelSm" color="textSecondary" style={styles.rescheduleSectionTitle}>
              2. SELECT TIME SLOT
            </AppText>
            {fetchingDynamicSlots ? (
              <ActivityIndicator size="small" color={colors.primary.main} style={{ marginVertical: 16 }} />
            ) : (
              <View style={styles.slotsGridWrap}>
                {dynamicSlotsList.map((item, sIdx) => {
                  const label = typeof item === 'string' ? item : item.label;
                  const isAvailable = typeof item === 'string' ? true : item.isAvailable;
                  const reason = typeof item === 'object' ? item.reason : undefined;
                  const isSelected = label === rescheduleSlot && isAvailable;

                  return (
                    <TouchableOpacity
                      key={sIdx}
                      activeOpacity={isAvailable ? 0.8 : 1}
                      disabled={!isAvailable}
                      style={[
                        styles.slotChipGrid,
                        isSelected && { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
                        !isAvailable && {
                          backgroundColor: colors.neutral[100],
                          borderColor: colors.neutral[200],
                          opacity: 0.5,
                        },
                      ]}
                      onPress={() => isAvailable && setRescheduleSlot(label)}
                    >
                      <AppIcon
                        name={!isAvailable ? 'lock-closed-outline' : 'time-outline'}
                        size="xs"
                        color={isSelected ? '#FFFFFF' : !isAvailable ? colors.text.muted : colors.primary.main}
                      />
                      <AppText
                        variant="caption"
                        style={[
                          styles.slotChipTextGrid,
                          isSelected && { color: '#FFFFFF' },
                          !isAvailable && { color: colors.text.muted, textDecorationLine: 'line-through' },
                        ]}
                      >
                        {label}
                      </AppText>
                      {!isAvailable && (
                        <AppText variant="caption" style={{ fontSize: 9, fontWeight: '700', color: colors.status.danger }}>
                          ({reason || 'Booked'})
                        </AppText>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Selected Summary Card */}
            <View style={styles.rescheduleSummaryBox}>
              <AppIcon name="calendar-outline" size="sm" color={colors.primary.main} />
              <View style={{ flex: 1 }}>
                <AppText variant="caption" color="textSecondary">
                  NEW APPOINTMENT SUMMARY
                </AppText>
                <AppText variant="labelMd" color="textPrimary" style={styles.boldText}>
                  {selectedRescheduleDateObj?.dayName} ({selectedRescheduleDateObj?.monthDay}) • {rescheduleSlot}
                </AppText>
              </View>
            </View>

            {/* Confirm Button */}
            <Button
              title={rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
              variant="primary"
              loading={rescheduling}
              disabled={rescheduling}
              onPress={handleRescheduleConfirmDynamic}
              style={{ width: '100%', marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};
