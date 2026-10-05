import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useSegments } from 'expo-router';
import Icon from './Icon';

export default function PlaceholderScreen({ title, back = true }) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Inside (tabs) the tab bar already consumes the bottom inset, so the
  // screen must not apply it again. Full-screen routes (modals, auth,
  // user/[id]) have no tab bar and do need it.
  const segments = useSegments();
  const edges =
    segments[0] === '(tabs)'
      ? ['top', 'left', 'right']
      : ['top', 'left', 'right', 'bottom'];

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ height: 48, justifyContent: 'center', paddingHorizontal: 12 }}>
        {back && (
          <Pressable onPress={goBack} hitSlop={12} style={{ width: 40 }}>
            <Icon name="back" size={26} color="#111" />
          </Pressable>
        )}
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, color: '#111', textAlign: 'center' }}>{title}</Text>
      </View>
    </SafeAreaView>
  );
}
