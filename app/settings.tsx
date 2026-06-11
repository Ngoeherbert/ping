import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Eye,
  HelpCircle,
  Lock,
  LogOut,
  Shield,
  Trash2,
  UserX,
} from 'lucide-react-native';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

type SettingItem = {
  icon: ReactNode;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  danger?: boolean;
};

export default function SettingsScreen() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => undefined },
      ],
    );
  };

  const sections: Array<{ title: string; items: SettingItem[] }> = [
    {
      title: 'Account',
      items: [
        {
          icon: <Bell color={COLORS.primary} size={20} />,
          label: 'Push Notifications',
          toggle: true,
          toggleValue: notifications,
          onToggle: setNotifications,
        },
        {
          icon: <Lock color={COLORS.primary} size={20} />,
          label: 'Private Account',
          sublabel: 'Only approved followers see your posts',
          toggle: true,
          toggleValue: privateAccount,
          onToggle: setPrivateAccount,
        },
        {
          icon: <UserX color={COLORS.primary} size={20} />,
          label: 'Privacy Controls',
          sublabel: 'Read receipts, status visibility, and stealth tracking',
          onPress: () => router.push('/privacy-settings'),
        },
        {
          icon: <Shield color={COLORS.primary} size={20} />,
          label: 'Two-Factor Authentication',
          onPress: () => Alert.alert('Coming soon', 'Two-factor authentication is not available yet.'),
        },
        {
          icon: <Eye color={COLORS.primary} size={20} />,
          label: 'Change Password',
          onPress: () => Alert.alert('Coming soon', 'Password changes will be available soon.'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle color={COLORS.primary} size={20} />,
          label: 'Help & Support',
          onPress: () => Alert.alert('Help & Support', 'Support resources will be added soon.'),
        },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        {
          icon: <LogOut color={COLORS.error} size={20} />,
          label: 'Log Out',
          onPress: handleLogout,
          danger: true,
        },
        {
          icon: <Trash2 color={COLORS.error} size={20} />,
          label: 'Delete Account',
          onPress: handleDeleteAccount,
          danger: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.settingRow,
                    index < section.items.length - 1 && styles.settingRowBorder,
                  ]}
                  onPress={item.toggle ? undefined : item.onPress}
                  activeOpacity={item.toggle ? 1 : 0.7}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.iconWrapper}>{item.icon}</View>
                    <View style={styles.settingCopy}>
                      <Text style={[styles.settingLabel, item.danger && styles.dangerText]}>
                        {item.label}
                      </Text>
                      {item.sublabel && <Text style={styles.settingSubLabel}>{item.sublabel}</Text>}
                    </View>
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={item.toggleValue}
                      onValueChange={item.onToggle}
                      trackColor={{ false: COLORS.border, true: COLORS.primary }}
                      thumbColor={COLORS.white}
                    />
                  ) : (
                    <ChevronRight color={COLORS.textDisabled} size={18} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.version}>Ping v1.0.0</Text>
      </ScrollView>
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
  headerSpacer: { width: 30 },
  title: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  section: { marginTop: SPACING.xl, paddingHorizontal: SPACING.lg },
  sectionTitle: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textTertiary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCard: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingRowBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingCopy: { flex: 1, paddingRight: SPACING.md },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingLabel: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  dangerText: { color: COLORS.error },
  settingSubLabel: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
  version: { textAlign: 'center', color: COLORS.textDisabled, fontSize: 12, marginVertical: SPACING.xxl },
});
