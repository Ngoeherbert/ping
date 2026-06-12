import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_URL, COLORS } from './constants';

import type { Notification, NotificationResponse } from 'expo-notifications';

type NotificationsModule = typeof import('expo-notifications');
type DeviceModule = typeof import('expo-device');

let notificationHandlerConfigured = false;

function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

async function loadNotificationModules(): Promise<{
  Notifications: NotificationsModule;
  Device: DeviceModule;
} | null> {
  if (isExpoGo()) {
    return null;
  }

  const [Notifications, Device] = await Promise.all([
    import('expo-notifications'),
    import('expo-device'),
  ]);

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return { Notifications, Device };
}

export async function registerForPushNotifications(): Promise<string | null> {
  const modules = await loadNotificationModules();
  if (!modules) return null;

  const { Notifications, Device } = modules;
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: COLORS.primary,
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  await fetch(`${API_URL}/api/users/push-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }).catch(() => undefined);

  return token;
}

export function useNotificationListeners(
  onNotification: (notification: Notification) => void,
  onResponse: (response: NotificationResponse) => void,
) {
  let disposed = false;
  let cleanup: (() => void) | undefined;

  if (isExpoGo()) {
    return () => undefined;
  }

  import('expo-notifications').then((Notifications) => {
    if (disposed) return;

    const notificationListener = Notifications.addNotificationReceivedListener(onNotification);
    const responseListener = Notifications.addNotificationResponseReceivedListener(onResponse);

    cleanup = () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }).catch(() => undefined);

  return () => {
    disposed = true;
    cleanup?.();
  };
}
