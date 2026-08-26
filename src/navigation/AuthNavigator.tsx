import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '@features/onboarding/screens/SplashScreen';
import { CustomerLoginScreen } from '@features/auth/screens/CustomerLoginScreen';
import { CustomerOtpVerifyScreen } from '@features/auth/screens/CustomerOtpVerifyScreen';
import { AuthStackParamList } from './types/navigation.types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="CustomerLoginScreen" component={CustomerLoginScreen} />
      <Stack.Screen name="CustomerOtpVerifyScreen" component={CustomerOtpVerifyScreen} />
    </Stack.Navigator>
  );
};
