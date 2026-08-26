import { StyleSheet, Dimensions } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { spacing, radius, type AppTheme } from '@theme/index';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface FeatureChipData {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  family: 'Ionicons' | 'Feather' | 'MaterialCommunityIcons';
  accentColorKey: 'success' | 'warning' | 'info';
  position: 'left' | 'right' | 'bottom';
}

export const FEATURE_CHIPS: FeatureChipData[] = [
  {
    id: 'warranty',
    label: 'Digital Warranty',
    sublabel: 'Verified Claim Vault',
    icon: 'shield-checkmark',
    family: 'Ionicons',
    accentColorKey: 'success',
    position: 'left',
  },
  {
    id: 'visits',
    label: 'Instant Service',
    sublabel: 'On-Demand Technicians',
    icon: 'build',
    family: 'Ionicons',
    accentColorKey: 'warning',
    position: 'right',
  },
  {
    id: 'qr',
    label: 'QR Authenticator',
    sublabel: 'Genuine Product Check',
    icon: 'qr-code',
    family: 'Ionicons',
    accentColorKey: 'info',
    position: 'bottom',
  },
];

export const LOADING_STATUS_SEQUENCE = [
  'Connecting Enterprise Core...',
  'Syncing Registered Appliances...',
  'Verifying Warranty Vault...',
  'Preparing Dashboard Experience...',
] as const;

export const SPLASH_ANIMATION_CONFIG = {
  NAVIGATE_DELAY_MS: 2000,
  STATUS_INTERVAL_MS: 500,
  ENTRANCE_DURATION: 800,
  PULSE_DURATION: 2200,
  FLOAT_DURATION: 3000,
};

export const makeStyles = (theme: AppTheme, insets: EdgeInsets, isDark: boolean = false) => {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.default,
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    safeContentContainer: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Math.max(insets.top + spacing.md, spacing.xl),
      paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xl),
      paddingHorizontal: spacing.lg,
      zIndex: 2,
    },

    // Top Status Pill
    topBarContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
    },
    statusPillBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.05)',
      paddingHorizontal: spacing.md + 2,
      paddingVertical: spacing.xs + 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : colors.border.main,
      shadowColor: colors.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
    },
    pulseDotContainer: {
      width: 14,
      height: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.xs + 4,
    },
    pulseDotCore: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.status.success,
    },
    pulseDotGlow: {
      position: 'absolute',
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.status.success,
    },
    topPillText: {
      color: colors.text.primary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
    },

    // Center Hero Graphic
    centerHeroContainer: {
      width: SCREEN_WIDTH * 0.82,
      height: 270,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    pulseRingOuter: {
      position: 'absolute',
      width: 210,
      height: 210,
      borderRadius: 105,
      borderWidth: 1.5,
      borderColor: colors.secondary.main + '4D',
      backgroundColor: colors.primary.main + '0F',
    },
    pulseRingInner: {
      position: 'absolute',
      width: 165,
      height: 165,
      borderRadius: 82.5,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : colors.border.main,
      backgroundColor: 'transparent',
    },
    logoBadgeContainer: {
      width: 132,
      height: 132,
      borderRadius: 66,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(37, 99, 235, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(37, 99, 235, 0.3)',
      shadowColor: colors.primary.main,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 12,
    },
    logoCircleInner: {
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: colors.primary.main,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.translucentWhite,
      shadowColor: colors.common.black,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    logoImage: {
      width: 72,
      height: 72,
    },

    // Floating Feature Glass Cards
    floatingChipLeft: {
      position: 'absolute',
      top: 10,
      left: -spacing.sm,
      zIndex: 10,
    },
    floatingChipRight: {
      position: 'absolute',
      top: 60,
      right: -spacing.sm,
      zIndex: 10,
    },
    floatingChipBottom: {
      position: 'absolute',
      bottom: 0,
      zIndex: 10,
    },
    chipCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.88)' : colors.background.paper,
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: spacing.xs + 4,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : colors.border.main,
      gap: spacing.xs + 4,
      shadowColor: colors.common.black,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.1,
      shadowRadius: 10,
      elevation: 8,
    },
    chipIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipTextWrap: {
      justifyContent: 'center',
    },
    chipTitle: {
      color: colors.text.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    chipSubtitle: {
      color: colors.text.secondary,
      fontSize: 9,
      fontWeight: '500',
      marginTop: 1,
    },

    // Title Section
    titleSection: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing.sm,
    },
    mainTitleText: {
      color: colors.text.primary,
      fontWeight: '900',
      fontSize: 28,
      letterSpacing: 2.5,
      textAlign: 'center',
      textShadowColor: colors.primary.main + '40',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 12,
    },
    subtitleText: {
      color: colors.text.secondary,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 1,
      marginTop: spacing.xs,
      textAlign: 'center',
    },

    // Loading & Progress Section
    loadingSection: {
      width: '100%',
      maxWidth: 340,
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.xs,
    },
    progressBarTrack: {
      width: '100%',
      height: 5,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.border.main,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.status.success,
      borderRadius: radius.pill,
      shadowColor: colors.status.success,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 6,
      elevation: 4,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm + 4,
      height: 24,
    },
    statusSpinner: {
      marginRight: spacing.xs + 2,
    },
    statusText: {
      color: colors.text.primary,
      fontSize: 11.5,
      fontWeight: '700',
      letterSpacing: 0.4,
    },

    // Floating Ambient Light Orbs
    particleDot: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: colors.text.primary,
    },
    glowOrb1: {
      position: 'absolute',
      top: '15%',
      left: '-10%',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: colors.primary.main + '38',
    },
    glowOrb2: {
      position: 'absolute',
      bottom: '20%',
      right: '-15%',
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: colors.secondary.main + '26',
    },
  });
};


