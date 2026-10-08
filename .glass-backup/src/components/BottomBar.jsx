import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/useTheme";
import {
  UpdateIcon,
  CallsIcon,
  ReelsIcon,
  ChatsIcon,
  ProfileIcon,
} from "./Icons";

const TABS = {
  updates: { label: "Updates", Icon: UpdateIcon },
  calls: { label: "Calls", Icon: CallsIcon },
  reels: { label: "Reels", Icon: ReelsIcon },
  chats: { label: "Chats", Icon: ChatsIcon },
  profile: { label: "Profile", Icon: ProfileIcon },
};

export default function BottomBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const segments = useSegments();

  // Only show the bar on a tab's root screen: ["(tabs)", "chats"].
  // Anything deeper (e.g. ["(tabs)", "chats", "[id]"]) hides it.
  if (segments[0] === "(tabs)" && segments.length > 2) return null;

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;

        const focused = state.index === index;
        const color = focused ? colors.primary : colors.textMuted;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () =>
          navigation.emit({ type: "tabLongPress", target: route.key });

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.item}
          >
            <View
              style={[
                styles.iconPill,
                focused && { backgroundColor: colors.primarySoft },
              ]}
            >
              <tab.Icon color={color} size={22} filled={focused} />
            </View>
            <Text style={[styles.label, { color }, focused && styles.labelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: "center", gap: 3, paddingBottom: 6 },
  iconPill: {
    width: 54,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 11.5, fontWeight: "500" },
  labelActive: { fontWeight: "700" },
});
