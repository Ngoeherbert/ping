import { Text } from 'react-native';
import { bubbleColors } from '../../theme/bubble';

export default function TextMessage({ message }) {
  const c = bubbleColors(message.own);
  return <Text style={{ color: c.text, fontSize: 16, lineHeight: 21 }}>{message.text}</Text>;
}