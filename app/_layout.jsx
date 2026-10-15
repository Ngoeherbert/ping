import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { LogBox } from "react-native";

// expo-video probes each remote clip for subtitle tracks. For plain MP4s with no
// captions (our sample clips), its iOS AVFoundation probe throws -1102 and logs
// "Failed to load available subtitle tracks …". Playback is unaffected and we
// never read the subtitle API, so suppress just that message to keep logs clean.
LogBox.ignoreLogs([/Failed to load available subtitle tracks/i]);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
