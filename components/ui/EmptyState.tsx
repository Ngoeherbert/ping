import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '@/lib/constants';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function EmptyState({ title, subtitle, icon }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconWrapper: { marginBottom: 16, opacity: 0.4 },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
