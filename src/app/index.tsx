import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FlightActivity, { type FlightActivityProps } from '@/live-activities/flight-activity';
import { Colors, Spacing } from '@/constants/theme';

const DEPARTURE_HOUR = 8;
const FLIGHT_HOUR = 12;
const TOTAL_MINUTES = (FLIGHT_HOUR - DEPARTURE_HOUR) * 60;
const STEP_MINUTES = 15;

const DEPARTURE_LABEL = `${String(DEPARTURE_HOUR).padStart(2, '0')}:00`;
const FLIGHT_LABEL = `${String(FLIGHT_HOUR).padStart(2, '0')}:00`;

type FlightActivityInstance = ReturnType<typeof FlightActivity.start>;

function formatClock(elapsedMinutes: number) {
  const totalMinutesFromMidnight = DEPARTURE_HOUR * 60 + elapsedMinutes;
  const hours = Math.floor(totalMinutesFromMidnight / 60);
  const minutes = totalMinutesFromMidnight % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatRemaining(remainingMinutes: number) {
  if (remainingMinutes <= 0) {
    return '搭乗締切';
  }
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  if (hours === 0) {
    return `残り ${minutes}分`;
  }
  return `残り ${hours}時間${minutes}分`;
}

function getStatusMessage(progress: number) {
  if (progress <= 0) return '家を出発する時刻です';
  if (progress < 0.5) return '空港へ移動中です';
  if (progress < 0.9) return 'もうすぐ空港に到着します';
  if (progress < 1) return '搭乗手続きはお済みですか？';
  return '搭乗締切です';
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isIOS = Platform.OS === 'ios';

  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [activity, setActivity] = useState<FlightActivityInstance | null>(null);

  const progress = useMemo(
    () => Math.min(Math.max(elapsedMinutes / TOTAL_MINUTES, 0), 1),
    [elapsedMinutes]
  );
  const remainingMinutes = TOTAL_MINUTES - elapsedMinutes;
  const currentClock = formatClock(elapsedMinutes);
  const remainingLabel = formatRemaining(remainingMinutes);
  const statusMessage = getStatusMessage(progress);

  const buildActivityProps = (): FlightActivityProps => ({
    departureLabel: DEPARTURE_LABEL,
    flightLabel: FLIGHT_LABEL,
    progress,
    remainingLabel,
    statusMessage,
  });

  useEffect(() => {
    if (activity) {
      activity.update(buildActivityProps());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedMinutes]);

  const handleStart = () => {
    if (!isIOS || activity) return;
    const instance = FlightActivity.start(buildActivityProps(), 'liveactivitiesexpo://flight');
    setActivity(instance);
  };

  const handleEnd = async () => {
    if (!activity) return;
    await activity.end('default', buildActivityProps());
    setActivity(null);
  };

  const adjustTime = (deltaMinutes: number) => {
    setElapsedMinutes((current) =>
      Math.min(Math.max(current + deltaMinutes, 0), TOTAL_MINUTES)
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>フライト搭乗ゲージ</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {DEPARTURE_LABEL} 家を出発 → {FLIGHT_LABEL} 搭乗締切
        </Text>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.clock, { color: theme.text }]}>{currentClock}</Text>
          <View style={[styles.gaugeTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.gaugeFill,
                { width: `${progress * 100}%`, backgroundColor: progress >= 1 ? '#FF3B30' : '#007AFF' },
              ]}
            />
          </View>
          <Text style={[styles.percent, { color: theme.textSecondary }]}>
            {Math.round(progress * 100)}%
          </Text>
          <Text style={[styles.status, { color: theme.text }]}>{statusMessage}</Text>
          <Text style={[styles.remaining, { color: theme.textSecondary }]}>{remainingLabel}</Text>
        </View>

        <View style={styles.stepperRow}>
          <Pressable
            style={[styles.stepperButton, { backgroundColor: theme.backgroundElement }]}
            onPress={() => adjustTime(-STEP_MINUTES)}>
            <Text style={[styles.stepperLabel, { color: theme.text }]}>-{STEP_MINUTES}分</Text>
          </Pressable>
          <Pressable
            style={[styles.stepperButton, { backgroundColor: theme.backgroundElement }]}
            onPress={() => adjustTime(STEP_MINUTES)}>
            <Text style={[styles.stepperLabel, { color: theme.text }]}>+{STEP_MINUTES}分</Text>
          </Pressable>
        </View>

        <View style={styles.activityRow}>
          <Pressable
            disabled={!isIOS || !!activity}
            style={[
              styles.activityButton,
              { backgroundColor: '#34C759', opacity: !isIOS || activity ? 0.4 : 1 },
            ]}
            onPress={handleStart}>
            <Text style={styles.activityButtonLabel}>開始</Text>
          </Pressable>
          <Pressable
            disabled={!activity}
            style={[styles.activityButton, { backgroundColor: '#FF3B30', opacity: activity ? 1 : 0.4 }]}
            onPress={handleEnd}>
            <Text style={styles.activityButtonLabel}>終了</Text>
          </Pressable>
        </View>

        {!isIOS && (
          <Text style={[styles.note, { color: theme.textSecondary }]}>
            Live Activities は開発ビルドの iOS でのみ利用できます。
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  clock: {
    fontSize: 40,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  gaugeTrack: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
  },
  percent: {
    fontSize: 14,
    fontWeight: '600',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  remaining: {
    fontSize: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stepperButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  stepperLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  activityRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  activityButton: {
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  activityButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
  },
});
