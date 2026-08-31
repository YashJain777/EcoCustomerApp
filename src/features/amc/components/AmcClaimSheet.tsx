/**
 * @file AmcClaimSheet.tsx
 * @feature AMC / Components
 * @responsibility Bottom sheet modal allowing customers to claim / book a free maintenance visit
 *                 under an active Annual Maintenance Contract (AMC).
 *                 Adheres strictly to DESIGN_SYSTEM.md standards.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AppText } from '@shared/components/atoms/AppText';
import { AppIcon } from '@shared/components/atoms/Icon';
import { Button } from '@shared/components/atoms/Button';
import { Badge } from '@shared/components/atoms/Badge';
import { Card } from '@shared/components/atoms/Card';
import { Input } from '@shared/components/atoms/Input';
import { Select, SelectOption } from '@shared/components/molecules/Select';
import { spacing, radius, shadows, useTheme } from '@theme/index';
import { MyAmcPlan, ClaimAmcRequest } from '@core/types/amc.types';
import { amcApi } from '@infrastructure/api/amcApi';
import { customerApi, CustomerAddress } from '@infrastructure/api/customerApi';

interface AmcClaimSheetProps {
  visible: boolean;
  subscription: MyAmcPlan | null;
  onClose: () => void;
  onSuccess: (complaint: any) => void;
}

const TIME_SLOTS = [
  { id: '09:00 AM - 12:00 PM', label: 'Morning', time: '09:00 AM - 12:00 PM', icon: 'sunny-outline' },
  { id: '12:00 PM - 04:00 PM', label: 'Afternoon', time: '12:00 PM - 04:00 PM', icon: 'partly-sunny-outline' },
  { id: '04:00 PM - 07:00 PM', label: 'Evening', time: '04:00 PM - 07:00 PM', icon: 'moon-outline' },
];

export const AmcClaimSheet: React.FC<AmcClaimSheetProps> = ({
  visible,
  subscription,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Form State
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [description, setDescription] = useState<string>('Routine preventive maintenance and checkup');
  const [selectedSlot, setSelectedSlot] = useState<string>('09:00 AM - 12:00 PM');
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(1); // 0: Today, 1: Tomorrow, 2: Day After
  const [contactName, setContactName] = useState<string>('');
  const [alternatePhone, setAlternatePhone] = useState<string>('');

  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load customer addresses
  useEffect(() => {
    if (visible) {
      setLoadingAddresses(true);
      setErrorMsg(null);
      customerApi.getAddresses()
        .then((res) => {
          if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
            setAddresses(res.data);
            const defaultAddr = res.data.find((a) => a.isDefault) || res.data[0];
            if (defaultAddr?.id) {
              setSelectedAddressId(defaultAddr.id);
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoadingAddresses(false));
    }
  }, [visible]);

  // Address Options for Select Molecule
  const addressOptions: SelectOption[] = useMemo(() => {
    return addresses.map((a) => {
      const parts = [
        a.houseNo,
        a.street,
        a.landmark ? `Near ${a.landmark}` : null,
        a.cityName,
        a.pinCode ? `PIN: ${a.pinCode}` : null,
      ].filter(Boolean);

      const fullAddress = parts.join(', ') || a.address || 'Address Details';
      const label = `${a.addressType || 'HOME'} Address${a.isDefault ? ' • Default' : ''}`;

      let icon = 'home-outline';
      if (a.addressType === 'OFFICE' || a.addressType === 'WORK') icon = 'business-outline';
      else if (a.addressType === 'OTHER') icon = 'location-outline';

      return {
        label,
        value: a.id || '',
        sublabel: fullAddress,
        icon,
      };
    });
  }, [addresses]);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId),
    [addresses, selectedAddressId]
  );

  // Computed Dates (Today, Tomorrow, Day After)
  const dateChips = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    const formatChip = (d: Date, label: string, offset: number) => {
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const dateNum = d.getDate();
      const monthStr = d.toLocaleDateString('en-IN', { month: 'short' });
      return {
        offset,
        label,
        formatted: `${dayName}, ${dateNum} ${monthStr}`,
        isoDate: d.toISOString(),
      };
    };

    return [
      formatChip(today, 'Today', 0),
      formatChip(tomorrow, 'Tomorrow', 1),
      formatChip(dayAfter, 'In 2 Days', 2),
    ];
  }, []);

  const chosenDate = useMemo(() => {
    const chip = dateChips.find((c) => c.offset === selectedDayOffset);
    return chip ? chip.isoDate : new Date().toISOString();
  }, [dateChips, selectedDayOffset]);

  if (!subscription) return null;

  const plan = subscription.amcPlan;
  const visits = subscription.visits || [];
  const completedVisits = visits.filter((v) => v.status === 'COMPLETED').length;
  const totalVisits = plan?.visitsIncluded || 2;
  const remainingVisits = Math.max(0, totalVisits - completedVisits);

  const handleSubmitClaim = async () => {
    if (!description.trim() || description.trim().length < 5) {
      setErrorMsg('Please describe what service or checkup is needed (min 5 chars)');
      return;
    }

    const fullServiceAddress = selectedAddress
      ? [
          selectedAddress.houseNo,
          selectedAddress.street,
          selectedAddress.landmark ? `Near ${selectedAddress.landmark}` : null,
          selectedAddress.cityName,
          selectedAddress.pinCode ? `PIN: ${selectedAddress.pinCode}` : null,
        ].filter(Boolean).join(', ') || selectedAddress.address
      : undefined;

    setSubmitting(true);
    setErrorMsg(null);

    const payload: ClaimAmcRequest = {
      amcPurchaseId: subscription.id,
      description: description.trim(),
      preferredVisitDate: chosenDate,
      preferredTimeSlot: selectedSlot,
      serviceAddress: fullServiceAddress,
      contactPersonName: contactName.trim() || undefined,
      alternateMobile: alternatePhone.trim() || undefined,
    };

    try {
      const res = await amcApi.claimAmc(payload);
      if (res?.success || res?.data) {
        Alert.alert(
          'AMC Visit Scheduled! 🛡️',
          'Your free preventive maintenance visit has been booked successfully. A certified specialist has been assigned.',
          [
            {
              text: 'View Details',
              onPress: () => {
                onClose();
                onSuccess(res?.data || res);
              },
            },
          ]
        );
      } else {
        setErrorMsg('Unable to book AMC visit. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(
        err?.error?.message ||
        err?.message ||
        'Could not claim AMC visit. Please verify your subscription.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />

              {/* Sheet Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.shieldIconWrap}>
                    <AppIcon name="shield-checkmark" size="sm" color={colors.primary.main} />
                  </View>
                  <View style={styles.headerTitles}>
                    <AppText variant="headingSm" color="textPrimary">
                      Book AMC Free Visit
                    </AppText>
                    <AppText variant="caption" color="textSecondary">
                      {plan?.name || 'Annual Maintenance Contract'}
                    </AppText>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <AppIcon name="close" size="sm" color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Free Visit Entitlement Banner */}
                <Card style={styles.entitlementBanner} padding="md" variant="flat">
                  <View style={styles.entitlementRow}>
                    <View style={styles.entitlementLeft}>
                      <AppIcon name="sparkles" size="sm" color={colors.status.success} />
                      <View>
                        <AppText variant="labelMd" color="textPrimary">
                          100% Free Preventive Visit
                        </AppText>
                        <AppText variant="caption" color="textMuted">
                          {remainingVisits} of {totalVisits} maintenance visits remaining
                        </AppText>
                      </View>
                    </View>
                    <Badge label="₹0 FREE" variant="success" />
                  </View>
                </Card>

                {errorMsg ? (
                  <View style={styles.errorContainer}>
                    <AppIcon name="alert-circle" size="xs" color={colors.status.danger} />
                    <AppText variant="caption" color="textSecondary" style={styles.errorText}>
                      {errorMsg}
                    </AppText>
                  </View>
                ) : null}

                {/* Section 1: Delivery Address */}
                <View style={styles.sectionBlock}>
                  <AppText variant="labelMd" color="textPrimary" style={styles.sectionTitle}>
                    Service Location
                  </AppText>
                  {loadingAddresses ? (
                    <ActivityIndicator size="small" color={colors.primary.main} style={{ marginVertical: spacing.sm }} />
                  ) : addressOptions.length > 0 ? (
                    <Select
                      label="Service Delivery Address"
                      value={selectedAddressId}
                      options={addressOptions}
                      onSelect={(opt) => setSelectedAddressId(opt.value)}
                      placeholder="Select Service Address"
                      searchable
                      searchPlaceholder="Search saved locations..."
                    />
                  ) : (
                    <Card style={styles.noAddressCard} padding="sm" variant="flat">
                      <AppText variant="caption" color="textMuted">
                        No saved address found. The default service center address will be assigned.
                      </AppText>
                    </Card>
                  )}
                </View>

                {/* Section 2: Preferred Visit Date */}
                <View style={styles.sectionBlock}>
                  <AppText variant="labelMd" color="textPrimary" style={styles.sectionTitle}>
                    Preferred Visit Date
                  </AppText>
                  <View style={styles.chipRow}>
                    {dateChips.map((chip) => {
                      const isSelected = selectedDayOffset === chip.offset;
                      return (
                        <TouchableOpacity
                          key={chip.offset}
                          style={[
                            styles.dateChip,
                            isSelected && styles.dateChipSelected,
                          ]}
                          onPress={() => setSelectedDayOffset(chip.offset)}
                          activeOpacity={0.8}
                        >
                          <AppText
                            variant="labelSm"
                            style={isSelected ? styles.dateChipTextSelected : styles.dateChipText}
                          >
                            {chip.label}
                          </AppText>
                          <AppText
                            variant="caption"
                            style={isSelected ? styles.dateChipSubTextSelected : styles.dateChipSubText}
                          >
                            {chip.formatted}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Section 3: Preferred Time Slot */}
                <View style={styles.sectionBlock}>
                  <AppText variant="labelMd" color="textPrimary" style={styles.sectionTitle}>
                    Preferred Time Slot
                  </AppText>
                  <View style={styles.slotGrid}>
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = selectedSlot === slot.id;
                      return (
                        <TouchableOpacity
                          key={slot.id}
                          style={[
                            styles.slotCard,
                            isSelected && styles.slotCardSelected,
                          ]}
                          onPress={() => setSelectedSlot(slot.id)}
                          activeOpacity={0.8}
                        >
                          <AppIcon
                            name={slot.icon as any}
                            size="xs"
                            color={isSelected ? colors.primary.main : colors.text.secondary}
                          />
                          <View style={styles.slotTextWrap}>
                            <AppText
                              variant="labelSm"
                              style={isSelected ? styles.slotLabelSelected : styles.slotLabel}
                            >
                              {slot.label}
                            </AppText>
                            <AppText variant="caption" color="textMuted">
                              {slot.time}
                            </AppText>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Section 4: Issue Description / Notes */}
                <View style={styles.sectionBlock}>
                  <AppText variant="labelMd" color="textPrimary" style={styles.sectionTitle}>
                    Service Notes / Issue Description *
                  </AppText>
                  <Input
                    placeholder="e.g. Periodic checkup, filter cleaning, cooling inspection..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Section 5: Optional Contact Person */}
                <View style={styles.sectionBlock}>
                  <AppText variant="labelMd" color="textPrimary" style={styles.sectionTitle}>
                    On-Site Contact (Optional)
                  </AppText>
                  <View style={styles.contactFieldsRow}>
                    <View style={styles.flex1}>
                      <Input
                        placeholder="Contact Person Name"
                        value={contactName}
                        onChangeText={setContactName}
                      />
                    </View>
                    <View style={styles.flex1}>
                      <Input
                        placeholder="Alternate Mobile"
                        value={alternatePhone}
                        onChangeText={setAlternatePhone}
                        keyboardType="phone-pad"
                        maxLength={10}
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Bottom Confirmation Footer */}
              <View style={styles.footer}>
                <View style={styles.footerPricing}>
                  <AppText variant="caption" color="textMuted">
                    Covered under AMC
                  </AppText>
                  <AppText variant="headingSm" color="primary">
                    ₹0.00
                  </AppText>
                </View>

                <View style={styles.footerAction}>
                  <Button
                    title="Confirm Visit Booking"
                    onPress={handleSubmitClaim}
                    loading={submitting}
                    disabled={submitting}
                    variant="primary"
                    size="large"
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      backgroundColor: colors.background.paper,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '90%',
      minHeight: '65%',
      ...shadows.large,
    },
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.border.light,
      alignSelf: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    shieldIconWrap: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitles: {
      flex: 1,
    },
    closeBtn: {
      padding: spacing.xs,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    entitlementBanner: {
      backgroundColor: colors.category.warrantyBg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.status.successBg,
    },
    entitlementRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    entitlementLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.status.dangerBg,
      padding: spacing.sm,
      borderRadius: radius.sm,
      gap: spacing.xs,
    },
    errorText: {
      color: colors.status.danger,
      flex: 1,
    },
    sectionBlock: {
      gap: spacing.xs,
    },
    sectionTitle: {
      marginBottom: 2,
    },
    noAddressCard: {
      backgroundColor: colors.background.default,
      borderRadius: radius.sm,
    },
    chipRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    dateChip: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.md,
      backgroundColor: colors.background.default,
      borderWidth: 1.5,
      borderColor: colors.border.light,
      alignItems: 'center',
    },
    dateChipSelected: {
      backgroundColor: colors.primary.light,
      borderColor: colors.primary.main,
    },
    dateChipText: {
      color: colors.text.secondary,
      fontWeight: '600',
    },
    dateChipTextSelected: {
      color: colors.primary.main,
      fontWeight: '700',
    },
    dateChipSubText: {
      color: colors.text.muted,
      marginTop: 2,
    },
    dateChipSubTextSelected: {
      color: colors.primary.main,
      marginTop: 2,
      fontWeight: '600',
    },
    slotGrid: {
      gap: spacing.xs,
    },
    slotCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.background.default,
      borderWidth: 1.5,
      borderColor: colors.border.light,
      gap: spacing.sm,
    },
    slotCardSelected: {
      backgroundColor: colors.primary.light,
      borderColor: colors.primary.main,
    },
    slotTextWrap: {
      flex: 1,
    },
    slotLabel: {
      color: colors.text.primary,
    },
    slotLabelSelected: {
      color: colors.primary.main,
      fontWeight: '700',
    },
    contactFieldsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    flex1: {
      flex: 1,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      backgroundColor: colors.background.paper,
      gap: spacing.md,
    },
    footerPricing: {
      alignItems: 'flex-start',
    },
    footerAction: {
      flex: 1,
    },
  });
