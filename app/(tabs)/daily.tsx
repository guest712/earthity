import { useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DailyProgressBar from '../../components/daily/DailyProgressBar';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { formatTemplate } from '../../lib/i18n/formatTemplate';
import { useDailyQuests } from '../../features/dailyQuests/dailyQuests.context';
import { getDailyQuestTemplate } from '../../lib/shared/daily-engine';
import { updateSave } from '../../lib/storage/storage';
import type { DailyQuestKind } from '../../lib/shared/types';

export default function DailyScreen() {
  const { t, lang } = useTranslation();
  const { state, claim } = useDailyQuests();

  const enriched = useMemo(
    () =>
      state.quests
        .map((q) => {
          const tpl = getDailyQuestTemplate(q.kind);
          return tpl ? { quest: q, tpl } : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [state]
  );

  const handleClaim = async (kind: DailyQuestKind) => {
    const result = claim(kind);
    if (!result.ok) return;
    await updateSave((current) => ({
      dobri: current.dobri + result.rewardDobri,
      totalDobri: current.totalDobri + result.rewardDobri,
      xp: current.xp + result.rewardXp,
    }));
    Alert.alert(
      formatTemplate(t.dailyRewardToast, {
        dobri: result.rewardDobri,
        xp: result.rewardXp,
      })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.dailyTitle}</Text>
        <Text style={styles.subtitle}>{t.dailySubtitle}</Text>
        <Text style={styles.hint}>{t.dailyResetsToday}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {enriched.map(({ quest, tpl }) => {
          const done = quest.progress >= quest.target;
          const claimable = done && !quest.claimed;
          const isMeters = quest.kind === 'walk_meters';

          return (
            <View
              key={quest.kind}
              style={[
                styles.card,
                claimable
                  ? styles.cardClaimable
                  : quest.claimed
                  ? styles.cardClaimed
                  : styles.cardActive,
              ]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.emoji}>{tpl.emoji}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>
                    {tpl.label[lang] ?? tpl.label.en}
                  </Text>
                  <Text style={styles.reward}>
                    +{quest.rewardDobri} 🪙   +{quest.rewardXp} ✨
                  </Text>
                </View>
              </View>

              <DailyProgressBar
                progress={quest.progress}
                target={quest.target}
                unit={isMeters ? ' m' : undefined}
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  !claimable && styles.buttonDisabled,
                  quest.claimed && styles.buttonClaimed,
                ]}
                onPress={() => handleClaim(quest.kind)}
                disabled={!claimable}
              >
                <Text
                  style={[
                    styles.buttonText,
                    !claimable && styles.buttonTextDisabled,
                  ]}
                >
                  {quest.claimed ? t.dailyClaimed : t.dailyClaim}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c120c' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 22, color: '#e8e4d8', letterSpacing: 0.5 },
  subtitle: {
    fontSize: 13,
    color: 'rgba(232,228,216,0.55)',
    marginTop: 4,
  },
  hint: {
    fontSize: 11,
    color: 'rgba(232,228,216,0.4)',
    marginTop: 6,
  },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardActive: {
    backgroundColor: '#0f1a0f',
    borderColor: '#1e3020',
  },
  cardClaimable: {
    backgroundColor: '#0f1a0f',
    borderColor: '#e8c97a',
  },
  cardClaimed: {
    backgroundColor: '#0f1a0f',
    borderColor: '#1e3020',
    opacity: 0.6,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 30 },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    color: '#e8e4d8',
    fontWeight: '600',
  },
  reward: {
    fontSize: 12,
    color: '#e8c97a',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#2d6a3f',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#1e3020' },
  buttonClaimed: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#1e3020' },
  buttonText: { color: '#e8e4d8', fontWeight: '600' },
  buttonTextDisabled: { color: 'rgba(232,228,216,0.4)' },
});
