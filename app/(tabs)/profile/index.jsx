import { ScrollView, Pressable, Text, View, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../src/theme/useTheme";
import Avatar from "../../../src/components/Avatar";
import GlassButton from "../../../src/components/GlassButton";
import GlassSurface from "../../../src/components/GlassSurface";
import {
  EditIcon,
  InfoCircleIcon,
  SettingsIcon,
  MoonIcon,
  SunIcon,
  LanguagesIcon2,
  ShieldIcon,
  CopyIcon,
  LinkIcon,
  LogOutIcon2,
} from "../../../src/components/Icons";

const USER = {
  name: "Wade Warren",
  handle: "@wadewarren",
  avatar: "https://i.pravatar.cc/150?img=47",
  bio: "Building things that matter. Coffee, code, and a little chaos.",
  location: "San Francisco, CA",
  website: "wadewarren.dev",
  joined: "Joined January 2022",
  stats: {
    posts: 142,
    followers: 843,
    following: 156,
  },
};

const SETTING_SECTIONS = [
  {
    id: "profile-section",
    data: [
      { id: "edit", label: "Edit Profile", Icon: EditIcon, scheme: null },
      { id: "view-archive", label: "Archived Chats", Icon: InfoCircleIcon, scheme: null },
      { id: "starred", label: "Starred Messages", Icon: CopyIcon, scheme: null },
    ],
  },
  {
    id: "preferences-section",
    data: [
      { id: "dark-mode", label: "Dark Mode", Icon: MoonIcon, scheme: null, showToggle: true },
      { id: "language", label: "Language", Icon: LanguagesIcon2, scheme: null },
      { id: "appearance", label: "Appearance", Icon: SunIcon, scheme: null },
    ],
  },
  {
    id: "privacy-section",
    data: [
      { id: "privacy", label: "Privacy", Icon: ShieldIcon, scheme: null },
      { id: "link-devices", label: "Link Devices", Icon: LinkIcon, scheme: null },
    ],
  },
  {
    id: "account-section",
    data: [
      { id: "logout", label: "Log Out", Icon: LogOutIcon2, scheme: "dark", labelColor: "#ff7a7a" },
    ],
  },
];

function StatItem({ label, value }) {
  const { colors } = useTheme();
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function SettingRow({ item }) {
  const { colors } = useTheme();
  const iconColor = item.labelColor ? item.labelColor : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={({ pressed }) =>
        StyleSheet.flatten([
          styles.settingRow,
          pressed ? { backgroundColor: colors.surface } : null,
        ])
      }
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.primarySoft }]}>
        <item.Icon color={colors.primary} size={22} />
      </View>
      <Text style={[styles.settingLabel, { color: iconColor }]}>{item.label}</Text>
      {item.showToggle && (
        <View style={[styles.toggle, { backgroundColor: colors.primary }]}>
          <View style={styles.toggleHandle} />
        </View>
      )}
      {!item.showToggle && <InfoChevron color={colors.textMuted} />}
    </Pressable>
  );
}

const InfoChevron = ({ color }) => {
  return (
    <View style={styles.chevron}>
      <View style={[styles.chevronBar, { backgroundColor: color }]} />
      <View style={[styles.chevronBar, styles.chevronBar2, { backgroundColor: color }]} />
    </View>
  );
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        <GlassButton size={44} label="Settings">
          <SettingsIcon color={colors.text} size={22} />
        </GlassButton>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Avatar uri={USER.avatar} name={USER.name} size={96} />
            <GlassButton
              size={40}
              style={{ position: "absolute", bottom: 0, right: 0 }}
              label="Change photo"
            >
              <EditIcon color={colors.text} size={20} />
            </GlassButton>
          </View>

          <Text style={[styles.userName, { color: colors.text }]}>{USER.name}</Text>
          <Text style={[styles.userHandle, { color: colors.textMuted }]}>{USER.handle}</Text>
          <Text style={[styles.userBio, { color: colors.text }]}>{USER.bio}</Text>

          <View style={styles.stats}>
            <StatItem label="Posts" value={USER.stats.posts} />
            <StatItem label="Followers" value={USER.stats.followers} />
            <StatItem label="Following" value={USER.stats.following} />
          </View>

          <Text style={[styles.userMeta, { color: colors.textMuted }]}>
            {USER.location} · {USER.website}
          </Text>
          <Text style={[styles.userMeta, { color: colors.textMuted }]}>{USER.joined}</Text>
        </View>

        {SETTING_SECTIONS.map((section) => (
          <GlassSurface
            key={section.id}
            style={[styles.section, { marginHorizontal: 16, marginVertical: 8 }]}
          >
            {section.data.map((item) => (
              <SettingRow key={item.id} item={item} />
            ))}
          </GlassSurface>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scroll: { flex: 1 },
  title: { fontSize: 26, fontWeight: "700" },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarWrap: { position: "relative", marginBottom: 16 },
  userName: { fontSize: 22, fontWeight: "700", marginTop: 8 },
  userHandle: { fontSize: 14, fontWeight: "500", marginTop: 2 },
  userBio: { fontSize: 14, textAlign: "center", marginTop: 14, paddingHorizontal: 40 },
  stats: { flexDirection: "row", gap: 32, marginTop: 20 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  userMeta: { fontSize: 13, marginTop: 4 },
  section: {
    borderRadius: 16,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: { fontSize: 15, fontWeight: "500", flex: 1 },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    padding: 2,
  },
  toggleHandle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    position: "absolute",
    right: 3,
    top: 2,
  },
  chevron: {
    width: 18,
    height: 18,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  chevronBar: {
    width: 8,
    height: 1.6,
    borderRadius: 1,
    transform: [{ rotate: "25deg" }],
  },
  chevronBar2: {
    position: "absolute",
    transform: [{ rotate: "-25deg" }],
  },
});
