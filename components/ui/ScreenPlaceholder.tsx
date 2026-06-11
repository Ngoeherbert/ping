import { StyleSheet, Text, View } from 'react-native';
import { BRAND_COLORS } from '@/lib/constants';

type ScreenPlaceholderProps = {
  title: string;
  subtitle?: string;
};

export function ScreenPlaceholder({ title, subtitle }: ScreenPlaceholderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: BRAND_COLORS.background,
  },
  title: {
    color: BRAND_COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: BRAND_COLORS.mutedText,
    fontSize: 16,
    textAlign: 'center',
  },
});
