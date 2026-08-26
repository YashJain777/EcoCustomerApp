import React, { useEffect, useState, useMemo } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import Svg, { Defs, RadialGradient, Stop, Path, Circle, G, Line, Rect } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { AppText } from '@shared/components/atoms/AppText';
import { AppIcon } from '@shared/components/atoms/Icon';
import { getAuthToken } from '@infrastructure/api/axiosInstance';
import {
  makeStyles,
  FEATURE_CHIPS,
  LOADING_STATUS_SEQUENCE,
  SPLASH_ANIMATION_CONFIG,
} from './SplashScreen.styles';

/**
 * Enterprise Background SVG with Modern Radial Glow & Appliance Network Topology
 */
const AmbientBackgroundSVG: React.FC = React.memo(() => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient
            id="bgGradient"
            cx="50%"
            cy="40%"
            r="65%"
            fx="50%"
            fy="35%"
          >
            <Stop offset="0%" stopColor={colors.primary.main} stopOpacity={isDark ? 0.4 : 0.2} />
            <Stop offset="55%" stopColor={isDark ? '#110A38' : colors.primary.light} stopOpacity={isDark ? 0.9 : 0.6} />
            <Stop offset="100%" stopColor={colors.background.default} stopOpacity={1} />
          </RadialGradient>
        </Defs>

        {/* Deep Ambient Background Glow */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGradient)" />

        {/* Network Dotted Topology Mesh */}
        <G opacity={isDark ? 0.12 : 0.2} stroke={colors.status.info} strokeWidth={1}>
          <Line x1="15%" y1="18%" x2="45%" y2="28%" strokeDasharray="4 4" />
          <Line x1="45%" y1="28%" x2="85%" y2="20%" strokeDasharray="4 4" />
          <Line x1="85%" y1="20%" x2="75%" y2="55%" strokeDasharray="4 4" />
          <Line x1="15%" y1="18%" x2="25%" y2="65%" strokeDasharray="4 4" />
          <Line x1="25%" y1="65%" x2="50%" y2="82%" strokeDasharray="4 4" />
          <Line x1="75%" y1="55%" x2="50%" y2="82%" strokeDasharray="4 4" />

          <Circle cx="15%" cy="18%" r="4" fill={colors.status.info} />
          <Circle cx="45%" cy="28%" r="3" fill={colors.status.warning} />
          <Circle cx="85%" cy="20%" r="4" fill={colors.status.success} />
          <Circle cx="75%" cy="55%" r="3.5" fill={colors.status.info} />
          <Circle cx="25%" cy="65%" r="4" fill={colors.status.warning} />
          <Circle cx="50%" cy="82%" r="5" fill={colors.status.success} />
        </G>

        {/* Appliance Line Art Wireframes */}
        <G opacity={isDark ? 0.08 : 0.14} stroke={isDark ? colors.common.white : colors.text.secondary} strokeWidth={1.2} fill="none">
          {/* Smart Refrigerator (Top Left) */}
          <G transform="translate(20, 90)">
            <Rect x="0" y="0" width="36" height="64" rx="4" />
            <Line x1="0" y1="24" x2="36" y2="24" />
            <Line x1="8" y1="10" x2="8" y2="18" />
            <Line x1="8" y1="32" x2="8" y2="44" />
          </G>

          {/* Washing Machine (Bottom Right) */}
          <G transform="translate(290, 580)">
            <Rect x="0" y="0" width="40" height="44" rx="3" />
            <Circle cx="20" cy="24" r="12" />
            <Circle cx="20" cy="24" r="8" strokeDasharray="2 2" />
          </G>

          {/* Air Conditioner (Top Right) */}
          <G transform="translate(280, 110)">
            <Rect x="0" y="0" width="50" height="20" rx="2" />
            <Line x1="6" y1="14" x2="44" y2="14" />
          </G>

          {/* Smart Hub / Thermostat (Bottom Left) */}
          <G transform="translate(30, 600)">
            <Circle cx="20" cy="20" r="20" />
            <Circle cx="20" cy="20" r="4" />
          </G>
        </G>
      </Svg>
    </View>
  );
});

/**
 * Floating Soft Drift Particles
 */
const ParticleDot: React.FC<{
  leftPercent: number;
  topPercent: number;
  size: number;
  delayMs: number;
  style: any;
}> = React.memo(({ leftPercent, topPercent, size, delayMs, style }) => {
  const floatY = useSharedValue(0);
  const opacityVal = useSharedValue(0.15);

  useEffect(() => {
    floatY.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(-14, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
          withTiming(8, { duration: 2400, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
    opacityVal.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(0.4, { duration: 2000 }),
          withTiming(0.1, { duration: 2000 })
        ),
        -1,
        true
      )
    );
  }, [delayMs, floatY, opacityVal]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
    opacity: opacityVal.value,
  }));

  return (
    <Animated.View
      style={[
        style,
        animatedStyle,
        {
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    />
  );
});

export const SplashScreen: React.FC<any> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, insets, isDark), [theme, insets, isDark]);

  const getChipAccentColor = (key: 'success' | 'warning' | 'info') => {
    return colors.status[key];
  };

  // Master Scale & Fade
  const masterScale = useSharedValue(0.85);
  const masterOpacity = useSharedValue(1);

  // Status Pulse Dot
  const pulseDotScale = useSharedValue(1);
  const pulseDotOpacity = useSharedValue(0.5);

  // Central Logo Badge Pulse Rings
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.4);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0.25);

  // Floating Glass Feature Chips Bobbing
  const floatLeftY = useSharedValue(0);
  const floatRightY = useSharedValue(0);
  const floatBottomY = useSharedValue(0);

  // Progress Bar Value
  const progressVal = useSharedValue(0);

  // Status Text Sequence
  const [statusIndex, setStatusIndex] = useState(0);
  const statusOpacity = useSharedValue(1);
  const statusTranslateY = useSharedValue(0);

  useEffect(() => {
    // 1. Entrance Spring Scale
    masterScale.value = withSpring(1, {
      damping: 15,
      stiffness: 90,
    });

    // 2. Pulse Dot Breathing
    pulseDotScale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    pulseDotOpacity.value = withRepeat(
      withSequence(
        withTiming(0.1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // 3. Central Logo Pulse Rings
    ring1Scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1800, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    ring1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.05, { duration: 1800, easing: Easing.out(Easing.quad) }),
        withTiming(0.45, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    ring2Scale.value = withDelay(
      450,
      withRepeat(
        withSequence(
          withTiming(1.5, { duration: 2200, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      )
    );
    ring2Opacity.value = withDelay(
      450,
      withRepeat(
        withSequence(
          withTiming(0.02, { duration: 2200, easing: Easing.out(Easing.quad) }),
          withTiming(0.3, { duration: 2200, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      )
    );

    // 4. Floating Feature Chips
    floatLeftY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(3, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    floatRightY.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(-7, { duration: 1650, easing: Easing.inOut(Easing.sin) }),
          withTiming(4, { duration: 1650, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    floatBottomY.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: 1400, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // 5. Progress Fill
    progressVal.value = withTiming(1, {
      duration: SPLASH_ANIMATION_CONFIG.NAVIGATE_DELAY_MS,
      easing: Easing.bezier(0.2, 0, 0.2, 1),
    });

    // 6. Dynamic Status Timers
    const timerStep1 = setTimeout(() => {
      triggerStatusTextChange(1);
    }, SPLASH_ANIMATION_CONFIG.STATUS_INTERVAL_MS);

    const timerStep2 = setTimeout(() => {
      triggerStatusTextChange(2);
    }, SPLASH_ANIMATION_CONFIG.STATUS_INTERVAL_MS * 2);

    const timerStep3 = setTimeout(() => {
      triggerStatusTextChange(3);
    }, SPLASH_ANIMATION_CONFIG.STATUS_INTERVAL_MS * 3);

    // 7. Navigation Routing
    const timerNav = setTimeout(() => {
      try {
        const token = getAuthToken();
        const rootNav = navigation.getParent() || navigation;

        if (token) {
          rootNav.reset({
            index: 0,
            routes: [{ name: 'MainTab' as any }],
          });
        } else {
          navigation.replace('CustomerLoginScreen' as any);
        }
      } catch (error) {
        console.warn('SplashScreen Navigation Reset:', error);
        navigation.replace('CustomerLoginScreen' as any);
      }
    }, SPLASH_ANIMATION_CONFIG.NAVIGATE_DELAY_MS);

    return () => {
      clearTimeout(timerStep1);
      clearTimeout(timerStep2);
      clearTimeout(timerStep3);
      clearTimeout(timerNav);
    };
  }, [
    masterScale,
    pulseDotScale,
    pulseDotOpacity,
    ring1Scale,
    ring1Opacity,
    ring2Scale,
    ring2Opacity,
    floatLeftY,
    floatRightY,
    floatBottomY,
    progressVal,
    navigation,
  ]);

  const triggerStatusTextChange = (nextIndex: number) => {
    statusOpacity.value = 0;
    statusTranslateY.value = 6;
    setStatusIndex(nextIndex);
    statusOpacity.value = withTiming(1, { duration: 220 });
    statusTranslateY.value = withSpring(0, { damping: 14 });
  };

  // Reanimated Styles
  const masterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: masterScale.value }],
    opacity: masterOpacity.value,
  }));

  const pulseDotGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseDotScale.value }],
    opacity: pulseDotOpacity.value,
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const chipLeftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatLeftY.value }],
  }));

  const chipRightStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatRightY.value }],
  }));

  const chipBottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatBottomY.value }],
  }));

  const progressFillStyle = useAnimatedStyle(() => ({
    width: `${progressVal.value * 100}%`,
  }));

  const statusTextAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
    transform: [{ translateY: statusTranslateY.value }],
  }));

  return (
    <ScreenWrapper
      style={styles.container}
      backgroundColor={colors.background.default}
      barStyle={isDark ? 'light-content' : 'dark-content'}
      translucentStatusBar
    >
      {/* Background SVG Ambient Glow */}
      <AmbientBackgroundSVG />

      {/* Floating Glowing Background Orbs */}
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />

      {/* Floating Ambient Particles */}
      <ParticleDot leftPercent={18} topPercent={20} size={5} delayMs={0} style={styles.particleDot} />
      <ParticleDot leftPercent={82} topPercent={16} size={6} delayMs={300} style={styles.particleDot} />
      <ParticleDot leftPercent={12} topPercent={72} size={4} delayMs={600} style={styles.particleDot} />
      <ParticleDot leftPercent={85} topPercent={78} size={5} delayMs={900} style={styles.particleDot} />
      <ParticleDot leftPercent={50} topPercent={10} size={4} delayMs={400} style={styles.particleDot} />

      {/* Main Safe Content Container */}
      <View style={styles.safeContentContainer}>
        {/* TOP STATUS PILL BADGE */}
        <Animated.View
          style={[styles.topBarContainer, masterAnimatedStyle]}
          accessibilityRole="header"
          accessibilityLabel="Smart Ecosystem Core Active"
        >
          <View style={styles.statusPillBadge}>
            <View style={styles.pulseDotContainer}>
              <Animated.View style={[styles.pulseDotGlow, pulseDotGlowStyle]} />
              <View style={styles.pulseDotCore} />
            </View>
            <AppText variant="caption" style={styles.topPillText}>
              SMART ECOSYSTEM CORE • ONLINE
            </AppText>
          </View>
        </Animated.View>

        {/* CENTER LOGO GRAPHIC WITH PULSE RINGS & FLOATING GLASS CHIPS */}
        <Animated.View
          style={[styles.centerHeroContainer, masterAnimatedStyle]}
          accessibilityLabel="Smart Ecosystem Logo Badge"
        >
          {/* Outer Ripple Pulse Rings */}
          <Animated.View style={[styles.pulseRingOuter, ring2Style]} />
          <Animated.View style={[styles.pulseRingInner, ring1Style]} />

          {/* Central Glassmorphic Shield Badge */}
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoCircleInner}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
                accessibilityLabel="Company Logo"
              />
            </View>
          </View>

          {/* FLOATING FEATURE CHIPS */}
          {/* Left: Digital Warranty */}
          <Animated.View style={[styles.floatingChipLeft, chipLeftStyle]}>
            <View style={styles.chipCard}>
              <View style={[styles.chipIconWrapper, { backgroundColor: getChipAccentColor(FEATURE_CHIPS[0].accentColorKey) + '25' }]}>
                <AppIcon
                  name={FEATURE_CHIPS[0].icon}
                  size={14}
                  color={getChipAccentColor(FEATURE_CHIPS[0].accentColorKey)}
                  family={FEATURE_CHIPS[0].family}
                />
              </View>
              <View style={styles.chipTextWrap}>
                <AppText variant="caption" style={styles.chipTitle}>
                  {FEATURE_CHIPS[0].label}
                </AppText>
                <AppText variant="caption" style={styles.chipSubtitle}>
                  {FEATURE_CHIPS[0].sublabel}
                </AppText>
              </View>
            </View>
          </Animated.View>

          {/* Right: Instant Service */}
          <Animated.View style={[styles.floatingChipRight, chipRightStyle]}>
            <View style={styles.chipCard}>
              <View style={[styles.chipIconWrapper, { backgroundColor: getChipAccentColor(FEATURE_CHIPS[1].accentColorKey) + '25' }]}>
                <AppIcon
                  name={FEATURE_CHIPS[1].icon}
                  size={14}
                  color={getChipAccentColor(FEATURE_CHIPS[1].accentColorKey)}
                  family={FEATURE_CHIPS[1].family}
                />
              </View>
              <View style={styles.chipTextWrap}>
                <AppText variant="caption" style={styles.chipTitle}>
                  {FEATURE_CHIPS[1].label}
                </AppText>
                <AppText variant="caption" style={styles.chipSubtitle}>
                  {FEATURE_CHIPS[1].sublabel}
                </AppText>
              </View>
            </View>
          </Animated.View>

          {/* Bottom: QR Authenticator */}
          <Animated.View style={[styles.floatingChipBottom, chipBottomStyle]}>
            <View style={styles.chipCard}>
              <View style={[styles.chipIconWrapper, { backgroundColor: getChipAccentColor(FEATURE_CHIPS[2].accentColorKey) + '25' }]}>
                <AppIcon
                  name={FEATURE_CHIPS[2].icon}
                  size={14}
                  color={getChipAccentColor(FEATURE_CHIPS[2].accentColorKey)}
                  family={FEATURE_CHIPS[2].family}
                />
              </View>
              <View style={styles.chipTextWrap}>
                <AppText variant="caption" style={styles.chipTitle}>
                  {FEATURE_CHIPS[2].label}
                </AppText>
                <AppText variant="caption" style={styles.chipSubtitle}>
                  {FEATURE_CHIPS[2].sublabel}
                </AppText>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* BRAND TITLE & SUBTITLE */}
        <Animated.View
          style={[styles.titleSection, masterAnimatedStyle]}
          accessibilityRole="header"
        >
          <AppText variant="displayLg" style={styles.mainTitleText}>
            SMART ECOSYSTEM
          </AppText>
          <AppText variant="bodyMd" style={styles.subtitleText}>
            Sales • Warranty • Field Service Platform
          </AppText>
        </Animated.View>

        {/* LOADING & PROGRESS STATUS SECTION */}
        <Animated.View
          style={[styles.loadingSection, masterAnimatedStyle]}
          accessibilityRole="progressbar"
          accessibilityValue={{ now: Math.round((statusIndex + 1) * 25) }}
        >
          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, progressFillStyle]} />
          </View>

          <View style={styles.statusRow}>
            <ActivityIndicator
              size="small"
              color={colors.status.success}
              style={styles.statusSpinner}
            />
            <Animated.View style={statusTextAnimatedStyle}>
              <AppText variant="caption" style={styles.statusText}>
                {`${statusIndex + 1}/4 • ${LOADING_STATUS_SEQUENCE[statusIndex]}`}
              </AppText>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
};


