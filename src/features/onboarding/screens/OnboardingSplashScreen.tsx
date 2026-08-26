import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Button } from '@shared/components/atoms/Button';
import { Card } from '@shared/components/atoms/Card';
import { AppIcon } from '@shared/components/atoms/Icon';
import { spacing, radius, shadows, useTheme } from '@theme/index';

export const OnboardingSplashScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <AppIcon name="cube" size={32} color={colors.text.inverse} />
        </View>
        <Text style={styles.appTitle}>Smart Sales & Service Ecosystem</Text>
        <Text style={styles.appSubtitle}>Customer Care Mobile App</Text>
      </View>

      <Card style={styles.illustrationCard} padding="xl">
        <View style={styles.heroGraphic}>
          <View style={styles.heroBadgeCircle}>
            <AppIcon name="people-outline" size={54} color={colors.primary.main} />
          </View>
          <View style={styles.applianceRow}>
            <View style={styles.applianceChip}>
              <AppIcon name="hardware-chip-outline" size="xs" color={colors.primary.dark} style={styles.chipIcon} />
              <Text style={styles.chipText}>AC</Text>
            </View>
            <View style={styles.applianceChip}>
              <AppIcon name="sync-outline" size="xs" color={colors.primary.dark} style={styles.chipIcon} />
              <Text style={styles.chipText}>Washer</Text>
            </View>
            <View style={styles.applianceChip}>
              <AppIcon name="water-outline" size="xs" color={colors.primary.dark} style={styles.chipIcon} />
              <Text style={styles.chipText}>RO Purifier</Text>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.content}>
        <Text style={styles.headline}>Smart Care for Every Appliance</Text>
        <Text style={styles.description}>
          Register your home products, track digital warranty, book instant repair services & manage AMC plans — all in one app.
        </Text>

        {/* Carousel indicator dots */}
        <View style={styles.indicatorContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Button
          title="Get Started Now"
          variant="cta"
          size="large"
          onPress={() => navigation.navigate('CustomerLoginScreen')}
          style={styles.ctaButton}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('CustomerLoginScreen')}
          style={styles.alreadyContainer}
          activeOpacity={0.7}
        >
          <Text style={styles.alreadyText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.large,
  },
  appTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
    marginTop: 2,
  },
  illustrationCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    borderRadius: radius.xl,
    ...shadows.medium,
  },
  heroGraphic: {
    alignItems: 'center',
  },
  heroBadgeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  applianceRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  applianceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.dark,
  },
  content: {
    alignItems: 'center',
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[300],
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.cta.main,
  },
  ctaButton: {
    width: '100%',
  },
  alreadyContainer: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  alreadyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
});
