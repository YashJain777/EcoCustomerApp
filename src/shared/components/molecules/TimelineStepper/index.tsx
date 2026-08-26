import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../../atoms/AppText';
import { spacing, useTheme } from '@theme/index';

export interface StepItem {
  title: string;
  time?: string;
  isCompleted: boolean;
  isActive?: boolean;
  subtitle?: string;
}

interface TimelineStepperProps {
  steps: StepItem[];
}

export const TimelineStepper: React.FC<TimelineStepperProps> = ({ steps }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <View key={index} style={styles.stepRow}>
            {/* Left Timeline Indicator */}
            <View style={styles.indicatorContainer}>
              <View
                style={[
                  styles.circle,
                  step.isCompleted && styles.completedCircle,
                  step.isActive && styles.activeCircle,
                ]}
              >
                {step.isCompleted ? <AppText style={styles.checkmark}>✓</AppText> : null}
              </View>
              {!isLast ? (
                <View
                  style={[
                    styles.line,
                    step.isCompleted && styles.completedLine,
                  ]}
                />
              ) : null}
            </View>

            {/* Right Content */}
            <View style={styles.contentContainer}>
              <View style={styles.stepHeader}>
                <AppText style={[styles.stepTitle, step.isActive && styles.activeTitle]}>
                  {step.title}
                </AppText>
                {step.time ? <AppText style={styles.stepTime}>{step.time}</AppText> : null}
              </View>
              {step.subtitle ? <AppText style={styles.stepSubtitle}>{step.subtitle}</AppText> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  indicatorContainer: {
    alignItems: 'center',
    width: 28,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.dark,
    backgroundColor: colors.background.paper,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  completedCircle: {
    borderColor: colors.status.success,
    backgroundColor: colors.status.success,
  },
  activeCircle: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  checkmark: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.main,
    marginVertical: 2,
  },
  completedLine: {
    backgroundColor: colors.status.success,
  },
  contentContainer: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingBottom: spacing.md,
    minWidth: 0,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  stepTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 18,
  },
  activeTitle: {
    color: colors.primary.main,
    fontWeight: '700',
  },
  stepTime: {
    fontSize: 11,
    color: colors.text.muted,
    textAlign: 'right',
    flexShrink: 0,
    marginTop: 1,
  },
  stepSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

