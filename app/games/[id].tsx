import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { ArcheryGame } from '@/components/games/ArcheryGame';
import { LudoGame } from '@/components/games/LudoGame';
import { PoolGame } from '@/components/games/PoolGame';
import { SnakeLadderGame } from '@/components/games/SnakeLadderGame';
import type { GameType } from '@/types';

export default function GameScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: GameType }>();

  if (!id) {
    return (
      <View>
        <Text>Game not found.</Text>
      </View>
    );
  }

  if (type === 'archery') return <ArcheryGame sessionId={id} />;
  if (type === 'pool') return <PoolGame sessionId={id} />;
  if (type === 'ludo') return <LudoGame sessionId={id} />;
  if (type === 'snake_ladder') return <SnakeLadderGame sessionId={id} />;

  return (
    <View>
      <Text>Unsupported game.</Text>
    </View>
  );
}
