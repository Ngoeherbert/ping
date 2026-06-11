import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';

type EditProfileForm = {
  name: string;
  username: string;
  bio: string;
  website: string;
  location: string;
  avatarUrl: string;
  coverUrl: string;
  isPrivate: boolean;
};

type FieldConfig = {
  label: string;
  key: keyof Pick<EditProfileForm, 'name' | 'username' | 'bio' | 'website' | 'location'>;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

const fields: FieldConfig[] = [
  { label: 'Full Name', key: 'name' },
  { label: 'Username', key: 'username' },
  { label: 'Bio', key: 'bio', multiline: true },
  { label: 'Website', key: 'website', keyboardType: 'url' },
  { label: 'Location', key: 'location' },
];

export default function EditProfileScreen() {
  const { user } = useAuthStore();
  const { updateProfile, profiles } = useProfileStore();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const profile = user?.id ? profiles[user.id] : null;

  const [form, setForm] = useState<EditProfileForm>({
    name: user?.name ?? '',
    username: user?.username ?? '',
    bio: profile?.bio ?? '',
    website: profile?.website ?? '',
    location: profile?.location ?? '',
    avatarUrl: user?.avatarUrl ?? '',
    coverUrl: profile?.coverUrl ?? '',
    isPrivate: Boolean(profile?.isPrivate ?? user?.isPrivate),
  });

  useEffect(() => {
    setForm({
      name: profile?.name ?? user?.name ?? '',
      username: profile?.username ?? user?.username ?? '',
      bio: profile?.bio ?? '',
      website: profile?.website ?? '',
      location: profile?.location ?? '',
      avatarUrl: profile?.avatarUrl ?? user?.avatarUrl ?? '',
      coverUrl: profile?.coverUrl ?? '',
      isPrivate: Boolean(profile?.isPrivate ?? user?.isPrivate),
    });
  }, [profile, user]);

  const pickImage = async (aspect: [number, number], key: 'avatarUrl' | 'coverUrl') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect,
      quality: 0.8,
    });

    if (!result.canceled) {
      setForm((current) => ({ ...current, [key]: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Name is required.');
      return;
    }
    if (!form.username.trim()) {
      Alert.alert('Error', 'Username is required.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        username: form.username.trim(),
        bio: form.bio.trim(),
        website: form.website.trim(),
        location: form.location.trim(),
        avatarUrl: form.avatarUrl,
        coverUrl: form.coverUrl,
        isPrivate: form.isPrivate,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => pickImage([3, 1], 'coverUrl')}
          style={styles.coverWrapper}
          activeOpacity={0.85}
        >
          {form.coverUrl ? (
            <Image source={{ uri: form.coverUrl }} style={styles.cover} />
          ) : (
            <View style={styles.cover} />
          )}
          <View style={styles.coverOverlay}>
            <Camera color={COLORS.white} size={22} />
            <Text style={styles.changePhotoText}>Change Cover</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => pickImage([1, 1], 'avatarUrl')}
          style={styles.avatarWrapper}
          activeOpacity={0.85}
        >
          {form.avatarUrl ? (
            <Image source={{ uri: form.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <View style={styles.avatarOverlay}>
            <Camera color={COLORS.white} size={16} />
          </View>
        </TouchableOpacity>

        <View style={styles.formSection}>
          {fields.map(({ label, key, multiline, keyboardType }) => (
            <View key={key} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
                value={form[key]}
                onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
                multiline={multiline}
                keyboardType={keyboardType ?? 'default'}
                autoCapitalize={key === 'username' || key === 'website' ? 'none' : 'sentences'}
                placeholder={`Enter ${label.toLowerCase()}`}
                placeholderTextColor={COLORS.textDisabled}
              />
            </View>
          ))}
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingLabel}>Private Account</Text>
            <Text style={styles.settingDesc}>Only approved followers can see your posts</Text>
          </View>
          <Switch
            value={form.isPrivate}
            onValueChange={(isPrivate) => setForm((current) => ({ ...current, isPrivate }))}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerButton: { padding: SPACING.xs },
  title: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 18,
    paddingVertical: SPACING.sm,
    minWidth: 64,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  coverWrapper: { height: 130, position: 'relative' },
  cover: { width: '100%', height: '100%', backgroundColor: COLORS.border },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  changePhotoText: { color: COLORS.white, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginLeft: 20,
    marginTop: -45,
    borderWidth: 3,
    borderColor: COLORS.white,
    position: 'relative',
    zIndex: 10,
    marginBottom: SPACING.lg,
  },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: COLORS.border },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  formSection: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  fieldRow: { paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  fieldLabel: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textTertiary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: { fontSize: FONT_SIZE.md, color: COLORS.text, paddingVertical: 0 },
  fieldInputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 8,
    borderTopColor: COLORS.backgroundSecondary,
    marginTop: SPACING.sm,
  },
  settingText: { flex: 1, paddingRight: SPACING.md },
  settingLabel: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  settingDesc: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
});
