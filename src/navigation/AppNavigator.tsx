import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { ProductDetailScreen } from '@features/products/screens/ProductDetailScreen';
import { MyProductsScreen } from '@features/products/screens/MyProductsScreen';
import { CustomerQRScanScreen } from '@features/products/screens/CustomerQRScanScreen';
import { BookServiceScreen } from '@features/bookings/screens/BookServiceScreen';
import { ExternalProductBookingScreen } from '@features/bookings/screens/ExternalProductBookingScreen';
import { MyComplaintsScreen } from '@features/complaints/screens/MyComplaintsScreen';
import { ComplaintDetailScreen } from '@features/complaints/screens/ComplaintDetailScreen';
import { AmcPlansScreen } from '@features/amc/screens/AmcPlansScreen';
import { WalletScreen } from '@features/wallet/screens/WalletScreen';
import { NotificationCenterScreen } from '@features/notifications/screens/NotificationCenterScreen';
import { HelpSupportScreen } from '@features/support/screens/HelpSupportScreen';
import { SettingsScreen } from '@features/settings/screens/SettingsScreen';
import { EditProfileScreen } from '@features/settings/screens/EditProfileScreen';
import { AboutAppScreen } from '@features/support/screens/AboutAppScreen';
import { TermsConditionsScreen } from '@features/support/screens/TermsConditionsScreen';
import { SavedAddressesScreen } from '@features/settings/screens/SavedAddressesScreen';
import { SubmitReviewScreen, MyReviewsScreen } from '@features/reviews';
import { RootStackParamList } from './types/navigation.types';
import { getAuthToken } from '@infrastructure/api/axiosInstance';
import { useNotificationSetup } from '@core/hooks/useNotificationSetup';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  useNotificationSetup();
  // Always boot to Auth stack so SplashScreen executes enterprise animation & token check
  const [initialRoute] = useState<'Auth' | 'MainTab'>('Auth');

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="MainTab" component={MainTabNavigator} />
        <Stack.Screen name="ProductDetailScreen" component={ProductDetailScreen} />
        <Stack.Screen name="CustomerQRScanScreen" component={CustomerQRScanScreen} />
        <Stack.Screen name="BookServiceScreen" component={BookServiceScreen} />
        <Stack.Screen name="ExternalProductBookingScreen" component={ExternalProductBookingScreen} />
        <Stack.Screen name="MyComplaintsScreen" component={MyComplaintsScreen} />
        <Stack.Screen name="BookingsScreenTab" component={MyComplaintsScreen} />
        <Stack.Screen name="MyProductsScreenTab" component={MyProductsScreen} />
        <Stack.Screen name="ComplaintDetailScreen" component={ComplaintDetailScreen} />
        <Stack.Screen name="AmcPlansScreen" component={AmcPlansScreen} />
        <Stack.Screen name="WalletScreen" component={WalletScreen} />
        <Stack.Screen name="NotificationCenterScreen" component={NotificationCenterScreen} />
        <Stack.Screen name="HelpSupportScreen" component={HelpSupportScreen} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="AboutAppScreen" component={AboutAppScreen} />
        <Stack.Screen name="TermsConditionsScreen" component={TermsConditionsScreen} />
        <Stack.Screen name="SavedAddressesScreen" component={SavedAddressesScreen} />
        <Stack.Screen name="SubmitReviewScreen" component={SubmitReviewScreen} />
        <Stack.Screen name="MyReviewsScreen" component={MyReviewsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
