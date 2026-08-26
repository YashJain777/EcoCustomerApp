import { lightTheme } from './lightTheme';

export interface AppColors {
  common: {
    white: string;
    black: string;
    transparent: string;
  };
  primary: {
    main: string;
    light: string;
    dark: string;
    gradient: string[];
  };
  cta: {
    main: string;
    hover: string;
    light: string;
  };
  secondary: {
    main: string;
    light: string;
    dark: string;
  };
  status: {
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    danger: string;
    dangerBg: string;
    info: string;
    infoBg: string;
    neutral: string;
    neutralBg: string;
  };
  social: {
    google: string;
    apple: string;
  };
  category: {
    dashboardBg: string;
    dashboardIcon: string;
    productsBg: string;
    productsIcon: string;
    warrantyBg: string;
    warrantyIcon: string;
    complaintBg: string;
    complaintIcon: string;
    walletBg: string;
    walletIcon: string;
    notificationBg: string;
    notificationIcon: string;
    settingsBg: string;
    settingsIcon: string;
    supportBg: string;
    supportIcon: string;
    indigoBg: string;
    indigoIcon: string;
    emeraldBg: string;
    emeraldIcon: string;
    orangeBg: string;
    orangeIcon: string;
    roseBg: string;
    roseIcon: string;
    amberBg: string;
    amberIcon: string;
    purpleBg: string;
    purpleIcon: string;
    skyBg: string;
    skyIcon: string;
    slateBg: string;
    slateIcon: string;
  };
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  background: {
    default: string;
    paper: string;
    elevated: string;
    dark: string;
    translucentWhite: string;
    translucentWhiteLight: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    amber: string;
  };
  border: {
    light: string;
    main: string;
    dark: string;
    translucentWhite: string;
  };
  scanner: {
    bg: string;
    reticle: string;
    overlay: string;
    flashActive: string;
  };
  wallet: {
    gradient: string[];
    balanceBg: string;
    addMoneyBg: string;
    addMoneyBorder: string;
  };
}

export const colors = lightTheme.colors;

