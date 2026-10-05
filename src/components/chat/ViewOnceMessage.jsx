import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { bubbleColors } from '../../theme/bubble';

export default function ViewOnceMessage({ message }) {
  const c = bubbleColors(message.own);
  const opened = !!message.opened;
  const label = opened ? 'Opened' : message.mediaType === 'video' ? 'Video' : 'Photo';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 2,
        opacity: opened ? 0.6 : 1,
      }}
    >
      <View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={30} height={30} viewBox="0 0 30 30" style={{ position: 'absolute' }}>
          <Circle
            cx={15}
            cy={15}
            r={13}
            stroke={c.text}
            strokeWidth={1.8}
            strokeDasharray="4 3.6"
            fill="none"
          />
        </Svg>
        {!opened && <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>1</Text>}
      </View>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}