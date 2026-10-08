import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/useTheme";
import GlassSurface from "./GlassSurface";
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

// Floating glass tab bar. It sits over the screen content, so scrolling lists
// need bottom padding of about insets.bottom + 110 (the chats list has it).
export default function BottomBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const segments = useSegments();

  // Only show the bar on a tab's root screen: ["(tabs)", "chats"].
  // Anything deeper (e.g. ["(tabs)", "chats", "[id]"]) hides it.
  if (segments[0] === "(tabs)" && segments.length > 2) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <GlassSurface style={styles.bar}>
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
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: "row",
    borderRadius: 34,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: "center", gap: 3 },
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
