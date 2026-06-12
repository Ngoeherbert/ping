import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, MessageSquare, UserX } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToast } from '@/components/ui/Toast';
import { API_URL, BORDER_RADIUS, COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/lib/constants';
import { apiFetch } from '@/lib/apiFetch';
import { usePrivacyStore } from '@/store/privacyStore';
import type { StatusVisibility, UserProfile } from '@/types';

const STATUS_OPTIONS: Array<{ label: string; value: StatusVisibility; description: string }> = [
  { label: 'Everyone', value: 'everyone', description: 'Followers and public viewers can see stories' },
  { label: 'Followers', value: 'followers', description: 'Only followers can see stories' },
  { label: 'No one', value: 'none', description: 'Hide all stories from viewers' },
];

export default function PrivacySettingsScreen() {
  const {
    settings,
    receiptExceptions,
    statusBlocks,
    isLoading,
    fetchPrivacy,
    updateSettings,
    hideReceiptFromUser,
    restoreReceiptForUser,
    blockStatusForUser,
    unblockStatusForUser,
  } = usePrivacyStore();
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchPrivacy().catch(() => showToast({ type: 'error', title: 'Privacy unavailable', message: 'Showing safe default settings.' }));
    loadFollowers();
  }, [fetchPrivacy]);

  const loadFollowers = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/users/me/followers`);
      const data = (await res.json()) as { users?: UserProfile[] };
      setFollowers(data.users ?? []);
    } catch {
      setFollowers([]);
    }
  };

  if (!settings && isLoading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft color={COLORS.text} size={22} />
          </TouchableOpacity>
          <Text style={styles.title}>Privacy</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Privacy settings unavailable</Text>
          <Text style={styles.emptyText}>Please check your connection and try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Messages</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: `${COLORS.primary}20` }]}> 
                  <MessageSquare color={COLORS.primary} size={18} />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingLabel}>Read Receipts</Text>
                  <Text style={styles.settingDesc}>Let others see when you've read messages</Text>
                </View>
              </View>
              <Switch
                value={settings.readReceiptsEnabled}
                onValueChange={(value) => updateSettings({ readReceiptsEnabled: value })}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status / Stories</Text>
          <View style={styles.card}>
            {STATUS_OPTIONS.map((option, index) => {
              const selected = settings.statusVisibility === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.statusRow, index < STATUS_OPTIONS.length - 1 && styles.rowBorder]}
                  onPress={() => updateSettings({ statusVisibility: option.value })}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]} />
                  <View style={styles.settingCopy}>
                    <Text style={styles.settingLabel}>{option.label}</Text>
                    <Text style={styles.settingDesc}>{option.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <PrivacyFollowerSection
          title="Hide Read Receipts From"
          hint="These people can't see when you read their messages. Stealth tracking still records that messages were viewed."
          followers={followers}
          icon={<Eye color={COLORS.primary} size={18} />}
          isEnabled={(id) => receiptExceptions.some((exception) => exception.targetUserId === id)}
          onToggle={(id, value) =>
            value ? hideReceiptFromUser(id) : restoreReceiptForUser(id)
          }
        />

        <PrivacyFollowerSection
          title="Hide Status From"
          hint="These users cannot view your stories or status, and they won't know they're blocked."
          followers={followers}
          icon={<UserX color={COLORS.primary} size={18} />}
          isEnabled={(id) => statusBlocks.some((block) => block.blockedUserId === id)}
          onToggle={(id, value) =>
            value ? blockStatusForUser(id) : unblockStatusForUser(id)
          }
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Stealth tracking records message and status views privately for the owner even when visible read receipts are hidden.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrivacyFollowerSection({
  title,
  hint,
  followers,
  icon,
  isEnabled,
  onToggle,
}: {
  title: string;
  hint: string;
  followers: UserProfile[];
  icon: ReactNode;
  isEnabled: (id: string) => boolean;
  onToggle: (id: string, value: boolean) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionHint}>{hint}</Text>
      <View style={styles.card}>
        {followers.map((follower, index) => (
          <View key={follower.id} style={[styles.userRow, index < followers.length - 1 && styles.rowBorder]}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: follower.avatarUrl ?? undefined }} style={styles.userAvatar} />
              <View style={styles.miniIcon}>{icon}</View>
            </View>
            <View style={styles.userCopy}>
              <Text style={styles.userName}>{follower.name}</Text>
              <Text style={styles.userUsername}>@{follower.username}</Text>
            </View>
            <Switch
              value={isEnabled(follower.id)}
              onValueChange={(value) => onToggle(follower.id, value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        ))}
        {!followers.length && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyRowText}>No followers yet</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 13,
    backgroundColor: COLORS.background,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerButton: { padding: SPACING.xs },
  headerSpacer: { width: 30 },
  title: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  section: { marginTop: SPACING.xl, paddingHorizontal: SPACING.lg },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textTertiary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionHint: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginBottom: 10, lineHeight: 17 },
  card: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingCopy: { flex: 1 },
  iconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingLabel: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  settingDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginTop: 2, lineHeight: 17 },
  statusRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.border, marginRight: 12 },
  radioSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  avatarWrap: { position: 'relative', marginRight: 12 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.border },
  miniIcon: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCopy: { flex: 1 },
  userName: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  userUsername: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginTop: 2 },
  emptyRow: { paddingVertical: 20, alignItems: 'center' },
  emptyRowText: { color: COLORS.textDisabled, fontSize: FONT_SIZE.sm },
  infoBox: {
    margin: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyTitle: { color: COLORS.text, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.sm },
  emptyText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, textAlign: 'center' },
  infoText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 19 },
});
