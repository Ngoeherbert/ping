// components/CustomTabBar.jsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Icons } from "../Icon";
import { useRouter } from "expo-router";
import { colors } from "../../theme/colors";



// Temporary hardcoded badges. Later, drive these from your Zustand store.
const BADGES = { chats: 3 };

export function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const onReels = state.routes[state.index].name === "reels";
  const theme = onReels ? colors.reels : colors.light;

  return (
    <BlurView
      intensity={onReels ? 0 : 60}
      tint="light"
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;
        const badge = BADGES[route.name];
        const isCreate = route.name === "create";
        const color = focused ? theme.active : theme.inactive;

        const onPress = () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

          if (isCreate) {
            router.push("/create-modal");
            return;
          }

          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab}>
            <View>
              <Icons name={route.name} size={isCreate ? 32 : 26} color={color} active={focused} />
              {badge ? (
                <View style={[styles.badge, { backgroundColor: colors.light.badge }]}>
                  <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center", gap: 2 },
  label: { fontSize: 10, fontWeight: "500" },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});