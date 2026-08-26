/**
 * @file StepProgressBar.tsx
 * @feature Bookings / Components
 * @responsibility Progressive 4-step wizard progress indicator adhering to DESIGN_SYSTEM.md tokens.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '@shared/components/atoms/AppText';
import { AppIcon } from '@shared/components/atoms/Icon';
import { spacing, radius, useTheme } from '@theme/index';

export interface StepProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  stepLabels?: string[];
  onStepPress?: (step: number) => void;
}

const DEFAULT_LABELS = ['Category', 'Service', 'Specialist', 'Schedule'];

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  totalSteps = 4,
  stepLabels = DEFAULT_LABELS,
  onStepPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          const label = stepLabels[i] || `Step ${stepNum}`;

          return (
            <React.Fragment key={stepNum}>
              <TouchableOpacity
                activeOpacity={isCompleted ? 0.7 : 1}
                onPress={() => {
                  if (isCompleted && onStepPress) {
                    onStepPress(stepNum);
                  }
                }}
                disabled={!isCompleted || !onStepPress}
                style={styles.stepItem}
              >
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.completedCircle,
                    isActive && styles.activeCircle,
                  ]}
                >
                  {isCompleted ? (
                    <AppIcon name="checkmark" size="xs" color={colors.text.inverse} />
                  ) : (
                    <AppText
                      variant="caption"
                      style={[
                        styles.stepNumber,
                        isActive && styles.activeStepNumber,
                      ]}
                    >
                      {stepNum}
                    </AppText>
                  )}
                </View>
                <AppText
                  variant="caption"
                  numberOfLines={1}
                  style={[
                    styles.label,
                    isActive && styles.activeLabel,
                    isCompleted && styles.completedLabel,
                  ]}
                >
                  {label}
                </AppText>
              </TouchableOpacity>

              {stepNum < totalSteps && (
                <View
                  style={[
                    styles.connectingLine,
                    stepNum < currentStep && styles.completedLine,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      marginBottom: spacing.md,
      backgroundColor: colors.background.paper,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    stepsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stepItem: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 54,
    },
    circle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.background.default,
      borderWidth: 1.5,
      borderColor: colors.border.main,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 3,
    },
    activeCircle: {
      borderColor: colors.primary.main,
      backgroundColor: colors.primary.main,
    },
    completedCircle: {
      borderColor: colors.status.success,
      backgroundColor: colors.status.success,
    },
    stepNumber: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text.muted,
    },
    activeStepNumber: {
      color: colors.text.inverse,
    },
    label: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.text.muted,
      textAlign: 'center',
    },
    activeLabel: {
      color: colors.primary.main,
      fontWeight: '700',
    },
    completedLabel: {
      color: colors.status.success,
      fontWeight: '600',
    },
    connectingLine: {
      flex: 1,
      height: 2,
      backgroundColor: colors.border.main,
      marginHorizontal: 4,
      marginBottom: 16,
    },
    completedLine: {
      backgroundColor: colors.status.success,
    },
  });
