import { loadSave, updateSave } from '../../lib/storage/storage';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ACHIEVEMENTS, type AchievementDefinition, type AchievementProgressSnapshot } from '../../features/achievements/achievements.data';
import {
  achievementCategoriesInOrder,
  achievementStatsFromSave,
  countUnlockedAchievements,
  isAchievementUnlocked,
  mergeUnlockedTitles,
  titleUnlocksEarnedFromProgress,
} from '../../features/achievements/achievements.logic';

const INITIAL_STATS: AchievementProgressSnapshot = {
  deeds: 0,
  xp: 0,
  outdoorDeeds: 0,
  homeDeeds: 0,
  petDeeds: 0,
  totalDobri: 0,
  testDeeds: 0,
};

export default function AchievementsScreen() {
  const { t, lang } = useTranslation();
  const [stats, setStats] = useState<AchievementProgressSnapshot>(INITIAL_STATS);
  const [selectedTitle, setSelectedTitle] = useState('');

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'first':
        return t.achievementsCatFirst;
      case 'eco':
        return t.achievementsCatEco;
      case 'home':
        return t.achievementsCatHome;
      case 'ahimsa':
        return t.achievementsCatAhimsa;
      default:
        return t.achievementsCatLegend;
    }
  };

  async function selectTitle(a: AchievementDefinition) {
    if (!a.givesTitle) return;

    setSelectedTitle(a.id);

    const save = await loadSave();
    const existing = save.unlockedTitles || [];
    const alreadyExists = existing.find((entry) => entry.id === a.id);
    const updated = alreadyExists
      ? existing
      : [...existing, { id: a.id, title: a.title, emoji: a.emoji }];

    await updateSave({
      selectedTitle: a.id,
      selectedTitleEmoji: a.emoji,
      selectedTitleName: a.title,
      unlockedTitles: updated,
    });
  }

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const load = async () => {
        try {
          const save = await loadSave();
          if (cancelled) return;

          const progress = achievementStatsFromSave(save);

          setStats(progress);

          const newTitles = titleUnlocksEarnedFromProgress(progress);
          const existing = save.unlockedTitles || [];
          const { merged, changed } = mergeUnlockedTitles(existing, newTitles);

          if (changed) {
            await updateSave({ unlockedTitles: merged });
          }

          if (!cancelled) {
            setSelectedTitle(save.selectedTitle || '');
          }
        } catch (e) {
          console.warn('Achievements load error', e);
        }
      };

      load();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const categories = achievementCategoriesInOrder();
  const unlockedCount = countUnlockedAchievements(stats);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.achievementsTitle}</Text>
          <Text style={styles.headerSub}>
            {unlockedCount} / {ACHIEVEMENTS.length} {t.achievementsOpened}
          </Text>
        </View>

        {categories.map((cat) => (
          <View key={cat} style={styles.category}>
            <Text style={styles.catTitle}>{getCategoryTitle(cat)}</Text>
            {ACHIEVEMENTS.filter((a) => a.category === cat).map((a) => {
              const done = isAchievementUnlocked(a, stats);
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[
                    styles.card,
                    a.category === 'legend' && styles.cardLegend,
                    done && styles.cardDone,
                    done && a.category === 'legend' && styles.cardLegendDone,
                    selectedTitle === a.id && styles.cardSelected,
                  ]}
                  onPress={() => done && selectTitle(a)}
                  activeOpacity={done ? 0.7 : 1}
                >
                  <Text style={[styles.cardEmoji, !done && styles.locked]}>{done ? a.emoji : '🔒'}</Text>
                  <View style={styles.cardBody}>
                    <Text style={[styles.cardTitle, done && styles.cardTitleDone]}>
                      {a.title[lang] || a.title.en}
                    </Text>
                    <Text style={styles.cardDesc}>{a.desc[lang] || a.desc.en}</Text>
                  </View>
                  <View style={styles.cardReward}>
                    <Text style={styles.rewardNum}>+{a.reward}</Text>
                    <Text style={styles.rewardLabel}>🪙</Text>
                    {a.givesTitle ? <Text style={styles.titleTag}>{t.achievementRank}</Text> : null}
                  </View>
                  {done && selectedTitle === a.id ? (
                    <Text style={{ fontSize: 11, color: '#e8c97a', marginLeft: 8 }}>✓</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={styles.motto}>
          <Text style={styles.mottoText}>{t.achievementsMotto}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c120c' },
  scroll: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  headerTitle: { fontSize: 24, fontWeight: '400', color: '#e8e4d8', letterSpacing: 0.5 },
  headerSub: { fontSize: 13, color: '#5aad6a', marginTop: 4, letterSpacing: 1 },
  category: { marginBottom: 24 },
  catTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1a0f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e3020',
    opacity: 0.5,
  },
  cardDone: { opacity: 1, borderColor: '#2d6a3f' },
  cardLegend: { backgroundColor: '#1a1205', borderColor: '#c9a84c', borderWidth: 1.5 },
  cardLegendDone: { backgroundColor: '#1f1608', borderColor: '#e8c97a', borderWidth: 2 },
  cardEmoji: { fontSize: 28, marginRight: 14 },
  cardSelected: { borderColor: '#e8c97a', borderWidth: 2 },
  locked: { opacity: 0.4 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  cardTitleDone: { color: '#e8e4d8' },
  cardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  cardReward: { alignItems: 'center' },
  rewardNum: { fontSize: 16, fontWeight: '600', color: '#e8c97a' },
  rewardLabel: { fontSize: 12 },
  motto: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0f1a0f',
    borderWidth: 1,
    borderColor: '#1e3020',
    alignItems: 'center',
  },
  titleTag: { fontSize: 10, color: '#e8c97a', letterSpacing: 0.5, marginTop: 4, textAlign: 'center' },
  mottoText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 },
});
