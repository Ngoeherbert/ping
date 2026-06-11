import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/lib/constants';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  showRing?: boolean;
  ringColor?: string;
}

export function Avatar({
  uri,
  name,
  size = 40,
  showRing = false,
  ringColor = COLORS.primary,
}: AvatarProps) {
  const ringInset = showRing ? 5 : 0;
  const initials =
    name
      ?.split(' ')
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?';

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        showRing && { borderWidth: 2.5, borderColor: ringColor, padding: 2 },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: size - ringInset,
              height: size - ringInset,
              borderRadius: size / 2,
            },
          ]}
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  image: { backgroundColor: COLORS.border },
  placeholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: { color: '#fff', fontWeight: '700' },
});
