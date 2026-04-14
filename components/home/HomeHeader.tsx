import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

type Props = {
  level: string;
  streak: number;
  dobri: number;
  deeds: number;
  xp: number;
  nextXp: number;
  xpProgress: number;
  dobrikiLabel: string;
  deedsLabel: string;
  flag: string;
  onPressLanguage: () => void;
  rewardAnimStyle: any;
};

export default function HomeHeader({
  level,
  streak,
  dobri,
  deeds,
  xp,
  nextXp,
  xpProgress,
  dobrikiLabel,
  deedsLabel,
  flag,
  onPressLanguage,
  rewardAnimStyle,
}: Props) {
  return (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>
            Earth<Text style={styles.brandGreen}>ity</Text>
          </Text>
          <Text style={styles.level}>{level}</Text>
          {streak > 0 && <Text style={styles.streak}>🔥 {streak} дней</Text>}
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Animated.View style={rewardAnimStyle}>
              <Text style={styles.statNum}>{dobri}</Text>
              <Text style={styles.statLabel}>{dobrikiLabel}</Text>
            </Animated.View>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statNumGreen}>{deeds}</Text>
            <Text style={styles.statLabel}>{deedsLabel}</Text>
          </View>

          <TouchableOpacity onPress={onPressLanguage} style={{ padding: 10 }}>
            <Text style={{ fontSize: 22 }}>{flag}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.xpBarBg}>
        <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
        <Text style={styles.xpLabel}>
          {xp} / {nextXp} XP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2a1a',
  },
  brand: {
    fontSize: 28,
    fontWeight: '300',
    color: '#e8f5ea',
    letterSpacing: 1,
  },
  brandGreen: {
    color: '#5aad6a',
  },
  level: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
    letterSpacing: 2,
  },
  streak: {
    fontSize: 11,
    color: '#e8c97a',
    marginTop: 2,
    letterSpacing: 1,
  },
  stats: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e8c97a',
  },
  statNumGreen: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5aad6a',
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
  },
  xpBarBg: {
    height: 18,
    backgroundColor: '#0f1a0f',
    marginHorizontal: 12,
    borderRadius: 9,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  xpBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#3d8b52',
    borderRadius: 9,
  },
  xpLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    letterSpacing: 1,
  },
});