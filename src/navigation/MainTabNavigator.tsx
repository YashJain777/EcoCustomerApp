import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomerHomeScreen } from '@features/dashboard/screens/CustomerHomeScreen';
import { MyProductsScreen } from '@features/products/screens/MyProductsScreen';
import { CustomerQRScanScreen } from '@features/products/screens/CustomerQRScanScreen';
import { MyComplaintsScreen } from '@features/complaints/screens/MyComplaintsScreen';
import { SettingsScreen } from '@features/settings/screens/SettingsScreen';
import { MainTabParamList } from './types/navigation.types';
import { useTheme } from '@theme/index';
import { AppIcon } from '@shared/components/atoms/Icon';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;

  const styles = React.useMemo(() => makeStyles(colors, bottomInset), [colors, bottomInset]);

  return (
    <Tab.Navigator
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.cta.main,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          let iconName = 'home-outline';
          let isScan = false;

          if (route.name === 'HomeScreenTab') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'MyProductsScreenTab') iconName = focused ? 'cube' : 'cube-outline';
          if (route.name === 'CustomerQRScanScreenTab') {
            iconName = 'qr-code-outline';
            isScan = true;
          }
          if (route.name === 'BookingsScreenTab') iconName = focused ? 'construct' : 'construct-outline';
          if (route.name === 'ProfileScreenTab') iconName = focused ? 'person' : 'person-outline';

          if (isScan) {
            return (
              <View style={styles.scanFab}>
                <AppIcon name="qr-code-outline" size={24} color={colors.text.inverse} />
              </View>
            );
          }

          return <AppIcon name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeScreenTab"
        component={CustomerHomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="MyProductsScreenTab"
        component={MyProductsScreen}
        options={{ title: 'Products' }}
      />
      <Tab.Screen
        name="CustomerQRScanScreenTab"
        component={CustomerQRScanScreen}
        options={{ title: 'Scan' }}
      />
      <Tab.Screen
        name="BookingsScreenTab"
        component={MyComplaintsScreen}
        options={{ title: 'Service' }}
      />
      <Tab.Screen
        name="ProfileScreenTab"
        component={SettingsScreen}
        options={{ title: 'Account' }}
      />
    </Tab.Navigator>
  );
};

const makeStyles = (colors: any, bottomInset: number) =>
  StyleSheet.create({
    tabBar: {
      backgroundColor: colors.background.paper,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      height: 56 + bottomInset,
      paddingBottom: bottomInset,
      paddingTop: 6,
      elevation: 8,
      shadowColor: colors.neutral[900],
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
    },
    tabLabel: {
      fontSize: 11,
      fontWeight: '600',
    },
    scanFab: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.cta.main,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -20,
      elevation: 4,
      shadowColor: colors.cta.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
  });

