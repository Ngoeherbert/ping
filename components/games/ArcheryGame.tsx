import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TARGET_SIZE = SCREEN_WIDTH * 0.55;
const TOTAL_ARROWS = 5;

interface Props {
  sessionId: string;
}

interface Shot {
  x: number;
  y: number;
  points: number;
}

export function ArcheryGame({ sessionId }: Props) {
  const { activeSession, fetchSession, updateSession, startPolling, stopPolling } = useGameStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const targetAnim = useRef(new Animated.Value(0)).current;
  const [arrows, setArrows] = useState(TOTAL_ARROWS);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState<Shot[]>([]);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    fetchSession(sessionId);
    startPolling(sessionId);
    Animated.loop(
      Animated.sequence([
        Animated.timing(targetAnim, { toValue: 40, duration: 1200, useNativeDriver: true }),
        Animated.timing(targetAnim, { toValue: -40, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();

    return () => stopPolling();
  }, [fetchSession, sessionId, startPolling, stopPolling, targetAnim]);

  const submitScore = async (finalScore: number) => {
    if (!activeSession || !user) return;

    const isChallenger = activeSession.challengerId === user.id;
    const opponentScore = isChallenger
      ? activeSession.opponentScore ?? 0
      : activeSession.challengerScore ?? 0;
    const bothPlayersScored = opponentScore > 0;

    await updateSession(sessionId, {
      ...(isChallenger
        ? { challengerScore: finalScore }
        : { opponentScore: finalScore }),
      status: bothPlayersScored ? 'finished' : 'active',
      currentTurnId: isChallenger ? activeSession.opponentId : activeSession.challengerId,
      ...(bothPlayersScored
        ? {
            winnerId:
              finalScore === opponentScore
                ? null
                : finalScore > opponentScore
                  ? user.id
                  : isChallenger
                    ? activeSession.opponentId
                    : activeSession.challengerId,
          }
        : {}),
    });
  };

  const handleShot = (event: GestureResponderEvent) => {
    if (arrows <= 0 || gameOver) return;

    const { locationX, locationY } = event.nativeEvent;
    const center = TARGET_SIZE / 2;
    const distance = Math.sqrt((locationX - center) ** 2 + (locationY - center) ** 2);
    const maxRadius = TARGET_SIZE / 2;
    const points = getShotPoints(distance, maxRadius);
    const newScore = score + points;
    const remaining = arrows - 1;

    setScore(newScore);
    setArrows(remaining);
    setShots((prev) => [...prev, { x: locationX, y: locationY, points }]);

    if (remaining === 0) {
      setGameOver(true);
      submitScore(newScore);
    }
  };

  const opponentScore = activeSession?.challengerId === user?.id
    ? activeSession?.opponentScore ?? 0
    : activeSession?.challengerScore ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X color="#fff" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Archery</Text>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>{score} pts</Text>
        </View>
      </View>

      <View style={styles.arrowsRow}>
        {Array.from({ length: TOTAL_ARROWS }).map((_, index) => (
          <Text key={index} style={[styles.arrow, index >= arrows && styles.usedArrow]}>🏹</Text>
        ))}
      </View>

      <View style={styles.targetArea}>
        <Animated.View style={{ transform: [{ translateX: targetAnim }] }}>
          <TouchableOpacity onPress={handleShot} activeOpacity={1}>
            <View style={styles.targetOuter}>
              {RINGS.map((ring) => (
                <View
                  key={ring.multiplier}
                  style={[
                    styles.ring,
                    {
                      width: TARGET_SIZE * ring.multiplier,
                      height: TARGET_SIZE * ring.multiplier,
                      borderRadius: (TARGET_SIZE * ring.multiplier) / 2,
                      backgroundColor: ring.color,
                    },
                  ]}
                />
              ))}
            </View>
            {shots.map((shot, index) => (
              <View key={`${shot.x}-${shot.y}-${index}`} style={[styles.shotMarker, { left: shot.x - 8, top: shot.y - 8 }]}>
                <Text style={styles.shotPoints}>+{shot.points}</Text>
              </View>
            ))}
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.opponentScore}>
        <Text style={styles.opponentLabel}>Opponent</Text>
        <Text style={styles.opponentValue}>{opponentScore} pts</Text>
      </View>

      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Your Score</Text>
            <Text style={styles.resultScore}>{score}</Text>
            <Text style={styles.resultSub}>Waiting for opponent…</Text>
            <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function getShotPoints(distance: number, maxRadius: number) {
  if (distance < maxRadius * 0.12) return 10;
  if (distance < maxRadius * 0.28) return 8;
  if (distance < maxRadius * 0.44) return 6;
  if (distance < maxRadius * 0.6) return 4;
  if (distance < maxRadius * 0.78) return 2;
  if (distance < maxRadius) return 1;
  return 0;
}

const RINGS = [
  { multiplier: 1, color: '#FFFFFF' },
  { multiplier: 0.78, color: '#111111' },
  { multiplier: 0.6, color: '#4169E1' },
  { multiplier: 0.44, color: '#FF3B30' },
  { multiplier: 0.28, color: '#FF3B30' },
  { multiplier: 0.12, color: '#FFD700' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.text },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },
  scoreBox: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
  scoreText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  arrowsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 24 },
  arrow: { fontSize: 20 },
  usedArrow: { opacity: 0.2 },
  targetArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  targetOuter: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderRadius: TARGET_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  ring: { position: 'absolute' },
  shotMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  shotPoints: { color: '#FFD700', fontSize: 9, fontWeight: '800' },
  opponentScore: { alignItems: 'center', paddingBottom: 24 },
  opponentLabel: { color: COLORS.textSecondary, fontSize: 13 },
  opponentValue: { color: '#fff', fontWeight: '700', fontSize: 18 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: { backgroundColor: '#fff', borderRadius: 24, padding: 36, alignItems: 'center', width: '75%' },
  resultTitle: { fontSize: 14, color: COLORS.textTertiary, fontWeight: '600', marginBottom: 8 },
  resultScore: { fontSize: 64, fontWeight: '900', color: COLORS.primary, marginBottom: 4 },
  resultSub: { fontSize: 13, color: COLORS.textTertiary, marginBottom: 24 },
  doneButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 13 },
  doneButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
