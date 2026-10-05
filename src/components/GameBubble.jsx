import { View, Text } from 'react-native';
import { GameController03Icon } from '@hugeicons/core-free-icons';
import Icon from './Icon';
import { BUBBLE_RADIUS } from '../theme/bubble';

const GAMES = {
  tictactoe: { name: 'Tic-Tac-Toe', color: '#FF9F0A' },
  connectfour: { name: 'Connect Four', color: '#5E5CE6' },
  wordguess: { name: 'Word Guess', color: '#30B0C7' },
  rps: { name: 'Rock Paper Scissors', color: '#FF375F' },
};

const statusText = (g) =>
  ({
    yourTurn: 'Your turn',
    waiting: `Waiting for ${g.opponent ?? 'opponent'}`,
    won: 'You won',
    lost: 'You lost',
    draw: "It's a draw",
  })[g.status] ?? '';

const actionText = (s) => (s === 'yourTurn' ? 'Play' : s === 'waiting' ? 'View' : 'Rematch');

export default function GameBubble({ message }) {
  const g = message.game;
  const meta = GAMES[g.type] ?? { name: g.type, color: '#8E8E93' };

  return (
    <View
      style={{
        width: 230,
        backgroundColor: meta.color,
        borderRadius: BUBBLE_RADIUS,
        padding: 14,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: 'rgba(255,255,255,0.25)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon icon={GameController03Icon} size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            {meta.name}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 1 }}>
            {statusText(g)}
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 14,
          paddingVertical: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: meta.color, fontSize: 15, fontWeight: '700' }}>
          {actionText(g.status)}
        </Text>
      </View>
    </View>
  );
}
