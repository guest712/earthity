import { loadSave } from '../../lib/storage/storage';
import { formatTemplate } from '../../lib/i18n/formatTemplate';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

export default function StatsScreen() {
  const [stats, setStats] = useState({
    deeds: 0,
    xp: 0,
    dobri: 0,
    totalDobri: 0,
    outdoorDeeds: 0,
    homeDeeds: 0,
    petDeeds: 0,
    streak: 0,
  });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const load = async () => {
        try {
          const save = await loadSave();
          if (cancelled) return;

          setStats({
            deeds: save.deeds,
            xp: save.xp,
            dobri: save.dobri,
            totalDobri: save.totalDobri,
            outdoorDeeds: save.outdoorDeeds,
            homeDeeds: save.homeDeeds,
            petDeeds: save.petDeeds,
            streak: save.streak,
          });
        } catch (e) {
          console.warn('Stats load error', e);
        }
      };

      load();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const { t } = useTranslation();
  const litterKg = Math.round(stats.outdoorDeeds * 0.05 * 10) / 10;

  const impactLine1 = formatTemplate(t.statsImpactTextLitter, { kg: litterKg });
  const impactLine2 = formatTemplate(t.statsImpactTextCreatures, { count: stats.outdoorDeeds });

  const STAT_CARDS = [
    { label: t.statsTotalDeeds, value: stats.deeds, emoji: '💚', color: '#5aad6a' },
    { label: t.statsOutdoor, value: stats.outdoorDeeds, emoji: '🌍', color: '#3d8b52' },
    { label: t.statsHome, value: stats.homeDeeds, emoji: '🏠', color: '#6b9e6b' },
    { label: t.statsPet, value: stats.petDeeds, emoji: '🐾', color: '#7a9fc4' },
    { label: t.statsXp, value: stats.xp, emoji: '⭐', color: '#c9a84c' },
    { label: t.statsTotalDobri, value: stats.totalDobri, emoji: '🪙', color: '#e8c97a' },
    { label: t.statsStreak, value: stats.streak, emoji: '🔥', color: '#e87a3a' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.statsTitle}</Text>
        </View>

        <View style={styles.grid}>
          {STAT_CARDS.map((card, i) => (
            <View key={i} style={[styles.card, { borderColor: card.color + '44' }]}>
              <Text style={styles.cardEmoji}>{card.emoji}</Text>
              <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
              <Text style={styles.cardLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.impactBox}>
          <Text style={styles.impactTitle}>{t.statsImpact}</Text>
          <Text style={styles.impactText}>
            {impactLine1}
            {'\n'}
            {impactLine2}
          </Text>
        </View>

        <View style={styles.motto}>
          <Text style={styles.mottoText}>{t.statsMotto}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c120c' },
  scroll: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '400', color: '#e8e4d8', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  card: { width: '47%', backgroundColor: '#0f1a0f', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1 },
  cardEmoji: { fontSize: 28, marginBottom: 8 },
  cardValue: { fontSize: 28, fontWeight: '600', lineHeight: 32 },
  cardLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'center', letterSpacing: 0.5 },
  impactBox: { backgroundColor: '#0f1a0f', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: 'rgba(90,173,106,0.2)', marginBottom: 16 },
  impactTitle: { fontSize: 15, fontWeight: '500', color: '#5aad6a', marginBottom: 10, letterSpacing: 0.5 },
  impactText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 22 },
  motto: { padding: 16, borderRadius: 12, backgroundColor: '#0f1a0f', borderWidth: 1, borderColor: '#1e3020', alignItems: 'center' },
  mottoText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 },
});