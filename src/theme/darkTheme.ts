import type { AppTheme } from './lightTheme';

export const darkTheme: AppTheme = {
  colors: {
    common: {
      white: '#FFFFFF',
      black: '#000000',
      transparent: 'transparent',
    },
    primary: {
      main: '#3B82F6', // Lighter blue for dark mode
      light: '#1E3A8A', // Darker blue background
      dark: '#93C5FD',
      gradient: ['#60A5FA', '#3B82F6'],
    },
    cta: {
      main: '#2DD4BF', // Lighter teal
      hover: '#14B8A6',
      light: '#134E4A', // Dark teal background
    },
    secondary: {
      main: '#818CF8', // Lighter indigo
      light: '#312E81', // Dark indigo background
      dark: '#A5B4FC',
    },
    status: {
      success: '#4ADE80',
      successBg: '#14532D',
      warning: '#FBBF24',
      warningBg: '#78350F',
      danger: '#F87171',
      dangerBg: '#7F1D1D',
      info: '#60A5FA',
      infoBg: '#1E3A8A',
      neutral: '#9CA3AF',
      neutralBg: '#374151',
    },
    social: {
      google: '#EA4335',
      apple: '#FFFFFF', // White apple icon on dark mode
    },
    category: {
      dashboardBg: '#1E3A8A',
      dashboardIcon: '#60A5FA',
      productsBg: '#1E3A8A',
      productsIcon: '#60A5FA',
      warrantyBg: '#064E3B',
      warrantyIcon: '#34D399',
      complaintBg: '#78350F',
      complaintIcon: '#FBBF24',
      walletBg: '#312E81',
      walletIcon: '#818CF8',
      notificationBg: '#78350F',
      notificationIcon: '#FBBF24',
      settingsBg: '#1E293B',
      settingsIcon: '#94A3B8',
      supportBg: '#164E63',
      supportIcon: '#22D3EE',
      indigoBg: '#312E81',
      indigoIcon: '#818CF8',
      emeraldBg: '#064E3B',
      emeraldIcon: '#34D399',
      orangeBg: '#78350F',
      orangeIcon: '#FBBF24',
      roseBg: '#7F1D1D',
      roseIcon: '#F87171',
      amberBg: '#78350F',
      amberIcon: '#FBBF24',
      purpleBg: '#312E81',
      purpleIcon: '#818CF8',
      skyBg: '#1E3A8A',
      skyIcon: '#60A5FA',
      slateBg: '#1E293B',
      slateIcon: '#94A3B8',
    },
    neutral: {
      50: '#0F172A',
      100: '#1E293B',
      200: '#334155',
      300: '#475569',
      400: '#64748B',
      500: '#94A3B8',
      600: '#CBD5E1',
      700: '#E2E8F0',
      800: '#F1F5F9',
      900: '#F8FAFC',
    },
    background: {
      default: '#0F172A', // Very dark slate
      paper: '#1E293B',   // Dark slate for cards
      elevated: '#334155', // Lighter slate for modals
      dark: '#000000',
      translucentWhite: 'rgba(255,255,255,0.1)',
      translucentWhiteLight: 'rgba(255,255,255,0.05)',
    },
    text: {
      primary: '#F8FAFC', // Near white
      secondary: '#CBD5E1', // Light slate
      muted: '#64748B', // Medium slate
      inverse: '#0F172A', // Dark slate
      amber: '#FBBF24',
    },
    border: {
      light: '#334155',
      main: '#475569',
      dark: '#64748B',
      translucentWhite: 'rgba(255,255,255,0.1)',
    },
    scanner: {
      bg: '#000000',
      reticle: '#2DD4BF',
      overlay: 'rgba(0, 0, 0, 0.75)',
      flashActive: 'rgba(45, 212, 191, 0.25)',
    },
    wallet: {
      gradient: ['#3B82F6', '#1D4ED8', '#1E3A8A'],
      balanceBg: '#312E81',
      addMoneyBg: 'rgba(255,255,255,0.1)',
      addMoneyBorder: 'rgba(255,255,255,0.2)',
    },
  },
};
