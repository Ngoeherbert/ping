import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { BORDER_RADIUS, COLORS, FONT_SIZE, FONT_WEIGHT, SHADOW, SPACING } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

const PROFILE_BASE_URL = process.env.EXPO_PUBLIC_PROFILE_BASE_URL ?? 'https://ping.app/u';

export default function QRProfileScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const profileUrl = `${PROFILE_BASE_URL}/${user?.username ?? ''}`;

  const handleShare = async () => {
    await Share.share({
      message: `Follow me on Ping! ${profileUrl}`,
      url: profileUrl,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>My QR Code</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <Share2 color={COLORS.primary} size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.qrWrapper}>
          <QRCode value={profileUrl} size={220} color={COLORS.text} backgroundColor={COLORS.white} />
        </View>
        <Text style={styles.name}>{user?.name ?? 'Ping User'}</Text>
        <Text style={styles.username}>@{user?.username ?? 'username'}</Text>
        <Text style={styles.hint}>Scan to follow on Ping</Text>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Share2 color={COLORS.white} size={18} />
        <Text style={styles.shareButtonText}>Share Profile Link</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
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
  title: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 24,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xxl,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOW.md,
  },
  qrWrapper: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.xl,
  },
  name: { fontSize: 22, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.text, marginBottom: SPACING.xs },
  username: { fontSize: FONT_SIZE.md, color: COLORS.textTertiary, marginBottom: SPACING.md },
  hint: { fontSize: FONT_SIZE.sm, color: COLORS.textDisabled },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    paddingVertical: FONT_SIZE.md,
    justifyContent: 'center',
  },
  shareButtonText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
});
