import { Tabs, router } from "expo-router";
import {
  Home01Icon,
  PlayCircleIcon,
  AddCircleIcon,
  BubbleChatIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import Icon from "../../src/components/Icon";
import { colors } from "../../src/theme";
import { haptic } from "../../src/utils/haptics";

const tabIcon =
  (icon, extra = 0) =>
  ({ color, size, focused }) => (
    <Icon
      icon={icon}
      size={size + extra}
      color={color}
      strokeWidth={focused ? 2 : 1.5}
    />
  );

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
        options={{ title: "Home", tabBarIcon: tabIcon(Home01Icon) }}
      />
      <Tabs.Screen
        name="videos"
        options={{ title: "Videos", tabBarIcon: tabIcon(PlayCircleIcon) }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: "", tabBarIcon: tabIcon(AddCircleIcon, 10) }}
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
        options={{ title: "Chats", tabBarIcon: tabIcon(BubbleChatIcon) }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{ title: "Profile", tabBarIcon: tabIcon(UserIcon) }}
      />
    </Tabs>
  );
}
