import { StyleSheet } from 'react-native';
import { spacing, radius, shadows } from './spacing';

export const getCommonStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    flex: {
      flex: 1,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowCenter: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    fieldMargin: {
      marginTop: spacing.md,
    },
    submitButton: {
      marginTop: spacing.xl,
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
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 13,
      color: colors.text.muted,
      marginTop: spacing.sm,
    },
    floatingCtaBtn: {
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
    floatingCtaText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.cta.main,
    },
    fixedBottomBar: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.background.paper,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      elevation: 4,
      shadowColor: colors.neutral[900],
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
  });
