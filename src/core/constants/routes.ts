export const ROUTES = {
  AUTH: {
    LOGIN: 'CustomerLoginScreen',
    VERIFY_OTP: 'CustomerOtpVerifyScreen',
    REGISTER: 'CustomerRegisterScreen',
  },
  MAIN_TAB: {
    HOME: 'HomeScreenTab',
    PRODUCTS: 'MyProductsScreenTab',
    BOOKINGS: 'BookingsScreenTab',
    AMC: 'AmcPlansScreen',
    PROFILE: 'ProfileScreenTab',
  },
  PRODUCTS: {
    LIST: 'MyProductsList',
    DETAIL: 'ProductDetailScreen',
    SCAN_QR: 'CustomerQRScanScreen',
  },
  BOOKINGS: {
    SERVICE_CATALOG: 'ServiceCatalogScreen',
    AVAILABLE_SHOPS: 'AvailableShopsScreen',
    CREATE_BOOKING: 'CreateBookingScreen',
    HISTORY: 'BookingHistoryScreen',
    DETAIL: 'BookingDetailScreen',
  },
  COMPLAINTS: {
    RAISE: 'RaiseComplaintScreen',
    LIST: 'ComplaintsListScreen',
    DETAIL: 'ComplaintDetailScreen',
  },
  AMC: {
    PLANS: 'AmcPlansScreen',
    MY_SUBSCRIPTIONS: 'MyAmcSubscriptionsScreen',
    DETAIL: 'AmcDetailScreen',
  },
  PROFILE: {
    VIEW: 'CustomerProfileView',
    EDIT: 'EditProfileScreen',
    ADDRESSES: 'CustomerAddressesScreen',
  },
  NOTIFICATIONS: 'NotificationCenterScreen',
  SUPPORT: 'HelpSupportScreen',
  TERMS_CONDITIONS: 'TermsConditionsScreen',
} as const;
