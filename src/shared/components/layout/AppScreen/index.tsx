/**
 * @file AppScreen/index.tsx
 * @layer Shared / Layout
 * @responsibility Canonical screen wrapper implementing DESIGN_SYSTEM.md standards.
 *                 Handles dynamic safe area insets, adaptive theme background,
 *                 smart platform-specific keyboard avoidance, scroll containers, and status bar.
 *
 *   Keyboard Strategy (Global Enterprise Standard):
 *   ───────────────────────────────────────────────
 *   • Android:  AndroidManifest specifies `windowSoftInputMode="adjustResize"`.
 *               For scrollable screens, Android OS natively resizes the viewport —
 *               applying KAV on top causes double-offset jumping. Hence KAV is skipped
 *               when scrollable=true on Android. For non-scrollable screens, KAV with
 *               `behavior="height"` is applied.
 *   • iOS:      Always wraps in `KeyboardAvoidingView` with `behavior="padding"`.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ViewStyle,
  StyleProp,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControlProps,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';

export interface AppScreenProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  statusBarBg?: string;
  barStyle?: 'light-content' | 'dark-content';
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  keyboardOffset?: number;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  showsVerticalScrollIndicator?: boolean;
}

export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  header,
  footer,
  scrollable = false,
  keyboardAvoiding = true,
  statusBarBg,
  barStyle,
  style,
  contentStyle,
  edges = ['top'],
  keyboardOffset = Platform.OS === 'ios' ? 0 : 25,
  refreshControl,
  onScroll,
  scrollEventThrottle,
  showsVerticalScrollIndicator = false,
}) => {
  const { theme, isDark } = useTheme();
  const colors = theme.colors;

  const resolvedBg = statusBarBg || colors.background?.default || colors.surface;
  const resolvedBarStyle = barStyle || (isDark ? 'light-content' : 'dark-content');

  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
        >
          {children}
        </ScrollView>
      );
    }
    return <View style={[styles.flex, contentStyle]}>{children}</View>;
  };

  const bodyContent = (
    <View style={[styles.flex, { backgroundColor: resolvedBg }]}>
      {header}
      {renderContent()}
      {footer}
    </View>
  );

  /**
   * Smart Keyboard Avoiding Strategy:
   * iOS: always needs KAV with 'padding'.
   * Android:
   *   - If scrollable: adjustResize in AndroidManifest handles OS-level resize. Skip KAV to prevent double offset.
   *   - If non-scrollable: apply KAV with 'height' so fixed actions/inputs push up.
   */
  const shouldApplyKAV =
    keyboardAvoiding &&
    (Platform.OS === 'ios'
      ? true
      : !scrollable);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: resolvedBg }, style]} edges={edges}>
      <StatusBar
        backgroundColor={resolvedBg}
        barStyle={resolvedBarStyle}
        translucent={false}
      />
      {shouldApplyKAV ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={keyboardOffset}
        >
          {bodyContent}
        </KeyboardAvoidingView>
      ) : (
        bodyContent
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});
