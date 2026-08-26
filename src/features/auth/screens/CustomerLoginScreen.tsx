/**
 * @file CustomerLoginScreen.tsx
 * @feature Auth / Screens
 * @responsibility Presentational customer login screen — OTP-based mobile authentication.
 * Design reference: Zomato / Swiggy login pattern — hero top panel + form bottom sheet.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';
import { AppText } from '@shared/components/atoms/AppText';
import { Input } from '@shared/components/atoms/Input';
import { Button } from '@shared/components/atoms/Button';
import { authApi } from '@infrastructure/api/authApi';
import { spacing, radius, shadows, useTheme, type AppTheme } from '@theme/index';
import { getCommonStyles } from '@theme/commonStyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.42;

export const CustomerLoginScreen: React.FC<any> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, insets, isDark), [theme, insets, isDark]);
  const common = useMemo(() => getCommonStyles(colors), [colors]);

  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Animations ──
  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(60);
  const sheetOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Logo pop-in
    logoScale.value = withSpring(1, { damping: 14, stiffness: 90 });
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });

    // Bottom sheet slide up
    sheetOpacity.value = withDelay(180, withTiming(1, { duration: 420 }));
    sheetTranslateY.value = withDelay(180, withSpring(0, { damping: 18, stiffness: 85 }));

    // Pulse ring on logo
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.22, { duration: 1600, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) })
      ), -1, false
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.12, { duration: 1600 }),
        withTiming(0.45, { duration: 1600 })
      ), -1, false
    );
  }, [logoScale, logoOpacity, sheetTranslateY, sheetOpacity, ringScale, ringOpacity]);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const sheetAnimStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
    transform: [{ translateY: sheetTranslateY.value }],
  }));
  const ringAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const handleSendOtp = async () => {
    const cleanedMobile = mobile.trim();
    if (!cleanedMobile || cleanedMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.sendOtp({ mobile: cleanedMobile });
      const devHint = (res as any)?.data?.devHint || (res as any)?.devHint || '';
      setLoading(false);
      navigation.navigate('CustomerOtpVerifyScreen', { mobile: cleanedMobile, devHint });
    } catch (err: any) {
      setLoading(false);
      const errorMsg =
        err?.message ||
        (typeof err?.error === 'string' ? err.error : err?.error?.message) ||
        'Failed to send OTP. Please try again.';
      setError(errorMsg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={common.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Hero Panel (top ~42%) ── */}
      <View style={styles.heroBg}>
        {/* Decorative blobs inside hero */}
        <View style={styles.heroBlob1} />
        <View style={styles.heroBlob2} />

        {/* Back button — top left, only when navigable */}
        {navigation.canGoBack() && (
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 8 }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
            accessibilityLabel="Go Back"
          >
            <Icon name="arrow-left" size={18} color={colors.common.white} />
          </TouchableOpacity>
        )}

        {/* Centered logo + pulse ring */}
        <Animated.View style={[styles.logoWrapper, logoAnimStyle]}>
          <Animated.View style={[styles.logoRing, ringAnimStyle]} />
          <View style={styles.logoBg}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="App Logo"
            />
          </View>
        </Animated.View>
      </View>

      {/* ── Bottom Sheet ── */}
      <Animated.View style={[styles.sheet, sheetAnimStyle]}>
        <ScrollView
          contentContainerStyle={styles.sheetScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Heading */}
          <AppText variant="headingXl" style={styles.heading}>
            Welcome Back 👋
          </AppText>
          <AppText variant="bodyMd" color="textMuted" style={styles.subheading}>
            Enter your mobile number to get started
          </AppText>

          {/* Inline Error Banner */}
          {!!error && (
            <View style={[common.errorBanner, styles.errorGap]}>
              <Icon name="alert-circle" size={14} color={colors.status.danger} />
              <AppText variant="bodySm" style={common.errorText}>{error}</AppText>
              <TouchableOpacity activeOpacity={0.75} onPress={() => setError('')} accessibilityLabel="Dismiss error">
                <Icon name="x" size={14} color={colors.status.danger} />
              </TouchableOpacity>
            </View>
          )}

          {/* Mobile Input */}
          <View style={styles.inputSection}>
            <AppText variant="labelMd" color="textSecondary" style={styles.inputLabel}>
              Mobile Number
            </AppText>
            <Input
              placeholder="98765 43210"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              prefix="+91"
              leftIcon={<Icon name="phone" size={15} color={colors.primary.main} />}
              containerStyle={styles.inputContainer}
              onChangeText={(text) => {
                setMobile(text.replace(/[^0-9]/g, ''));
                if (error) setError('');
              }}
            />
          </View>

          {/* CTA Button */}
          <Button
            title="Get OTP"
            variant="cta"
            size="large"
            onPress={handleSendOtp}
            loading={loading}
            disabled={mobile.length < 10 || loading}
            style={styles.submitButton}
          />

          {/* Privacy Notice */}
          <View style={styles.encryptRow}>
            <Icon name="shield" size={12} color={colors.status.success} />
            <AppText variant="caption" color="textMuted" style={styles.encryptText}>
              Your number is safe & encrypted
            </AppText>
          </View>

          {/* Terms Footer */}
          <View style={styles.termsFooter}>
            <AppText variant="caption" color="textMuted" style={styles.termsNotice}>
              By continuing, you agree to our{' '}
            </AppText>
            <View style={styles.termsLinksRow}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('TermsConditionsScreen' as any)}>
                <AppText variant="caption" color="primary" style={styles.linkText}>Terms of Service</AppText>
              </TouchableOpacity>
              <AppText variant="caption" color="textMuted">{' & '}</AppText>
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('TermsConditionsScreen' as any)}>
                <AppText variant="caption" color="primary" style={styles.linkText}>Privacy Policy</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (theme: AppTheme, insets: EdgeInsets, isDark: boolean = false) => {
  const colors = theme.colors;
  const P = colors.primary.main;

  return StyleSheet.create({
    // ── Hero ──
    heroBg: {
      height: HERO_HEIGHT,
      backgroundColor: isDark ? colors.neutral[100] : P,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    heroBlob1: {
      position: 'absolute',
      top: -60,
      left: -60,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    heroBlob2: {
      position: 'absolute',
      bottom: -40,
      right: -50,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    backButton: {
      position: 'absolute',
      left: spacing.lg,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Logo
    logoWrapper: {
      width: 120,
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoRing: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.35)',
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    logoBg: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.background.paper,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    logoImage: {
      width: 72,
      height: 72,
    },

    // ── Bottom Sheet ──
    sheet: {
      flex: 1,
      backgroundColor: isDark ? colors.background.default : colors.background.paper,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      marginTop: -24, // overlaps the hero by 24px — bottom-sheet effect
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.xl,
      ...shadows.large,
    },
    sheetScroll: {
      flexGrow: 1,
      paddingBottom: insets.bottom + spacing.lg,
    },

    // Text
    heading: {
      fontWeight: '800',
      color: colors.text.primary,
      marginBottom: 6,
    },
    subheading: {
      marginBottom: spacing.xl,
    },

    // Error
    errorGap: { marginBottom: spacing.md },

    // Input
    inputSection: { marginBottom: 0 },
    inputLabel: { marginBottom: spacing.xs },
    inputContainer: { marginBottom: 0 },

    // CTA
    submitButton: {
      marginTop: spacing.lg,
      borderRadius: radius.lg,
      height: 56,
    },

    // Encrypt row
    encryptRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: spacing.md,
    },
    encryptText: {},

    // Terms
    termsFooter: {
      alignItems: 'center',
      marginTop: spacing.xl,
      paddingBottom: spacing.sm,
    },
    termsNotice: { textAlign: 'center' },
    termsLinksRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    linkText: { fontWeight: '700' },
  });
};
