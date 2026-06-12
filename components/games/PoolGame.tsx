import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

const SHOTS_PER_PLAYER = 5;
const POCKETS = [10, 20, 30, 40, 50] as const;

interface Props {
  sessionId: string;
}

interface PoolState {
  challengerShots: number;
  opponentShots: number;
}

export function PoolGame({ sessionId }: Props) {
  const { activeSession, fetchSession, updateSession, startPolling, stopPolling } = useGameStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [shotsTaken, setShotsTaken] = useState(0);
  const [score, setScore] = useState(0);
  const [lastShot, setLastShot] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    fetchSession(sessionId);
    startPolling(sessionId);
    return () => stopPolling();
  }, [fetchSession, sessionId, startPolling, stopPolling]);

  useEffect(() => {
    if (!activeSession?.state) return;

    try {
      const state = JSON.parse(activeSession.state) as PoolState;
      const isChallenger = activeSession.challengerId === user?.id;
      setShotsTaken(isChallenger ? state.challengerShots : state.opponentShots);
    } catch {
      setShotsTaken(0);
    }
  }, [activeSession?.state, activeSession?.challengerId, user?.id]);

  const opponentScore = activeSession?.challengerId === user?.id
    ? activeSession?.opponentScore ?? 0
    : activeSession?.challengerScore ?? 0;
  const isMyTurn = activeSession?.currentTurnId === user?.id;

  const takeShot = async (pocketValue: number) => {
    if (!activeSession || !user || !isMyTurn || gameOver) return;

    setRolling(true);
    const madeShot = Math.random() > 0.35;
    const points = madeShot ? pocketValue : 0;
    const nextScore = score + points;
    const nextShotsTaken = shotsTaken + 1;
    const isChallenger = activeSession.challengerId === user.id;
    const challengerShots = Number(readStateValue(activeSession.state ?? null, 'challengerShots'));
    const opponentShots = Number(readStateValue(activeSession.state ?? null, 'opponentShots'));
    const nextState: PoolState = isChallenger
      ? { challengerShots: nextShotsTaken, opponentShots }
      : { challengerShots, opponentShots: nextShotsTaken };
    const finishedTurn = nextShotsTaken >= SHOTS_PER_PLAYER;
    const bothPlayersFinished = nextState.challengerShots >= SHOTS_PER_PLAYER && nextState.opponentShots >= SHOTS_PER_PLAYER;
    const nextOpponentScore = isChallenger ? activeSession.opponentScore ?? 0 : activeSession.challengerScore ?? 0;

    setScore(nextScore);
    setShotsTaken(nextShotsTaken);
    setLastShot(points);
    if (finishedTurn) setGameOver(true);

    await updateSession(sessionId, {
      state: JSON.stringify(nextState),
      ...(isChallenger ? { challengerScore: nextScore } : { opponentScore: nextScore }),
      currentTurnId: isChallenger ? activeSession.opponentId : activeSession.challengerId,
      status: bothPlayersFinished ? 'finished' : 'active',
      ...(bothPlayersFinished
        ? {
            winnerId:
              nextScore === nextOpponentScore
                ? null
                : nextScore > nextOpponentScore
                  ? user.id
                  : isChallenger
                    ? activeSession.opponentId
                    : activeSession.challengerId,
          }
        : {}),
    });
    setRolling(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X color="#fff" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>8-Ball Pool</Text>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>{score} pts</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.pocket, styles.topLeft]} />
        <View style={[styles.pocket, styles.topCenter]} />
        <View style={[styles.pocket, styles.topRight]} />
        <View style={[styles.pocket, styles.bottomLeft]} />
        <View style={[styles.pocket, styles.bottomCenter]} />
        <View style={[styles.pocket, styles.bottomRight]} />
        <View style={styles.cueBall} />
        <View style={styles.eightBall}>
          <Text style={styles.eightBallText}>8</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Text style={styles.hint}>{isMyTurn ? 'Choose a pocket to aim your shot' : 'Waiting for opponent…'}</Text>
        {lastShot !== null && (
          <Text style={styles.lastShot}>{lastShot > 0 ? `Pocketed +${lastShot}` : 'Missed shot'}</Text>
        )}
        <View style={styles.pocketButtons}>
          {POCKETS.map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.pocketButton, (!isMyTurn || gameOver) && styles.disabled]}
              onPress={() => takeShot(value)}
              disabled={!isMyTurn || gameOver}
            >
              <Text style={styles.pocketButtonText}>+{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.meta}>Shots: {shotsTaken}/{SHOTS_PER_PLAYER} · Opponent: {opponentScore} pts</Text>
      </View>

      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Round Complete</Text>
            <Text style={styles.resultScore}>{score}</Text>
            <Text style={styles.resultSub}>Waiting for your opponent to finish</Text>
            <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function readStateValue(state: string | null, key: keyof PoolState) {
  if (!state) return 0;

  try {
    const parsed = JSON.parse(state) as PoolState;
    return parsed[key] ?? 0;
  } catch {
    return 0;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B3D2E' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  scoreBox: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
  scoreText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  table: {
    margin: 20,
    flex: 1,
    borderRadius: 28,
    borderWidth: 10,
    borderColor: '#6D3F19',
    backgroundColor: '#167A52',
    position: 'relative',
  },
  pocket: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#050505', position: 'absolute' },
  topLeft: { top: -8, left: -8 },
  topCenter: { top: -12, alignSelf: 'center' },
  topRight: { top: -8, right: -8 },
  bottomLeft: { bottom: -8, left: -8 },
  bottomCenter: { bottom: -12, alignSelf: 'center' },
  bottomRight: { bottom: -8, right: -8 },
  cueBall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', position: 'absolute', left: '25%', top: '55%' },
  eightBall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111',
    position: 'absolute',
    right: '28%',
    top: '35%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eightBallText: { color: '#fff', fontWeight: '900' },
  controls: { padding: 20, alignItems: 'center', gap: 12 },
  hint: { color: '#fff', fontSize: 14, fontWeight: '700' },
  lastShot: { color: '#F6E05E', fontSize: 14, fontWeight: '800' },
  pocketButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  pocketButton: { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  pocketButtonText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.45 },
  meta: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: { backgroundColor: '#fff', borderRadius: 24, padding: 36, alignItems: 'center', width: '75%' },
  resultTitle: { color: COLORS.textTertiary, fontWeight: '700', marginBottom: 8 },
  resultScore: { fontSize: 64, fontWeight: '900', color: COLORS.primary },
  resultSub: { color: COLORS.textTertiary, marginBottom: 24 },
  doneButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 13 },
  doneButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
