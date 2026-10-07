// app/(tabs)/_layout.jsx
import { Tabs } from "expo-router";
import { CustomTabBar } from "../src/components/ui/CustomTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="chats" options={{ title: "Chats" }} />
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="create" options={{ title: "Create" }} />
      <Tabs.Screen name="reels" options={{ title: "Reels" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}