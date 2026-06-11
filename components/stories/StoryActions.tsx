import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Download, RefreshCw } from 'lucide-react-native';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { API_URL, COLORS } from '@/lib/constants';
import type { Story } from '@/types';

interface Props {
  story: Story;
  onReshared?: () => void;
}

export function StoryActions({ story, onReshared }: Props) {
  const downloadStory = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow Ping to save media to your library.');
      return;
    }

    try {
      const cacheDirectory = FileSystem.cacheDirectory;
      if (!cacheDirectory) throw new Error('Cache directory unavailable');

      const basename = story.mediaUrl.split('/').pop()?.split('?')[0] || `story_${Date.now()}`;
      const extension = story.mediaType === 'video' ? '.mp4' : '.jpg';
      const filename = basename.includes('.') ? basename : `${basename}${extension}`;
      const localUri = `${cacheDirectory}${filename}`;
      const download = await FileSystem.downloadAsync(story.mediaUrl, localUri);
      await MediaLibrary.saveToLibraryAsync(download.uri);

      Alert.alert('Saved!', 'Story saved to your camera roll.');
    } catch {
      Alert.alert('Error', 'Failed to download story.');
    }
  };

  const reshareStory = async () => {
    Alert.alert('Reshare Story', 'Add this story to your own status?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reshare',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/api/stories`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mediaUrl: story.mediaUrl,
                mediaType: story.mediaType,
                thumbnailUrl: story.thumbnailUrl,
                text: story.text,
                resharedFromId: story.id,
                resharedFromUser: story.user?.username,
              }),
            });
            if (!res.ok) throw new Error('Reshare failed');

            Alert.alert('Reshared!', 'Added to your story.');
            onReshared?.();
          } catch {
            Alert.alert('Error', 'Could not reshare this story.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={downloadStory}>
        <Download color={COLORS.white} size={20} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={reshareStory}>
        <RefreshCw color={COLORS.white} size={20} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8 },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
