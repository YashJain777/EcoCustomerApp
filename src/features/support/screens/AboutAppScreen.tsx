import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Header } from '@shared/components/molecules/Header';
import { Card } from '@shared/components/atoms/Card';
import { AppIcon } from '@shared/components/atoms/Icon';
import { spacing, useTheme } from '@theme/index';

export const AboutAppScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="About App"
        subtitle="System information"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBox}>
          <View style={styles.logoBadge}>
            <AppIcon name="cube-outline" size={36} color={colors.primary.main} />
          </View>
          <Text style={styles.appName}>Smart Sales, Service & Transport Ecosystem</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        <Text style={styles.description}>
          Your complete solution for product registration, warranty management, service requests, and much more.
        </Text>

        <Card style={styles.featuresCard} padding="lg">
          <View style={styles.featureItem}>
            <AppIcon name="checkmark-circle" size="md" color={colors.status.success} style={styles.featureIcon} />
            <Text style={styles.featureText}>Secure & Reliable</Text>
          </View>

          <View style={styles.featureItem}>
            <AppIcon name="checkmark-circle" size="md" color={colors.status.success} style={styles.featureIcon} />
            <Text style={styles.featureText}>Fast & Easy Service</Text>
          </View>

          <View style={styles.featureItem}>
            <AppIcon name="checkmark-circle" size="md" color={colors.status.success} style={styles.featureIcon} />
            <Text style={styles.featureText}>Digital Warranty</Text>
          </View>

          <View style={styles.featureItem}>
            <AppIcon name="checkmark-circle" size="md" color={colors.status.success} style={styles.featureIcon} />
            <Text style={styles.featureText}>24x7 Support</Text>
          </View>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.copyrightText}>© 2026 All rights reserved.</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  heroBox: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  versionText: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 4,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  featuresCard: {
    width: '100%',
    marginBottom: spacing.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIcon: {
    marginRight: spacing.sm,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  footer: {
    marginTop: spacing.xl,
  },
  copyrightText: {
    fontSize: 12,
    color: colors.text.muted,
  },
});
