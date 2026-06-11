import { Eye, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL, COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/lib/constants';

interface Viewer {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  viewedAt: string | Date;
}

interface Props {
  storyId: string;
  viewsCount: number;
}

export function StoryViewersList({ storyId, viewsCount }: Props) {
  const [visible, setVisible] = useState(false);
  const [viewers, setViewers] = useState<Viewer[]>([]);

  const loadViewers = async () => {
    const res = await fetch(`${API_URL}/api/stories/${storyId}/viewers`);
    const data = (await res.json()) as { viewers?: Viewer[] };
    setViewers(data.viewers ?? []);
  };

  const open = () => {
    loadViewers();
    setVisible(true);
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={open}>
        <Eye color={COLORS.white} size={16} />
        <Text style={styles.triggerText}>{viewsCount}</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Viewed by {viewers.length}</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <X color={COLORS.text} size={22} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={viewers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.viewerRow}>
                <Image source={{ uri: item.avatarUrl ?? undefined }} style={styles.viewerAvatar} />
                <View style={styles.viewerInfo}>
                  <Text style={styles.viewerName}>{item.name}</Text>
                  <Text style={styles.viewerTime}>
                    {new Date(item.viewedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Eye color={COLORS.textDisabled} size={14} />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  triggerText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.text },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderLight,
  },
  viewerAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: COLORS.border },
  viewerInfo: { flex: 1 },
  viewerName: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm, color: COLORS.text },
  viewerTime: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
});
