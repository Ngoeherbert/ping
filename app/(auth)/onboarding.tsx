import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MessageCircle, Search, Shield } from 'lucide-react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/lib/constants';

const slides = [
  { title: 'Share what is happening', body: 'Create posts, reels, and stories with the people who matter most.', icon: MessageCircle },
  { title: 'Discover your circle', body: 'Find friends, trending posts, hashtags, and conversations in one place.', icon: Search },
  { title: 'Stay in control', body: 'Manage read receipts, story privacy, and profile details whenever you need.', icon: Shield },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const slide = slides[index];
  const Icon = slide.icon;
  const isLast = index === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Icon color={COLORS.primary} size={54} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((item, itemIndex) => (
            <View key={item.title} style={[styles.dot, itemIndex === index && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => (isLast ? router.replace('/(auth)/register') : setIndex((current) => current + 1))}
        >
          <Text style={styles.primaryText}>{isLast ? 'Create account' : 'Next'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.secondaryText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.xl },
  skip: { alignSelf: 'flex-end', paddingVertical: SPACING.lg },
  skipText: { color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.semibold },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
  },
  title: { color: COLORS.text, fontSize: FONT_SIZE.xxxl, fontWeight: FONT_WEIGHT.extrabold, textAlign: 'center', marginBottom: SPACING.md },
  body: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, lineHeight: 23, textAlign: 'center' },
  footer: { paddingBottom: SPACING.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  secondaryButton: { alignItems: 'center', paddingVertical: SPACING.lg },
  secondaryText: { color: COLORS.primary, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
});
