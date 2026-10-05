import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import OverlayHost from '../src/components/overlays/OverlayHost';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="(modals)"
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen name="user/[id]" />
        </Stack>
        <OverlayHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}