import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLS = 10;
const CELL_SIZE = (SCREEN_WIDTH - 24) / COLS;
const SNAKES: Record<number, number> = { 99: 21, 87: 24, 62: 18, 54: 34, 49: 11 };
const LADDERS: Record<number, number> = { 4: 56, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81 };

interface Props {
  sessionId: string;
}

interface SnakeLadderState {
  challengerPos: number;
  opponentPos: number;
}

export function SnakeLadderGame({ sessionId }: Props) {
  const { activeSession, fetchSession, updateSession, startPolling, stopPolling } = useGameStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [myPos, setMyPos] = useState(0);
  const [oppPos, setOppPos] = useState(0);
  const [diceVal, setDiceVal] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState('');
  const [winner, setWinner] = useState<'me' | 'opponent' | null>(null);

  const isMyTurn = activeSession?.currentTurnId === user?.id;

  useEffect(() => {
    fetchSession(sessionId);
    startPolling(sessionId);
    return () => stopPolling();
  }, [fetchSession, sessionId, startPolling, stopPolling]);

  useEffect(() => {
    if (!activeSession?.state) return;

    try {
      const state = JSON.parse(activeSession.state) as SnakeLadderState;
      const isChallenger = activeSession.challengerId === user?.id;
      setMyPos(isChallenger ? state.challengerPos : state.opponentPos);
      setOppPos(isChallenger ? state.opponentPos : state.challengerPos);
      if (activeSession.winnerId) {
        setWinner(activeSession.winnerId === user?.id ? 'me' : 'opponent');
      }
    } catch {
      setMyPos(0);
      setOppPos(0);
    }
  }, [activeSession?.state, activeSession?.winnerId, activeSession?.challengerId, user?.id]);

  const roll = async () => {
    if (!activeSession || !isMyTurn || rolling || winner) return;

    setRolling(true);
    const value = Math.floor(Math.random() * 6) + 1;
    setDiceVal(value);

    let nextPos = myPos + value;
    let nextMessage = `Rolled ${value}!`;

    if (nextPos > 100) {
      nextMessage = `Rolled ${value} — need ${100 - myPos} to finish`;
      nextPos = myPos;
    } else if (SNAKES[nextPos]) {
      nextMessage = `🐍 Snake! ${nextPos} → ${SNAKES[nextPos]}`;
      nextPos = SNAKES[nextPos];
    } else if (LADDERS[nextPos]) {
      nextMessage = `🪜 Ladder! ${nextPos} → ${LADDERS[nextPos]}`;
      nextPos = LADDERS[nextPos];
    }

    setMyPos(nextPos);
    setMessage(nextMessage);

    const isChallenger = activeSession.challengerId === user?.id;
    const nextState = isChallenger
      ? { challengerPos: nextPos, opponentPos: oppPos }
      : { challengerPos: oppPos, opponentPos: nextPos };
    const didWin = nextPos === 100;

    if (didWin) setWinner('me');

    await updateSession(sessionId, {
      state: JSON.stringify(nextState),
      currentTurnId: isChallenger ? activeSession.opponentId : activeSession.challengerId,
      ...(didWin ? { status: 'finished', winnerId: user?.id ?? null } : { status: 'active' }),
    });
    setRolling(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Snake & Ladder</Text>
        <View style={[styles.turnBadge, { backgroundColor: isMyTurn ? COLORS.primary : COLORS.border }]}> 
          <Text style={[styles.turnText, { color: isMyTurn ? '#fff' : COLORS.textTertiary }]}> 
            {isMyTurn ? 'Your Turn' : 'Their Turn'}
          </Text>
        </View>
      </View>

      <ScrollView>
        <View style={styles.board}>
          {Array.from({ length: 10 }).map((_, row) => (
            <View key={row} style={styles.boardRow}>
              {Array.from({ length: 10 }).map((__, col) => {
                const cell = getCellNumber(row, col);
                const hasMe = myPos === cell;
                const hasOpp = oppPos === cell;
                const isSnakeHead = SNAKES[cell] !== undefined;
                const isLadderBase = LADDERS[cell] !== undefined;

                return (
                  <View
                    key={cell}
                    style={[styles.cell, isSnakeHead && styles.snakeCell, isLadderBase && styles.ladderCell]}
                  >
                    <Text style={styles.cellNumber}>{cell}</Text>
                    {isSnakeHead && <Text style={styles.cellIcon}>🐍</Text>}
                    {isLadderBase && <Text style={styles.cellIcon}>🪜</Text>}
                    {hasMe && <View style={[styles.token, styles.myToken]} />}
                    {hasOpp && <View style={[styles.token, styles.opponentToken]} />}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.controls}>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.posRow}>
            <View style={styles.posItem}>
              <View style={[styles.playerDot, styles.myToken]} />
              <Text style={styles.posText}>You: {myPos}</Text>
            </View>
            <View style={styles.posItem}>
              <View style={[styles.playerDot, styles.opponentToken]} />
              <Text style={styles.posText}>Opponent: {oppPos}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.rollButton, (!isMyTurn || rolling) && styles.rollButtonDisabled]}
            onPress={roll}
            disabled={!isMyTurn || rolling}
          >
            <Text style={styles.rollButtonText}>{diceVal ? `🎲 ${diceVal}` : '🎲 Roll'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {winner && (
        <View style={styles.overlay}>
          <View style={styles.winCard}>
            <Text style={styles.winEmoji}>{winner === 'me' ? '🏆' : '😔'}</Text>
            <Text style={styles.winTitle}>{winner === 'me' ? 'You Win!' : 'You Lose!'}</Text>
            <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function getCellNumber(row: number, col: number): number {
  const rowFromBottom = 9 - row;
  return rowFromBottom % 2 === 0
    ? rowFromBottom * 10 + col + 1
    : rowFromBottom * 10 + (9 - col) + 1;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  turnBadge: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
  turnText: { fontWeight: '700', fontSize: 13 },
  board: { padding: 12 },
  boardRow: { flexDirection: 'row' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  snakeCell: { backgroundColor: '#FFEBEE' },
  ladderCell: { backgroundColor: '#E8F5E9' },
  cellNumber: { fontSize: 8, color: COLORS.textTertiary, position: 'absolute', top: 1, left: 2 },
  cellIcon: { fontSize: 14 },
  token: { width: 14, height: 14, borderRadius: 7, position: 'absolute', bottom: 2, right: 2 },
  myToken: { backgroundColor: COLORS.primary },
  opponentToken: { backgroundColor: '#2196F3' },
  controls: { padding: 20, alignItems: 'center', gap: 16 },
  message: { fontSize: 14, color: COLORS.primary, fontWeight: '700', textAlign: 'center' },
  posRow: { flexDirection: 'row', gap: 24 },
  posItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playerDot: { width: 14, height: 14, borderRadius: 7 },
  posText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  rollButton: { backgroundColor: COLORS.primary, borderRadius: 16, paddingHorizontal: 48, paddingVertical: 16 },
  rollButtonDisabled: { opacity: 0.45 },
  rollButtonText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winCard: { backgroundColor: COLORS.background, borderRadius: 24, padding: 40, alignItems: 'center', width: '75%' },
  winEmoji: { fontSize: 60, marginBottom: 12 },
  winTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 24 },
  doneButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 13 },
  doneButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
