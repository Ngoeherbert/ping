import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="post/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="user/[id]" />
          <Stack.Screen name="messages/[id]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="followers/[id]" />
          <Stack.Screen name="settings" />
        </Stack>
      </AuthGuard>
    </GestureHandlerRootView>
  );
}
