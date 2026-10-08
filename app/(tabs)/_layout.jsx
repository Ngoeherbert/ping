import { Tabs } from "expo-router";
import BottomBar from "../../src/components/BottomBar";

// The layout for all tab screens: screens render above, BottomBar stays fixed.
export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="chats"
      tabBar={(props) => <BottomBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="updates" />
      <Tabs.Screen name="calls" />
      <Tabs.Screen name="reels" />
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
