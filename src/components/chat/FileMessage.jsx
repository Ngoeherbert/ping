import { View, Text } from 'react-native';
import { File01Icon, Download01Icon } from '@hugeicons/core-free-icons';
import Icon from '../Icon';
import { bubbleColors } from '../../theme/bubble';
import { formatBytes } from '../../utils/format';

export default function FileMessage({ message }) {
  const c = bubbleColors(message.own);
  const ext = (message.fileName?.split('.').pop() || 'file').toUpperCase();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: 230 }}>
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: c.chip,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon icon={File01Icon} size={22} color={c.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>
          {message.fileName}
        </Text>
        <Text style={{ color: c.sub, fontSize: 12, marginTop: 1 }}>
          {ext} · {formatBytes(message.size)}
        </Text>
      </View>
      <Icon icon={Download01Icon} size={20} color={c.sub} />
    </View>
  );
}