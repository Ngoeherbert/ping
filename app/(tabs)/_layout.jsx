import { Tabs, router } from "expo-router";
import Icon from "../../src/components/Icon";
import { colors } from "../../src/theme";
import { haptic } from "../../src/utils/haptics";

const tabIcon = (name, extra = 0) => {
  function TabIcon({ color, size, focused }) {
    return (
      <Icon
        name={name}
        size={size + extra}
        color={color}
        strokeWidth={focused ? 2 : 1.5}
      />
    );
  }

  return TabIcon;
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
      screenListeners={{ tabPress: () => haptic.light() }}
    >
      <Tabs.Screen
        name="(home)"
        options={{ title: "Home", tabBarIcon: tabIcon("home") }}
      />
      <Tabs.Screen
        name="videos"
        options={{ title: "Videos", tabBarIcon: tabIcon("reel") }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: "", tabBarIcon: tabIcon("create", 10) }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            haptic.medium();
            router.push("/(modals)/create-sheet");
          },
        }}
      />
      <Tabs.Screen
        name="(chats)"
        options={{ title: "Chats", tabBarIcon: tabIcon("chats") }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{ title: "Profile", tabBarIcon: tabIcon("profile") }}
      />
    </Tabs>
  );
}
