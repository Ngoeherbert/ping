import { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { PlayIcon, PauseIcon } from '@hugeicons/core-free-icons';
import Icon from '../Icon';
import { bubbleColors } from '../../theme/bubble';
import { formatDuration } from '../../utils/format';
import { haptic } from '../../utils/haptics';

const BARS = 28;

// Stable fake waveform from the message id (swap for real waveform data later)
const barsFor = (seed) => {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: BARS }, () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return 6 + ((h % 1000) / 1000) * 16;
  });
};

export default function VoiceMessage({ message }) {
  const c = bubbleColors(message.own);
  const player = useAudioPlayer(message.uri ?? null);
  const status = useAudioPlayerStatus(player);
  const bars = useMemo(() => barsFor(String(message.id)), [message.id]);

  const total = status.duration || message.duration || 0;
  const progress = total ? status.currentTime / total : 0;

  const toggle = () => {
    haptic.light();
    if (status.playing) {
      player.pause();
    } else {
      if (total && status.currentTime >= total - 0.05) player.seekTo(0);
      player.play();
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: 210 }}>
      <Pressable
        onPress={toggle}
        hitSlop={8}
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: c.btnBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon icon={status.playing ? PauseIcon : PlayIcon} size={18} color={c.btnIcon} />
      </Pressable>

      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 26 }}>
        {bars.map((h, i) => (
          <View
            key={i}
            style={{
              width: 3,
              height: h,
              borderRadius: 2,
              backgroundColor: i / BARS <= progress ? c.barOn : c.barOff,
            }}
          />
        ))}
      </View>

      <Text style={{ color: c.sub, fontSize: 12, minWidth: 30, textAlign: 'right' }}>
        {formatDuration(status.playing ? status.currentTime : total)}
      </Text>
    </View>
  );
}