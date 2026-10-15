import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "./Avatar";
import Icon from "./icons";

// Bottom sheet listing everyone who viewed a story (open from your own story).
//
//   <StoryViewersSheet
//     visible={viewing}
//     colors={colors}
//     viewers={story.viewers ?? []}
//     onClose={() => setViewing(false)}
//   />
//
// Each viewer is `{ id, name, avatar, time?, reaction? }` - `reaction` is an
// emoji string shown beside the viewer when they reacted.
export default function StoryViewersSheet({
  visible,
  viewers = [],
  colors,
  onClose,
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* Tap outside the sheet to close */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close viewers"
        />

        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.handle,
              { backgroundColor: colors.border ?? "rgba(128,128,128,0.35)" },
            ]}
          />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Viewers</Text>
            <Text style={[styles.count, { color: colors.textMuted }]}>
              {viewers.length}
            </Text>
            <View style={styles.spacer} />
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close viewers"
              hitSlop={10}
              style={styles.closeBtn}
            >
              <Icon name="close" color={colors.text} size={20} />
            </Pressable>
          </View>

          <FlatList
            data={viewers}
            keyExtractor={(v) => v.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.textMuted }]}>
                No views yet
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Avatar
                  uri={item.avatar}
                  name={item.name}
                  size={40}
                  online={false}
                />
                <View style={styles.rowMeta}>
                  <Text
                    style={[styles.rowName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.time ? (
                    <Text style={[styles.rowTime, { color: colors.textMuted }]}>
                      {item.time}
                    </Text>
                  ) : null}
                </View>
                {item.reaction ? (
                  <Text
                    style={styles.reaction}
                    accessibilityLabel={`Reaction ${item.reaction}`}
                  >
                    {item.reaction}
                  </Text>
                ) : null}
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  // floating card: never full width, capped on tablets
  sheet: {
    width: "92%",
    maxWidth: 420,
    alignSelf: "center",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 6,
  },
  title: { fontSize: 17, fontWeight: "700" },
  count: { fontSize: 15, fontWeight: "600" },
  spacer: { flex: 1 },
  closeBtn: { padding: 4 },
  list: { maxHeight: 420 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  rowMeta: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: "600" },
  rowTime: { fontSize: 12.5 },
  reaction: { fontSize: 22 },
  empty: { textAlign: "center", paddingVertical: 28, fontSize: 14.5 },
});