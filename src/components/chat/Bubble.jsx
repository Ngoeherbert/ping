import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { bubbleColors, BUBBLE_RADIUS } from '../../theme/bubble';

// Tail shape, drawn in a 17 x 19 box. Tweak the curve numbers to taste.
const TAIL = 'M0 0H12C12 8 13.5 14 17 17.2C13 18.6 9 18 6.5 18H0Z';

export default function Bubble({ own, tail = false, padded = true, children, style }) {
  const { bg } = bubbleColors(own);

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: BUBBLE_RADIUS,
          paddingHorizontal: padded ? 14 : 0,
          paddingVertical: padded ? 8 : 0,
          alignSelf: own ? 'flex-end' : 'flex-start',
        },
        style,
      ]}
    >
      {tail && (
        <Svg
          width={17}
          height={19}
          viewBox="0 0 17 19"
          style={{
            position: 'absolute',
            bottom: 0,
            ...(own ? { right: -5 } : { left: -5, transform: [{ scaleX: -1 }] }),
          }}
        >
          <Path d={TAIL} fill={bg} />
        </Svg>
      )}
      {children}
    </View>
  );
}