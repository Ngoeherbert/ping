import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, Heart, MessageCircle, Send, Volume2, VolumeX } from 'lucide-react-native';
import { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/lib/constants';
import { useReelStore } from '@/store/reelStore';
import type { Post } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelItemProps {
  reel: Post;
  isActive: boolean;
}

export function ReelItem({ reel, isActive }: ReelItemProps) {
  const { isMuted, toggleMute, likeReel } = useReelStore();
  const router = useRouter();
  const mediaUrl = reel.media?.[0]?.url;
  const user = reel.user;
  const player = useVideoPlayer(mediaUrl ?? null, (videoPlayer) => {
    videoPlayer.loop = true;
  });

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (isActive && mediaUrl) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, mediaUrl, player]);

  return (
    <View style={styles.container}>
      {mediaUrl ? (
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />
      ) : null}

      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={styles.gradient} />

      <View style={styles.userInfo}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => user && router.push(`/user/${user.id}`)}
          disabled={!user}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <Text style={styles.username}>@{user?.username ?? 'unknown'}</Text>
          <View style={styles.followBadge}>
            <Text style={styles.followText}>Follow</Text>
          </View>
        </TouchableOpacity>
        {reel.caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            {reel.caption}
          </Text>
        ) : null}
      </View>

      <View style={styles.sideActions}>
        <TouchableOpacity style={styles.actionItem} onPress={() => likeReel(reel.id)}>
          <Heart color="#fff" fill={reel.isLiked ? COLORS.primary : 'none'} size={28} />
          <Text style={styles.actionCount}>{reel.likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={() => router.push(`/post/${reel.id}`)}>
          <MessageCircle color="#fff" size={28} />
          <Text style={styles.actionCount}>{reel.commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Send color="#fff" size={28} />
          <Text style={styles.actionCount}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Bookmark color="#fff" size={28} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={toggleMute}>
          {isMuted ? <VolumeX color="#fff" size={24} /> : <Volume2 color="#fff" size={24} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' },
  video: { ...StyleSheet.absoluteFillObject },
  gradient: { ...StyleSheet.absoluteFillObject },
  userInfo: { position: 'absolute', bottom: 100, left: 16, right: 80 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 10,
    backgroundColor: '#333333',
  },
  username: { color: '#fff', fontWeight: '700', fontSize: 15, marginRight: 10 },
  followBadge: {
    borderWidth: 1.5,
    borderColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  followText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  caption: { color: '#fff', fontSize: 14, lineHeight: 20 },
  sideActions: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
    gap: 20,
  },
  actionItem: { alignItems: 'center', gap: 4 },
  actionCount: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
