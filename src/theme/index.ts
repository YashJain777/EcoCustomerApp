import { colors } from './colors';
import { spacing, typography, radius, shadows } from './spacing';
import { ThemeProvider, useTheme } from './ThemeContext';
import { lightTheme, type AppTheme } from './lightTheme';
import { darkTheme } from './darkTheme';
import { getCommonStyles } from './commonStyles';

export const theme = {
  colors,
  spacing,
  typography,
  radius,
  shadows,
};

export type Theme = typeof theme;
export { colors, spacing, typography, radius, shadows, ThemeProvider, useTheme, lightTheme, darkTheme, getCommonStyles, type AppTheme };

