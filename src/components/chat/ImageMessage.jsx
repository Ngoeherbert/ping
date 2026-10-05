import { Image } from 'expo-image';
import { mediaSize } from '../../utils/format';
import { BUBBLE_RADIUS } from '../../theme/bubble';

export default function ImageMessage({ message }) {
  const { width, height } = mediaSize(message.width, message.height);
  return (
    <Image
      source={{ uri: message.uri }}
      style={{ width, height, borderRadius: BUBBLE_RADIUS, backgroundColor: '#E9E9EB' }}
      contentFit="cover"
      transition={150}
    />
  );
}