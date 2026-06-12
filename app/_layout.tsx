import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { registerForPushNotifications } from '@/lib/notifications';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
    registerForPushNotifications();
  }, [initialize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="post/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="user/[id]" />
            <Stack.Screen name="messages/[id]" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="story-viewer" options={{ presentation: 'modal' }} />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="followers/[id]" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="qr-profile" />
            <Stack.Screen name="privacy-settings" />
            <Stack.Screen name="games/[id]" options={{ presentation: 'modal' }} />
          </Stack>
        </AuthGuard>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
