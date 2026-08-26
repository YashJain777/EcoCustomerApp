/**
 * @file useNotificationSetup.ts
 * @layer Core / Hooks
 * @responsibility Initializes FCM, registers customer device token with backend (/v1/notifications/device-token),
 *   subscribes to topic_customers, and handles foreground & background notification events.
 */

import { useEffect } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import {
  getMessaging,
  requestPermission,
  getToken,
  subscribeToTopic,
  getInitialNotification,
  onNotificationOpenedApp,
  onMessage,
  onTokenRefresh,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { axiosInstance, getAuthToken } from '@infrastructure/api/axiosInstance';

export const useNotificationSetup = () => {
  useEffect(() => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      return;
    }

    let unsubscribeForeground: (() => void) | null = null;
    let unsubscribeOpenedApp: (() => void) | null = null;
    let unsubscribeTokenRefresh: (() => void) | null = null;

    async function initNotifications() {
      try {
        const messaging = getMessaging();

        // 1. Android 13+ Permission Request
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('[FCM] Android 13 notification permission denied');
          }
        }

        // 2. Firebase Messaging Permission
        const authStatus = await requestPermission(messaging);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.warn('[FCM] Messaging authorization status not enabled:', authStatus);
          return;
        }

        // 3. Get FCM Token & Send to Backend
        const fcmToken = await getToken(messaging);
        if (fcmToken) {
          console.log('[FCM] Generated Customer Device Token:', fcmToken);
          try {
            await axiosInstance.post('/v1/notifications/device-token', { token: fcmToken });
            console.log('[FCM] Customer Device Token registered with backend successfully');
          } catch (err) {
            console.error('[FCM] Error registering token with backend:', err);
          }
        }

        // 4. Topic Subscription for Customers
        await subscribeToTopic(messaging, 'topic_customers');
        console.log('[FCM] Subscribed customer to topic_customers');

        // 5. Handle Initial Notification (if app opened from quit state)
        const initialNotification = await getInitialNotification(messaging);
        if (initialNotification) {
          console.log('[FCM] App opened from quit state via notification:', initialNotification);
        }

        // 6. Handle Background Notification Tap
        unsubscribeOpenedApp = onNotificationOpenedApp(messaging, (remoteMessage: any) => {
          console.log('[FCM] Notification tapped in background:', remoteMessage);
        });

        // 7. Handle Foreground Message (Active App state)
        unsubscribeForeground = onMessage(messaging, async (remoteMessage: any) => {
          console.log('[FCM] Foreground notification received:', remoteMessage);
          const title = remoteMessage.notification?.title || 'New Notification 🔔';
          const body = remoteMessage.notification?.body || '';

          if (title || body) {
            Alert.alert(title, body);
          }
        });

        // 8. Token Refresh Listener
        unsubscribeTokenRefresh = onTokenRefresh(messaging, async (newToken: string) => {
          console.log('[FCM] Customer Token refreshed:', newToken);
          try {
            await axiosInstance.post('/v1/notifications/device-token', { token: newToken });
          } catch (e) {
            console.error('[FCM] Token refresh update error:', e);
          }
        });

      } catch (error) {
        console.error('[FCM] Customer Setup failed:', error);
      }
    }

    initNotifications();

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
      if (unsubscribeOpenedApp) unsubscribeOpenedApp();
      if (unsubscribeTokenRefresh) unsubscribeTokenRefresh();
    };
  }, []);
};
