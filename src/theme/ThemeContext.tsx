import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useColorScheme, Modal, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { lightTheme, type AppTheme } from './lightTheme';
import { darkTheme } from './darkTheme';
import { appStorage } from '@core/storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: AppTheme;
  themeMode: ThemeMode;
  isDark: boolean;
  isThemeChanging: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  themeMode: 'system',
  isDark: false,
  isThemeChanging: false,
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      return appStorage?.getTheme?.() ?? 'system';
    } catch {
      return 'system';
    }
  });

  const [isThemeChanging, setIsThemeChanging] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  const resolvedTheme = isDark ? darkTheme : lightTheme;

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState((prevMode) => {
      if (prevMode === mode) {
        return prevMode;
      }
      setIsThemeChanging(true);
      try {
        appStorage?.setTheme?.(mode);
      } catch {}

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setIsThemeChanging(false);
      }, 450);

      return mode;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, themeMode, isDark, isThemeChanging, setThemeMode }}>
      {children}
      <Modal transparent animationType="fade" visible={isThemeChanging}>
        <View style={styles.loaderOverlay}>
          <View style={[styles.loaderCard, { backgroundColor: resolvedTheme.colors.background.paper, borderRadius: 12 }]}>
            <ActivityIndicator size="large" color={resolvedTheme.colors.primary.main} />
            <Text style={[styles.loaderText, { color: resolvedTheme.colors.text.primary }]}>
              Switching theme...
            </Text>
          </View>
        </View>
      </Modal>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
};

const styles = StyleSheet.create({
  loaderOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  loaderCard: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  loaderText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

