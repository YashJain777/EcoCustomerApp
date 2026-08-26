import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { AppText } from '../AppText';
import { spacing, radius, useTheme } from '@theme/index';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  prefix?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  prefix,
  containerStyle,
  inputWrapperStyle,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <AppText variant="labelMd" style={styles.label}>{label}</AppText> : null}
      <View style={[styles.inputWrapper, error ? styles.inputError : null, inputWrapperStyle]}>
        {leftIcon ? <View style={styles.iconContainer}>{leftIcon}</View> : null}
        {prefix ? (
          <View style={styles.prefixContainer}>
            <AppText style={styles.prefixText}>{prefix}</AppText>
            <View style={styles.prefixDivider} />
          </View>
        ) : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.text.muted}
          {...props}
        />
      </View>
      {error ? <AppText variant="caption" style={styles.errorText}>{error}</AppText> : null}
    </View>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: radius.md,
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputError: {
    borderColor: colors.status.danger,
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  prefixDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border.main,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    paddingVertical: 0,
  },
  errorText: {
    color: colors.status.danger,
    marginTop: spacing.xs,
  },
});

