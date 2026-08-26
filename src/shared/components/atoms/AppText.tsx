import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet, StyleProp } from 'react-native';
import { useTheme } from '@theme/ThemeContext';

export type TextVariant =
  | 'displayXl'
  | 'displayLg'
  | 'displayMd'
  | 'headingXl'
  | 'headingLg'
  | 'headingMd'
  | 'headingSm'
  | 'bodyLg'
  | 'bodyMd'
  | 'bodySm'
  | 'labelLg'
  | 'labelMd'
  | 'labelSm'
  | 'caption'
  | 'mono';

export interface AppTextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'bodyMd',
  color,
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Resolve color
  let resolvedColor = colors.text?.primary || '#0F172A';
  if (color) {
    if (color === 'textPrimary') {
      resolvedColor = colors.text.primary;
    } else if (color === 'textSecondary') {
      resolvedColor = colors.text.secondary;
    } else if (color === 'textMuted') {
      resolvedColor = colors.text.muted;
    } else if (color === 'textInverse') {
      resolvedColor = colors.text.inverse;
    } else if (color in colors.text) {
      resolvedColor = (colors.text as any)[color];
    } else if (color in colors.primary) {
      resolvedColor = (colors.primary as any)[color];
    } else if (color === 'primary') {
      resolvedColor = colors.primary.main;
    } else if (color === 'secondary') {
      resolvedColor = colors.secondary.main;
    } else if (color === 'danger') {
      resolvedColor = colors.status.danger;
    } else if (color === 'success') {
      resolvedColor = colors.status.success;
    } else {
      resolvedColor = color;
    }
  }

  const variantStyle = variantStyles[variant] || variantStyles.bodyMd;

  return (
    <RNText style={[{ color: resolvedColor }, variantStyle, style]} {...props}>
      {children}
    </RNText>
  );
};

const variantStyles = StyleSheet.create({
  displayXl: { fontSize: 40, fontWeight: '800', lineHeight: 48 },
  displayLg: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  displayMd: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  headingXl: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  headingLg: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  headingMd: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  headingSm: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  bodyLg: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMd: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySm: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  labelLg: { fontSize: 16, fontWeight: '500', lineHeight: 22 },
  labelMd: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  labelSm: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  caption: { fontSize: 10, fontWeight: '400', lineHeight: 14 },
  mono: { fontSize: 12, fontWeight: '400', fontFamily: 'monospace' },
});
