import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ViewStyle,
  StatusBarStyle,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useTheme } from '@theme/index';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  barStyle?: StatusBarStyle;
  translucentStatusBar?: boolean;
  /** Whether to apply bottom safe area inset padding. Defaults to false to prevent double-insets inside Tab views */
  withBottomInset?: boolean;

  /** Enable industry-standard scrollable container for forms and screens */
  scrollable?: boolean;
  /** Enable keyboard avoiding view so inputs and action buttons shift smoothly */
  keyboardAvoiding?: boolean;
  /** Offset for header height in KeyboardAvoidingView */
  keyboardVerticalOffset?: number;
  /** Content container style for ScrollView */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Strategy for dismissing keyboard on tap */
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  /** Dismiss keyboard on tap outside */
  dismissKeyboardOnTap?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  backgroundColor,
  barStyle,
  translucentStatusBar = false,
  withBottomInset = false,
  scrollable = false,
  keyboardAvoiding = true,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 25,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
  dismissKeyboardOnTap = false,
}) => {
  const { theme, isDark } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const resolvedBg = backgroundColor || colors.background.default;
  const resolvedBarStyle = barStyle || (isDark ? 'light-content' : 'dark-content');

  const renderBody = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContentContainer, contentContainerStyle]}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {children}
        </ScrollView>
      );
    }
    return <View style={styles.flex}>{children}</View>;
  };

  const renderContent = () => {
    let body = renderBody();

    if (keyboardAvoiding) {
      body = (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          {body}
        </KeyboardAvoidingView>
      );
    }

    if (dismissKeyboardOnTap && !scrollable) {
      body = (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.flex}>{body}</View>
        </TouchableWithoutFeedback>
      );
    }

    return body;
  };

  return (
    <View
      style={[
        styles.safeAreaContainer,
        {
          backgroundColor: resolvedBg,
          paddingTop: translucentStatusBar ? 0 : insets.top,
          paddingBottom: withBottomInset ? (insets.bottom > 0 ? insets.bottom : 8) : 0,
        },
      ]}
    >
      <StatusBar
        backgroundColor={translucentStatusBar ? colors.common.transparent : resolvedBg}
        barStyle={resolvedBarStyle}
        translucent={translucentStatusBar}
      />
      <View style={[styles.contentContainer, style]}>{renderContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
});
