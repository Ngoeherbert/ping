import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL, COLORS } from '@/lib/constants';
import { useFeedStore } from '@/store/feedStore';
import type { MediaType } from '@/types';

type CreatePostType = 'image' | 'video' | 'reel' | 'story';

const POST_TYPES: CreatePostType[] = ['image', 'video', 'reel', 'story'];

export default function CreateScreen() {
  const [postType, setPostType] = useState<CreatePostType>('image');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { addPost } = useFeedStore();
  const router = useRouter();

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        postType === 'image' || postType === 'story'
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const uploadAndPost = async () => {
    if (!mediaUri) {
      Alert.alert('No media', 'Select a photo or video first.');
      return;
    }

    setIsPosting(true);
    try {
      const uploadedUrl = await uploadMedia(mediaUri);
      const mediaType: MediaType = postType === 'video' || postType === 'reel' ? 'video' : 'image';
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: postType,
          caption,
          location,
          media: [{ url: uploadedUrl, type: mediaType }],
        }),
      });
      const data = await response.json();
      addPost(data.post);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Failed to create post.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>New Post</Text>
        <TouchableOpacity
          style={[styles.postButton, isPosting && styles.postButtonDisabled]}
          onPress={uploadAndPost}
          disabled={isPosting}
        >
          {isPosting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.postButtonText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.typeRow}>
          {POST_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeButton, postType === type && styles.typeButtonActive]}
              onPress={() => setPostType(type)}
            >
              <Text style={[styles.typeButtonText, postType === type && styles.typeButtonTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mediaUri ? (
          <View style={styles.mediaPreview}>
            <Image source={{ uri: mediaUri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeMedia} onPress={() => setMediaUri(null)}>
              <X color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mediaPicker}>
            <TouchableOpacity style={styles.mediaPickerButton} onPress={openCamera}>
              <Camera color={COLORS.primary} size={28} />
              <Text style={styles.mediaPickerText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaPickerButton} onPress={pickMedia}>
              <ImageIcon color={COLORS.primary} size={28} />
              <Text style={styles.mediaPickerText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption..."
          placeholderTextColor={COLORS.muted}
          multiline
          value={caption}
          onChangeText={setCaption}
        />

        <TextInput
          style={styles.locationInput}
          placeholder="Add location..."
          placeholderTextColor={COLORS.muted}
          value={location}
          onChangeText={setLocation}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

async function uploadMedia(uri: string): Promise<string> {
  return uri;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  postButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  postButtonDisabled: { opacity: 0.6 },
  postButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  typeRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 14, gap: 8 },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    flex: 1,
    alignItems: 'center',
  },
  typeButtonActive: { backgroundColor: COLORS.primary },
  typeButtonText: { fontWeight: '600', color: COLORS.textSecondary, fontSize: 13 },
  typeButtonTextActive: { color: '#fff' },
  mediaPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 60,
    backgroundColor: '#F9F9F9',
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  mediaPickerButton: { alignItems: 'center', gap: 8 },
  mediaPickerText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  mediaPreview: { marginHorizontal: 16, marginBottom: 16, position: 'relative' },
  previewImage: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#EEEEEE' },
  removeMedia: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionInput: {
    marginHorizontal: 16,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 80,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  locationInput: {
    marginHorizontal: 16,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
});
