import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StatsScreen() {
  const [stats, setStats] = useState({
    deeds: 0, xp: 0, dobri: 0, totalDobri: 0,
    outdoorDeeds: 0, homeDeeds: 0, petDeeds: 0,
    streak: 0, lang: 'en',
  });

  useEffect(() => {
    const load = () => {
      AsyncStorage.getItem('earthity_save').then(data => {
        if (data) {
          try {
            const save = JSON.parse(data);
            setStats({
              deeds: save.deeds ?? 0,
              xp: save.xp ?? 0,
              dobri: save.dobri ?? 0,
              totalDobri: save.totalDobri ?? 0,
              outdoorDeeds: save.outdoorDeeds ?? 0,
              homeDeeds: save.homeDeeds ?? 0,
              petDeeds: save.petDeeds ?? 0,
              streak: save.streak ?? 0,
              lang: save.lang ?? 'en',
            });
          } catch (e) {}
        }
      });
    };
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  const LABELS: Record<string, Record<string, string>> = {
    title: { ru: 'Статистика', de: 'Statistik', uk: 'Статистика', ar: 'الإحصاءات', en: 'Statistics' },
    totalDeeds: { ru: 'Всего добрых дел', de: 'Gute Taten gesamt', uk: 'Всього добрих справ', ar: 'إجمالي الأعمال الطيبة', en: 'Total good deeds' },
    outdoor: { ru: 'Уличных квестов', de: 'Outdoor-Quests', uk: 'Вуличних квестів', ar: 'مهام خارجية', en: 'Outdoor quests' },
    home: { ru: 'Домашних квестов', de: 'Heimquests', uk: 'Домашніх квестів', ar: 'مهام منزلية', en: 'Home quests' },
    pet: { ru: 'Ахимса к питомцам', de: 'Ahimsa zu Haustieren', uk: 'Ахімса до тварин', ar: 'أهيمسا للحيوانات', en: 'Ahimsa to pets' },
    xp: { ru: 'Опыта набрано', de: 'Erfahrung gesammelt', uk: 'Досвіду набрано', ar: 'خبرة مكتسبة', en: 'Experience gained' },
    totalDobri: { ru: 'Добриков заработано', de: 'Dobriki verdient', uk: 'Добриків зароблено', ar: 'دوبريكي مكتسبة', en: 'Dobriki earned' },
    streak: { ru: 'Дней подряд', de: 'Tage in Folge', uk: 'Днів поспіль', ar: 'أيام متتالية', en: 'Day streak' },
    impact: { ru: 'Твой вклад', de: 'Dein Beitrag', uk: 'Твій внесок', ar: 'مساهمتك', en: 'Your impact' },
    impactText: { 
      ru: `Ты убрал примерно ${Math.round(stats.outdoorDeeds * 0.05 * 10) / 10} кг мусора.\nЭто ${stats.outdoorDeeds} существ которые не отравились.`, 
      de: `Du hast etwa ${Math.round(stats.outdoorDeeds * 0.05 * 10) / 10} kg Müll aufgehoben.\nDas sind ${stats.outdoorDeeds} Lebewesen die nicht vergiftet wurden.`,
      uk: `Ти прибрав приблизно ${Math.round(stats.outdoorDeeds * 0.05 * 10) / 10} кг сміття.\nЦе ${stats.outdoorDeeds} істот які не отруїлись.`,
      ar: `لقد جمعت حوالي ${Math.round(stats.outdoorDeeds * 0.05 * 10) / 10} كجم من القمامة.\nهذا ${stats.outdoorDeeds} مخلوقاً لم يُسمَّم.`,
      en: `You picked up about ${Math.round(stats.outdoorDeeds * 0.05 * 10) / 10} kg of litter.\nThat's ${stats.outdoorDeeds} creatures that weren't poisoned.`,
    },
  };

  const l = stats.lang as string;
  const label = (key: string) => LABELS[key]?.[l] || LABELS[key]?.en || key;

  const STAT_CARDS = [
    { label: label('totalDeeds'), value: stats.deeds, emoji: '💚', color: '#5aad6a' },
    { label: label('outdoor'), value: stats.outdoorDeeds, emoji: '🌍', color: '#3d8b52' },
    { label: label('home'), value: stats.homeDeeds, emoji: '🏠', color: '#6b9e6b' },
    { label: label('pet'), value: stats.petDeeds, emoji: '🐾', color: '#7a9fc4' },
    { label: label('xp'), value: stats.xp, emoji: '⭐', color: '#c9a84c' },
    { label: label('totalDobri'), value: stats.totalDobri, emoji: '🪙', color: '#e8c97a' },
    { label: label('streak'), value: stats.streak, emoji: '🔥', color: '#e87a3a' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>{label('title')}</Text>
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
          <Text style={styles.impactTitle}>{label('impact')}</Text>
          <Text style={styles.impactText}>{label('impactText')}</Text>
        </View>

        <View style={styles.motto}>
          <Text style={styles.mottoText}>☯  {stats.lang === 'en' ? 'Every deed matters' : stats.lang === 'de' ? 'Jede Tat zählt' : stats.lang === 'uk' ? 'Кожна справа важлива' : stats.lang === 'ar' ? 'كل عمل مهم' : 'Каждое дело важно'}</Text>
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