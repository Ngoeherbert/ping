import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SHADOW, SPACING } from '@/lib/constants';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, destructive ? styles.destructiveButton : styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: SPACING.xl, ...SHADOW.lg },
  title: { color: COLORS.text, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.sm },
  message: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, lineHeight: 22, marginBottom: SPACING.xl },
  actions: { flexDirection: 'row', gap: SPACING.md },
  button: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelButton: { backgroundColor: COLORS.backgroundSecondary },
  confirmButton: { backgroundColor: COLORS.primary },
  destructiveButton: { backgroundColor: COLORS.error },
  cancelText: { color: COLORS.text, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  confirmText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
});
