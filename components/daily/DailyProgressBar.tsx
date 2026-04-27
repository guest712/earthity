import { StyleSheet, Text, View } from 'react-native';

type Props = {
  progress: number;
  target: number;
  /** Optional unit suffix shown after numbers, e.g. 'm' for meters. */
  unit?: string;
  /** Visual override for filled portion. */
  fillColor?: string;
};

/**
 * Capsule-shaped progress pill with the numeric ratio centred on top of the
 * fill. Used by daily quests for compact at-a-glance progress.
 */
export default function DailyProgressBar({
  progress,
  target,
  unit,
  fillColor = '#2d6a3f',
}: Props) {
  const pct = Math.min(100, Math.max(0, (progress / Math.max(1, target)) * 100));
  const done = progress >= target;

  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          {
            width: `${pct}%`,
            backgroundColor: done ? '#3fa05e' : fillColor,
          },
        ]}
      />
      <View style={styles.labelWrap} pointerEvents="none">
        <Text style={styles.label}>
          {progress}
          {unit ?? ''} / {target}
          {unit ?? ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 22,
    borderRadius: 999,
    backgroundColor: '#1e3020',
    borderWidth: 1,
    borderColor: '#234a2a',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  labelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: '#e8e4d8',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
