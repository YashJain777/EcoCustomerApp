import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import { name as appName } from './package.json';

AppRegistry.registerComponent(appName, () => require('./App').default);

try {
  const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
  const messaging = getMessaging();
  setBackgroundMessageHandler(messaging, async (remoteMessage) => {
    console.log('[FCM Background] Customer push notification received:', remoteMessage);
  });
} catch (e) {
  console.warn('[FCM Background] Failed to register background message handler:', e);
}
