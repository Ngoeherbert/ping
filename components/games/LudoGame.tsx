import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

const PLAYER_COLORS = [COLORS.primary, '#2196F3'];
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

interface Piece {
  id: number;
  cell: number;
}

interface LudoState {
  pieces: Record<string, Piece[]>;
  currentPlayer: number;
  diceValue: number | null;
  winner: number | null;
}

interface Props {
  sessionId: string;
}

function createInitialState(): LudoState {
  return {
    pieces: {
      0: Array.from({ length: 4 }, (_, id) => ({ id, cell: -1 })),
      1: Array.from({ length: 4 }, (_, id) => ({ id, cell: -1 })),
    },
    currentPlayer: 0,
    diceValue: null,
    winner: null,
  };
}

export function LudoGame({ sessionId }: Props) {
  const { activeSession, fetchSession, updateSession, startPolling, stopPolling } = useGameStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [gameState, setGameState] = useState<LudoState>(createInitialState);
  const [rolling, setRolling] = useState(false);

  const isChallenger = activeSession?.challengerId === user?.id;
  const myPlayerIndex = isChallenger ? 0 : 1;
  const isMyTurn = activeSession?.currentTurnId === user?.id;

  useEffect(() => {
    fetchSession(sessionId);
    startPolling(sessionId);
    return () => stopPolling();
  }, [fetchSession, sessionId, startPolling, stopPolling]);

  useEffect(() => {
    if (!activeSession?.state) return;

    try {
      setGameState(JSON.parse(activeSession.state) as LudoState);
    } catch {
      setGameState(createInitialState());
    }
  }, [activeSession?.state]);

  const rollDice = () => {
    if (!isMyTurn || rolling || gameState.diceValue !== null) return;

    setRolling(true);
    const value = Math.floor(Math.random() * 6) + 1;
    setGameState((current) => ({ ...current, diceValue: value }));
    setRolling(false);
  };

  const movePiece = async (pieceIndex: number) => {
    if (!activeSession || !isMyTurn || gameState.diceValue === null) return;

    const nextState: LudoState = JSON.parse(JSON.stringify(gameState)) as LudoState;
    const pieces = nextState.pieces[String(myPlayerIndex)];
    const piece = pieces[pieceIndex];

    if (piece.cell === -1 && nextState.diceValue === 6) {
      piece.cell = 0;
    } else if (piece.cell >= 0) {
      piece.cell = Math.min(57, piece.cell + nextState.diceValue);
    }

    const winnerEntry = Object.entries(nextState.pieces).find(([, candidatePieces]) =>
      candidatePieces.every((candidate) => candidate.cell === 57),
    );
    nextState.winner = winnerEntry ? Number(winnerEntry[0]) : null;
    nextState.currentPlayer = nextState.currentPlayer === 0 ? 1 : 0;
    nextState.diceValue = null;

    const nextTurnId = nextState.currentPlayer === 0
      ? activeSession.challengerId
      : activeSession.opponentId;

    setGameState(nextState);
    await updateSession(sessionId, {
      state: JSON.stringify(nextState),
      currentTurnId: nextTurnId,
      ...(nextState.winner !== null ? { status: 'finished', winnerId: user?.id ?? null } : { status: 'active' }),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Ludo</Text>
        <View style={[styles.turnBadge, { backgroundColor: isMyTurn ? COLORS.primary : COLORS.border }]}> 
          <Text style={[styles.turnText, { color: isMyTurn ? '#fff' : COLORS.textTertiary }]}> 
            {isMyTurn ? 'Your Turn' : 'Waiting…'}
          </Text>
        </View>
      </View>

      <View style={styles.board}>
        {[0, 1].map((playerIndex) => (
          <View
            key={playerIndex}
            style={[
              styles.homeZone,
              {
                borderColor: PLAYER_COLORS[playerIndex],
                backgroundColor: `${PLAYER_COLORS[playerIndex]}22`,
              },
            ]}
          >
            <Text style={styles.homeLabel}>{playerIndex === myPlayerIndex ? 'YOU' : 'OPPONENT'}</Text>
            <View style={styles.piecesGrid}>
              {gameState.pieces[String(playerIndex)].map((piece, index) => (
                <TouchableOpacity
                  key={piece.id}
                  style={[styles.piece, { backgroundColor: PLAYER_COLORS[playerIndex] }]}
                  onPress={() => playerIndex === myPlayerIndex && movePiece(index)}
                  disabled={playerIndex !== myPlayerIndex || !isMyTurn}
                >
                  <Text style={styles.pieceText}>{piece.cell === -1 ? '●' : piece.cell}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.centerRow}>
          <TouchableOpacity
            style={[styles.diceButton, (!isMyTurn || rolling) && styles.disabled]}
            onPress={rollDice}
            disabled={!isMyTurn || rolling}
          >
            <Text style={styles.diceValue}>
              {gameState.diceValue ? DICE_FACES[gameState.diceValue - 1] : '🎲'}
            </Text>
            <Text style={styles.diceLabel}>{isMyTurn ? 'Tap to Roll' : 'Opponent rolling…'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {gameState.winner !== null && (
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            <Text style={styles.winEmoji}>🏆</Text>
            <Text style={styles.winTitle}>{gameState.winner === myPlayerIndex ? 'You Win!' : 'Opponent Wins!'}</Text>
            <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.background,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  turnBadge: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
  turnText: { fontWeight: '700', fontSize: 13 },
  board: { flex: 1, padding: 12, gap: 12 },
  homeZone: { borderRadius: 16, borderWidth: 2, padding: 12, alignItems: 'center', minHeight: 160 },
  homeLabel: { fontWeight: '800', fontSize: 13, color: COLORS.text, marginBottom: 12 },
  piecesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  piece: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pieceText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  centerRow: { alignItems: 'center', paddingVertical: 16 },
  diceButton: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  disabled: { opacity: 0.5 },
  diceValue: { fontSize: 48, marginBottom: 4 },
  diceLabel: { fontSize: 11, color: COLORS.textTertiary, fontWeight: '600' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: { backgroundColor: COLORS.background, borderRadius: 24, padding: 40, alignItems: 'center', width: '75%' },
  winEmoji: { fontSize: 60, marginBottom: 12 },
  winTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 24 },
  doneButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 13 },
  doneButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
