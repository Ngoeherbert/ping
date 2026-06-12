import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Circle, Gamepad2, Grid, Target } from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@/lib/constants';
import { useGameStore } from '@/store/gameStore';
import type { GameType } from '@/types';

const GAMES: Array<{
  id: GameType;
  name: string;
  description: string;
  icon: typeof Target;
  color: string;
}> = [
  {
    id: 'archery',
    name: 'Archery',
    description: 'Aim and shoot — highest score wins',
    icon: Target,
    color: COLORS.primary,
  },
  {
    id: 'pool',
    name: '8-Ball Pool',
    description: 'Line up shots in a quick tap-to-score match',
    icon: Circle,
    color: '#4CAF50',
  },
  {
    id: 'ludo',
    name: 'Ludo',
    description: 'Roll sixes, race your pieces home',
    icon: Grid,
    color: '#9C27B0',
  },
  {
    id: 'snake_ladder',
    name: 'Snake & Ladder',
    description: 'Climb ladders and avoid snakes',
    icon: Gamepad2,
    color: '#2196F3',
  },
];

interface Props {
  conversationId: string;
  opponentId?: string;
  visible: boolean;
  onClose: () => void;
}

export function GameLauncher({ conversationId, opponentId, visible, onClose }: Props) {
  const { createChallenge, isLoading } = useGameStore();
  const router = useRouter();

  const launch = async (type: GameType) => {
    if (!opponentId) {
      Alert.alert('No opponent found', 'Games are available in one-on-one conversations.');
      return;
    }

    try {
      const session = await createChallenge(conversationId, opponentId, type);
      onClose();
      router.push(`/games/${session.id}?type=${type}`);
    } catch {
      Alert.alert('Game unavailable', 'Unable to start this game right now.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Play a Game</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Challenge your friend to a quick match</Text>

        <View style={styles.grid}>
          {GAMES.map((game) => {
            const Icon = game.icon;
            return (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                onPress={() => launch(game.id)}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <View style={[styles.iconWrapper, { backgroundColor: `${game.color}20` }]}>
                  <Icon color={game.color} size={32} />
                </View>
                <Text style={styles.gameName}>{game.name}</Text>
                <Text style={styles.gameDescription}>{game.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  closeButton: { padding: 4 },
  closeText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  subtitle: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 12,
  },
  gameCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameName: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  gameDescription: { fontSize: 12, color: COLORS.textTertiary, lineHeight: 17 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
});
