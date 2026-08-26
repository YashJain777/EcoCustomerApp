export type AuthStackParamList = {
  SplashScreen: undefined;
  OnboardingSplashScreen?: undefined;
  CustomerLoginScreen: undefined;
  CustomerOtpVerifyScreen: { mobile: string; devHint?: string };
  CustomerRegisterScreen: { mobile?: string };
};

export type MainTabParamList = {
  HomeScreenTab: undefined;
  MyProductsScreenTab: undefined;
  CustomerQRScanScreenTab: undefined;
  BookingsScreenTab: undefined;
  ProfileScreenTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTab: undefined;
  ProductDetailScreen: { product?: any };
  CustomerQRScanScreen: undefined;
  BookServiceScreen: undefined;
  ExternalProductBookingScreen: { initialCategoryId?: string } | undefined;
  MyComplaintsScreen: undefined;
  ComplaintDetailScreen: { ticket?: any };
  AmcPlansScreen: undefined;
  WalletScreen: undefined;
  NotificationCenterScreen: undefined;
  HelpSupportScreen: undefined;
  SettingsScreen: undefined;
  EditProfileScreen: undefined;
  BookingsScreenTab: undefined;
  MyProductsScreenTab: undefined;
  AboutAppScreen: undefined;
  TermsConditionsScreen: undefined;
  SavedAddressesScreen: undefined;
  SubmitReviewScreen: {
    jobId: string;
    jobType: 'SERVICE_JOB' | 'INSTALLATION';
    description?: string;
    mechanicName?: string;
  };
  MyReviewsScreen: undefined;
};
