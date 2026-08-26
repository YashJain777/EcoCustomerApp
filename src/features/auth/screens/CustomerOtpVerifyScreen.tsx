import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Button } from '@shared/components/atoms/Button';
import { AppIcon } from '@shared/components/atoms/Icon';
import { Card } from '@shared/components/atoms/Card';
import { authApi } from '@infrastructure/api/authApi';
import { spacing, radius, shadows, useTheme } from '@theme/index';

export const CustomerOtpVerifyScreen = ({ route, navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const mobile = route.params?.mobile || '98765 43210';
  const devHint = route.params?.devHint || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (error) setError('');

    // Auto-advance focus to next input box
    if (text.length > 0 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleAutoFillDev = (hintCode: string) => {
    if (hintCode && hintCode.length === 6) {
      const codeArray = hintCode.split('');
      setOtp(codeArray);
      if (error) setError('');
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setError('Please enter complete 6-digit OTP code');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await authApi.loginVerifyOtp({ mobile, code: fullOtp });
      try {
        await authApi.selectRole('CUSTOMER');
      } catch (roleErr) {
        // Ignore role selection error if single role
      }
      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTab' }],
      });
    } catch (err: any) {
      setLoading(false);
      const errorMsg =
        err?.message ||
        (typeof err?.error === 'string' ? err.error : err?.error?.message) ||
        'Invalid or expired OTP code';
      setError(errorMsg);
    }
  };

  return (
    <ScreenWrapper
      style={styles.container}
      scrollable
      keyboardAvoiding
      contentContainerStyle={styles.scrollContent}
    >
      {/* Navigation Back Header */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <AppIcon name="arrow-back" size="md" color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          We have sent a 6-digit code to{' '}
          <Text style={styles.mobileHighlight}>+91 {mobile}</Text>
        </Text>

        {devHint ? (
          <TouchableOpacity
            style={styles.devHintBadge}
            onPress={() => handleAutoFillDev(devHint)}
            activeOpacity={0.7}
          >
            <AppIcon name="key-outline" size="xs" color={colors.primary.main} style={styles.keyIcon} />
            <Text style={styles.devHintText}>Auto-fill Dev OTP: {devHint}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 6 OTP Interactive Input Boxes */}
      <View style={styles.otpBoxRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            style={[
              styles.digitBox,
              digit ? styles.digitBoxActive : null,
              error ? styles.digitBoxError : null,
            ]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            selectTextOnFocus
          />
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.resendContainer} activeOpacity={0.7}>
        <Text style={styles.resendText}>Resend OTP</Text>
      </TouchableOpacity>

      {/* Security Callout Banner */}
      <Card style={styles.securityCard} padding="md" variant="flat">
        <AppIcon name="shield-checkmark-outline" size="lg" color={colors.primary.main} style={styles.securityIcon} />
        <View style={styles.securityTextGroup}>
          <Text style={styles.securityTitle}>Your number is safe with us.</Text>
          <Text style={styles.securityDesc}>We don't share your details with anyone.</Text>
        </View>
      </Card>

      <Button
        title="Verify & Continue"
        variant="cta"
        size="large"
        onPress={handleVerify}
        loading={loading}
        style={styles.verifyBtn}
      />
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  topNavRow: {
    marginBottom: spacing.md,
  },
  backButton: {
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
  titleContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  mobileHighlight: {
    fontWeight: '700',
    color: colors.primary.main,
  },
  devHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary.main + '40',
  },
  devHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.main,
  },
  otpBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  digitBox: {
    flex: 1,
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border.main,
    backgroundColor: colors.background.paper,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  digitBoxActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  digitBoxError: {
    borderColor: colors.status.danger,
  },
  errorText: {
    fontSize: 12,
    color: colors.status.danger,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  resendContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  resendText: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '700',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.light,
    borderRadius: radius.md,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary.main + '20',
  },
  securityIcon: {
    marginRight: spacing.sm,
  },
  securityTextGroup: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary.dark,
  },
  securityDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  verifyBtn: {
    marginTop: spacing.md,
  },
  keyIcon: {
    marginRight: 4,
  },
});
