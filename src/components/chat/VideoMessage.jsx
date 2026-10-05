import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { PlayIcon } from '@hugeicons/core-free-icons';
import Icon from '../Icon';
import { mediaSize, formatDuration } from '../../utils/format';
import { BUBBLE_RADIUS } from '../../theme/bubble';

export default function VideoMessage({ message }) {
  const { width, height } = mediaSize(message.width, message.height);
  return (
    <View
      style={{
        width,
        height,
        borderRadius: BUBBLE_RADIUS,
        overflow: 'hidden',
        backgroundColor: '#1C1C1E',
      }}
    >
      <Image
        source={{ uri: message.thumb }}
        style={{ width, height }}
        contentFit="cover"
        transition={150}
      />
      <View
        style={{
          ...StyleAbsolute,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: 'rgba(0,0,0,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon icon={PlayIcon} size={24} color="#FFFFFF" />
        </View>
      </View>
      <View
        style={{
          position: 'absolute',
          left: 10,
          bottom: 10,
          backgroundColor: 'rgba(0,0,0,0.55)',
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 2,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
          {formatDuration(message.duration)}
        </Text>
      </View>
    </View>
  );
}

const StyleAbsolute = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };