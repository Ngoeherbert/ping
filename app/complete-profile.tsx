import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/lib/constants';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';

export default function CompleteProfileScreen() {
  const { user } = useAuthStore();
  const { updateProfile } = useProfileStore();
  const { showToast } = useToast();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUrl(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name.trim() || !username.trim()) {
      showToast({ type: 'error', title: 'Profile incomplete', message: 'Name and username are required.' });
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({ name: name.trim(), username: username.trim(), bio: bio.trim(), avatarUrl });
      showToast({ type: 'success', title: 'Profile completed' });
      router.replace('/(tabs)');
    } catch {
      showToast({ type: 'error', title: 'Unable to save profile', message: 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>Add a photo and a few details so friends recognize you.</Text>

        <TouchableOpacity style={styles.avatarButton} onPress={pickAvatar} activeOpacity={0.85}>
          {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar} />}
          <View style={styles.cameraBadge}><Camera color={COLORS.white} size={18} /></View>
        </TouchableOpacity>

        <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={COLORS.muted} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Username" placeholderTextColor={COLORS.muted} value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput style={[styles.input, styles.bio]} placeholder="Bio" placeholderTextColor={COLORS.muted} value={bio} onChangeText={setBio} multiline />

        <TouchableOpacity style={[styles.button, isSaving && styles.disabled]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Finish setup</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingTop: 56 },
  title: { color: COLORS.text, fontSize: FONT_SIZE.xxxl, fontWeight: FONT_WEIGHT.extrabold, textAlign: 'center' },
  subtitle: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, lineHeight: 22, textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.xxl },
  avatarButton: { alignSelf: 'center', marginBottom: SPACING.xxl },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.backgroundSecondary },
  cameraBadge: { position: 'absolute', right: 2, bottom: 2, width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: SPACING.lg, paddingVertical: 14, color: COLORS.text, fontSize: FONT_SIZE.md, marginBottom: SPACING.md, backgroundColor: COLORS.surface },
  bio: { minHeight: 96, textAlignVertical: 'top' },
  button: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.sm },
  disabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
});
