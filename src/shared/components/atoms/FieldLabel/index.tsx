/**
 * @file FieldLabel/index.tsx
 * @layer Shared / Atoms
 * @responsibility Standardized form field label adhering strictly to DESIGN_SYSTEM.md.
 *                 Globally parses the label: if required=true or if label contains an asterisk '*',
 *                 the asterisk is cleanly stripped from the label text and rendered in red (colors.status.danger).
 */

import React from 'react';
import { StyleSheet, StyleProp, TextStyle, ViewStyle, View } from 'react-native';
import { AppText, TextVariant } from '../AppText';
import { spacing, useTheme } from '@theme/index';

export interface FieldLabelProps {
  label: string;
  required?: boolean;
  variant?: TextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({
  label,
  required = false,
  variant = 'labelMd',
  color = 'textPrimary',
  style,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const hasAsterisk = required || label.includes('*');
  const cleanLabel = label.replace(/\s*\*+/g, '').trim();

  return (
    <View style={[styles.container, containerStyle]}>
      <AppText variant={variant} color={color} style={[styles.labelText, style]}>
        {cleanLabel}
        {hasAsterisk && (
          <AppText variant={variant} style={styles.requiredStar}>
            {' *'}
          </AppText>
        )}
      </AppText>
    </View>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    labelText: {
      color: colors.text?.primary || '#0F172A',
    },
    requiredStar: {
      color: colors.status?.danger || colors.danger || '#EF4444',
      fontWeight: '700',
    },
  });
