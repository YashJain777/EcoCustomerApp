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
import { navigateGlobal } from '../../navigation/AppNavigator';

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
          } catch (err: any) {
            console.warn('[FCM] Could not register token with backend (network/offline):', err?.message || err);
          }
        }

        // 4. Topic Subscription for Customers
        await subscribeToTopic(messaging, 'topic_customers');
        console.log('[FCM] Subscribed customer to topic_customers');

        // 5. Handle Initial Notification (if app opened from quit state)
        const initialNotification = await getInitialNotification(messaging);
        if (initialNotification) {
          console.log('[FCM] App opened from quit state via notification:', initialNotification);
          navigateGlobal('MainTab', { screen: 'BookingsScreenTab' });
        }

        // 6. Handle Background Notification Tap
        unsubscribeOpenedApp = onNotificationOpenedApp(messaging, (remoteMessage: any) => {
          console.log('[FCM] Notification tapped in background:', remoteMessage);
          navigateGlobal('MainTab', { screen: 'BookingsScreenTab' });
        });

        // 7. Handle Foreground Message (Active App state when Customer is using app)
        unsubscribeForeground = onMessage(messaging, async (remoteMessage: any) => {
          console.log('[FCM] Foreground notification received:', remoteMessage);
          const title = remoteMessage.notification?.title || remoteMessage.data?.title || 'Notification Alert 🔔';
          const body = remoteMessage.notification?.body || remoteMessage.data?.body || '';
          const type = remoteMessage.data?.type || remoteMessage.data?.notificationType || 'GENERAL';

          if (title || body) {
            const isBookingCreatedPush =
              title.includes('Booking Request Created') ||
              title.includes('Complaint Created') ||
              body.includes('has been created successfully') ||
              body.includes('successfully registered') ||
              type === 'BOOKING_CREATED' ||
              type === 'COMPLAINT_CREATED';

            if (isBookingCreatedPush) {
              console.log('[FCM] Suppressed duplicate foreground creation push popup');
              return;
            }

            // Handle Notification Enum Types dynamically while user has the app open
            switch (type) {
              case 'SERVICE_COMPLETED':
                Alert.alert(
                  title || 'Service Completed! 🎉',
                  body || 'Your service job is completed successfully. Thank you for choosing SmartEco.',
                  [
                    { text: 'Later', style: 'cancel' },
                    {
                      text: 'Rate Service ⭐',
                      onPress: () => {
                        console.log('[FCM] Customer clicked Rate Service for job:', remoteMessage.data?.jobId);
                      },
                    },
                  ]
                );
                break;
              case 'REVIEW_REMINDER':
                Alert.alert(
                  title || 'Rate Your Service ⭐',
                  body || 'How was your experience? Tap to submit a rating & review.',
                  [
                    { text: 'Dismiss', style: 'cancel' },
                    { text: 'Write Review', onPress: () => {} },
                  ]
                );
                break;
              case 'COMPLAINT_CLOSED':
              case 'SERVICE_CLOSED':
                Alert.alert(
                  title || 'Service Ticket Closed ✅',
                  body || 'Your service complaint has been closed.',
                  [{ text: 'OK', style: 'cancel' }]
                );
                break;
              case 'SERVICE_CANCELLED':
                Alert.alert(
                  title || 'Service Cancelled ❌',
                  body || 'Your service booking has been cancelled.',
                  [{ text: 'OK', style: 'cancel' }]
                );
                break;
              case 'MECHANIC_ASSIGNED':
              case 'VISIT_SCHEDULED':
                Alert.alert(
                  title || 'Technician Update 🛠️',
                  body,
                  [{ text: 'View Details', onPress: () => {} }, { text: 'OK', style: 'cancel' }]
                );
                break;
              default:
                Alert.alert(title, body);
                break;
            }
          }
        });

        // 8. Token Refresh Listener
        unsubscribeTokenRefresh = onTokenRefresh(messaging, async (newToken: string) => {
          console.log('[FCM] Customer Token refreshed:', newToken);
          try {
            await axiosInstance.post('/v1/notifications/device-token', { token: newToken });
          } catch (e: any) {
            console.warn('[FCM] Token refresh update error:', e?.message || e);
          }
        });

      } catch (error: any) {
        console.warn('[FCM] Customer Setup warning:', error?.message || error);
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
