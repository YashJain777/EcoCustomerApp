/**
 * @file AmcCheckoutSheet.tsx
 * @layer Features / AMC / Components
 * @responsibility Modal bottom sheet for confirming and purchasing an AMC protection plan.
 *                 Supports payment mode selection (UPI, Card, Cash) and handles purchase + payment verification.
 *                 Adheres strictly to DESIGN_SYSTEM.md.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Card } from '@shared/components/atoms/Card';
import { Badge } from '@shared/components/atoms/Badge';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { Button } from '@shared/components/atoms/Button';
import { spacing, radius, shadows, useTheme } from '@theme/index';
import { LocalAmcPlan, MyAmcPlan } from '@core/types/amc.types';
import { amcApi } from '@infrastructure/api/amcApi';

interface AmcCheckoutSheetProps {
  visible: boolean;
  plan: LocalAmcPlan | null;
  onClose: () => void;
  onPurchaseSuccess: (purchasedPlan: MyAmcPlan) => void;
}

type PaymentMethod = 'UPI' | 'CARD' | 'CASH';

export const AmcCheckoutSheet: React.FC<AmcCheckoutSheetProps> = ({
  visible,
  plan,
  onClose,
  onPurchaseSuccess,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('UPI');
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<MyAmcPlan | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!plan) return null;

  const handleConfirmPurchase = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      // 1. Call purchase AMC endpoint
      const res = await amcApi.purchasePlan({
        amcPlanId: plan.id,
        paymentMode: paymentMode,
      });

      if (res?.success || res?.data) {
        const purchase = res.data || res;

        // 2. If online payment (UPI / CARD), simulate payment verification
        if (paymentMode !== 'CASH' && purchase.id) {
          const verifyRes = await amcApi.verifyPayment({
            purchaseId: purchase.id,
            transactionId: `TXN-${Date.now()}`,
          });
          setSuccessResult(verifyRes.data || purchase);
        } else {
          setSuccessResult(purchase);
        }
      } else {
        setErrorMessage(
          res?.error?.message || 'Could not complete AMC subscription'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err?.error?.message || err?.message || 'Failed to process AMC purchase'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (successResult) {
      onPurchaseSuccess(successResult);
    }
    setSuccessResult(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.modalCard} padding="lg">
          {/* Header Row */}
          <View style={styles.headerRow}>
            <AppText variant="headingMd" color="textPrimary">
              {successResult ? 'Subscription Confirmed! 🎉' : 'Checkout & Protect'}
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon name="close-circle-outline" size="md" color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {successResult ? (
            /* Success Confirmation State */
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <AppIcon
                  name="shield-checkmark"
                  size="xl"
                  color={colors.status.success}
                />
              </View>
              <AppText
                variant="headingLg"
                color="textPrimary"
                style={styles.successTitle}
              >
                Protection Active! 🛡️
              </AppText>
              <AppText
                variant="bodyMd"
                color="textSecondary"
                style={styles.successSubtitle}
              >
                You are now covered under {plan.name} for {plan.durationMonths || 12} months. Your preventive visits have been registered.
              </AppText>

              <View style={styles.successSummaryBox}>
                <View style={styles.summaryRow}>
                  <AppText variant="caption" color="textMuted">
                    Appliance Category
                  </AppText>
                  <AppText variant="labelSm" color="textPrimary">
                    {plan.category?.name || 'All Appliances'}
                  </AppText>
                </View>
                <View style={styles.summaryRow}>
                  <AppText variant="caption" color="textMuted">
                    Maintenance Visits
                  </AppText>
                  <AppText variant="labelSm" color="textPrimary">
                    {plan.visitsIncluded || 2} Free Visits Included
                  </AppText>
                </View>
                <View style={styles.summaryRow}>
                  <AppText variant="caption" color="textMuted">
                    Amount Paid
                  </AppText>
                  <AppText variant="labelMd" color="primary">
                    ₹{plan.price.toLocaleString('en-IN')}
                  </AppText>
                </View>
              </View>

              <Button
                title="View My Active Protection Plans"
                variant="primary"
                size="large"
                onPress={handleFinish}
                style={styles.actionBtn}
              />
            </View>
          ) : (
            /* Checkout & Payment Mode Selector */
            <View style={styles.formContainer}>
              {/* Selected Plan Summary Card */}
              <View style={styles.planSummaryBox}>
                <View style={styles.planSummaryTop}>
                  <View style={styles.flex1}>
                    <AppText variant="headingSm" color="textPrimary" numberOfLines={1}>
                      {plan.name}
                    </AppText>
                    <AppText variant="caption" color="textSecondary">
                      {plan.category?.name || 'Home Appliances'} • {plan.durationMonths || 12} Months Coverage
                    </AppText>
                  </View>
                  <Badge
                    label={`${plan.visitsIncluded || 2} Visits`}
                    variant="success"
                  />
                </View>
                <View style={styles.planPriceRow}>
                  <AppText variant="caption" color="textMuted">
                    Total Protection Fee:
                  </AppText>
                  <AppText variant="headingLg" color="primary">
                    ₹{plan.price.toLocaleString('en-IN')}
                  </AppText>
                </View>
              </View>

              {/* Payment Mode Selector */}
              <AppText variant="labelMd" color="textPrimary" style={styles.sectionLabel}>
                Select Payment Mode
              </AppText>

              <View style={styles.paymentOptions}>
                {/* 1. UPI */}
                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    paymentMode === 'UPI' && styles.paymentCardSelected,
                  ]}
                  onPress={() => setPaymentMode('UPI')}
                  activeOpacity={0.8}
                >
                  <View style={styles.paymentLeft}>
                    <View
                      style={[
                        styles.paymentIconCircle,
                        paymentMode === 'UPI' && styles.paymentIconCircleActive,
                      ]}
                    >
                      <AppIcon
                        name="flash-outline"
                        size="sm"
                        color={paymentMode === 'UPI' ? colors.primary.main : colors.text.secondary}
                      />
                    </View>
                    <View style={styles.paymentTextCol}>
                      <AppText variant="labelMd" color="textPrimary">
                        UPI / QR Instant Payment
                      </AppText>
                      <AppText variant="caption" color="textMuted">
                        GPay, PhonePe, Paytm, Any UPI
                      </AppText>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      paymentMode === 'UPI' && styles.radioCircleActive,
                    ]}
                  >
                    {paymentMode === 'UPI' ? (
                      <View style={styles.radioDot} />
                    ) : null}
                  </View>
                </TouchableOpacity>

                {/* 2. CARD */}
                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    paymentMode === 'CARD' && styles.paymentCardSelected,
                  ]}
                  onPress={() => setPaymentMode('CARD')}
                  activeOpacity={0.8}
                >
                  <View style={styles.paymentLeft}>
                    <View
                      style={[
                        styles.paymentIconCircle,
                        paymentMode === 'CARD' && styles.paymentIconCircleActive,
                      ]}
                    >
                      <AppIcon
                        name="card-outline"
                        size="sm"
                        color={paymentMode === 'CARD' ? colors.primary.main : colors.text.secondary}
                      />
                    </View>
                    <View style={styles.paymentTextCol}>
                      <AppText variant="labelMd" color="textPrimary">
                        Credit / Debit Card
                      </AppText>
                      <AppText variant="caption" color="textMuted">
                        Visa, Mastercard, RuPay
                      </AppText>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      paymentMode === 'CARD' && styles.radioCircleActive,
                    ]}
                  >
                    {paymentMode === 'CARD' ? (
                      <View style={styles.radioDot} />
                    ) : null}
                  </View>
                </TouchableOpacity>

                {/* 3. CASH */}
                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    paymentMode === 'CASH' && styles.paymentCardSelected,
                  ]}
                  onPress={() => setPaymentMode('CASH')}
                  activeOpacity={0.8}
                >
                  <View style={styles.paymentLeft}>
                    <View
                      style={[
                        styles.paymentIconCircle,
                        paymentMode === 'CASH' && styles.paymentIconCircleActive,
                      ]}
                    >
                      <AppIcon
                        name="cash-outline"
                        size="sm"
                        color={paymentMode === 'CASH' ? colors.primary.main : colors.text.secondary}
                      />
                    </View>
                    <View style={styles.paymentTextCol}>
                      <AppText variant="labelMd" color="textPrimary">
                        Pay on First Visit
                      </AppText>
                      <AppText variant="caption" color="textMuted">
                        Hand over cash during technician visit
                      </AppText>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      paymentMode === 'CASH' && styles.radioCircleActive,
                    ]}
                  >
                    {paymentMode === 'CASH' ? (
                      <View style={styles.radioDot} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              </View>

              {errorMessage ? (
                <View style={styles.errorBox}>
                  <AppIcon name="alert-circle-outline" size="xs" color={colors.status.danger} />
                  <AppText variant="caption" color="textSecondary" style={styles.errorText}>
                    {errorMessage}
                  </AppText>
                </View>
              ) : null}

              {/* Submit CTA Button */}
              <Button
                title={submitting ? 'Activating Protection...' : `Pay ₹${plan.price.toLocaleString('en-IN')} & Subscribe`}
                variant="primary"
                size="large"
                onPress={handleConfirmPurchase}
                disabled={submitting}
                loading={submitting}
                style={styles.actionBtn}
              />
            </View>
          )}
        </Card>
      </View>
    </Modal>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      backgroundColor: colors.background.paper,
      ...shadows.large,
      maxHeight: '85%',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
      paddingBottom: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    formContainer: {
      paddingBottom: spacing.sm,
    },
    planSummaryBox: {
      backgroundColor: colors.background.default,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    planSummaryTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xs,
    },
    flex1: {
      flex: 1,
      marginRight: spacing.xs,
    },
    planPriceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      paddingTop: spacing.xs + 2,
    },
    sectionLabel: {
      fontWeight: '700',
      marginBottom: spacing.xs + 2,
    },
    paymentOptions: {
      gap: spacing.xs + 2,
      marginBottom: spacing.md,
    },
    paymentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.sm + 2,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border.main,
      backgroundColor: colors.background.paper,
    },
    paymentCardSelected: {
      borderColor: colors.primary.main,
      backgroundColor: colors.primary.light,
    },
    paymentLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    paymentIconCircle: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: colors.background.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paymentIconCircleActive: {
      backgroundColor: colors.background.paper,
    },
    paymentTextCol: {
      flex: 1,
    },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: colors.border.main,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleActive: {
      borderColor: colors.primary.main,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: colors.primary.main,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.status.dangerBg,
      padding: spacing.sm,
      borderRadius: radius.sm,
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    errorText: {
      color: colors.status.danger,
      flex: 1,
    },
    actionBtn: {
      width: '100%',
      marginTop: spacing.xs,
    },
    successContainer: {
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    successIconCircle: {
      width: 72,
      height: 72,
      borderRadius: radius.pill,
      backgroundColor: colors.category.warrantyBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    successTitle: {
      fontWeight: '800',
      textAlign: 'center',
    },
    successSubtitle: {
      textAlign: 'center',
      marginTop: 4,
      marginBottom: spacing.md,
      lineHeight: 20,
    },
    successSummaryBox: {
      width: '100%',
      backgroundColor: colors.background.default,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      gap: spacing.xs,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });
