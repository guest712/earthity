import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACHIEVEMENTS = [
  // Первые шаги
  { id: 'first_deed', title: 'Искра', desc: 'Первое доброе дело', emoji: '✨', reward: 10, category: '🌱 Первые шаги', condition: (s: any) => s.deeds >= 1 },
  { id: 'ten_deeds', title: 'Огонёк', desc: '10 добрых дел', emoji: '🔥', reward: 30, category: '🌱 Первые шаги', condition: (s: any) => s.deeds >= 10 },
  { id: 'first_level', title: 'Пробуждение', desc: 'Достичь уровня Эко', emoji: '🌿', reward: 50, category: '🌱 Первые шаги', condition: (s: any) => s.xp >= 50 },

  // Эко-воин
  { id: 'clean_5', title: 'Чистые руки', desc: 'Убрать 5 уличных квестов', emoji: '🧤', reward: 25, category: '🌍 Эко-воин', condition: (s: any) => s.outdoorDeeds >= 5 },
  { id: 'clean_20', title: 'Хранитель улиц', desc: 'Убрать 20 уличных квестов', emoji: '🛡', reward: 75, category: '🌍 Эко-воин', condition: (s: any) => s.outdoorDeeds >= 20 },
  { id: 'clean_50', title: 'Легенда района', desc: '50 уличных квестов', emoji: '🏆', reward: 200, category: '🌍 Эко-воин', condition: (s: any) => s.outdoorDeeds >= 50 },

  // Домашний герой
  { id: 'home_5', title: 'Уют', desc: '5 домашних квестов', emoji: '🏠', reward: 20, category: '🏠 Домашний герой', condition: (s: any) => s.homeDeeds >= 5 },
  { id: 'home_10', title: 'Мастер дома', desc: '10 домашних квестов', emoji: '🔑', reward: 50, category: '🏠 Домашний герой', condition: (s: any) => s.homeDeeds >= 10 },

  // Ахимса
  { id: 'ahimsa_pet', title: 'Мир в доме', desc: 'Не накричать на питомца 3 раза', emoji: '🐾', reward: 40, category: '☯ Ахимса', condition: (s: any) => s.petDeeds >= 3 },
  { id: 'ahimsa_level', title: 'Путь ахимсы', desc: 'Достичь уровня Хранитель', emoji: '☯', reward: 100, category: '☯ Ахимса', condition: (s: any) => s.xp >= 150 },

  // Легендарные
  { id: 'legend', title: 'Легенда Earthity', desc: '100 добрых дел', emoji: '⭐', reward: 500, category: '⭐ Легендарные', condition: (s: any) => s.deeds >= 100 },
  { id: 'universal', title: 'Универсал', desc: 'Квесты всех категорий', emoji: '🌍', reward: 300, category: '⭐ Легендарные', condition: (s: any) => s.outdoorDeeds >= 1 && s.homeDeeds >= 1 },
  { id: 'dobri_2500', title: 'Добрый', desc: 'Заработать 2500 добриков за всё время', emoji: '💛', reward: 100, category: '⭐ Легендарные', condition: (s: any) => s.totalDobri >= 2500 },
];

export default function AchievementsScreen() {
  const [stats, setStats] = useState<any>({ deeds: 0, xp: 0, outdoorDeeds: 0, homeDeeds: 0, petDeeds: 0, totalDobri: 0 });
  const [unlocked, setUnlocked] = useState<string[]>([]);

  useEffect(() => {
    const load = () => {
      AsyncStorage.getItem('earthity_save').then(data => {
        if (data) {
          try {
            const save = JSON.parse(data);
            setStats({
              deeds: save.deeds ?? 0,
              xp: save.xp ?? 0,
              outdoorDeeds: save.outdoorDeeds ?? 0,
              homeDeeds: save.homeDeeds ?? 0,
              petDeeds: save.petDeeds ?? 0,
              totalDobri: save.totalDobri ?? 0,
          });
          
            setUnlocked(save.unlocked ?? []);
          } catch (e) { }
        }
      });
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
    
  }, []);

  const categories = [...new Set(ACHIEVEMENTS.map(a => a.category))];
  const unlockedCount = ACHIEVEMENTS.filter(a => a.condition(stats)).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Достижения</Text>
          <Text style={styles.headerSub}>{unlockedCount} / {ACHIEVEMENTS.length} открыто</Text>
        </View>

        {categories.map(cat => (
          <View key={cat} style={styles.category}>
            <Text style={styles.catTitle}>{cat}</Text>
            {ACHIEVEMENTS.filter(a => a.category === cat).map(a => {
              const done = a.condition(stats);
              return (
                <View key={a.id} style={[styles.card, done && styles.cardDone]}>
                  <Text style={[styles.cardEmoji, !done && styles.locked]}>{done ? a.emoji : '🔒'}</Text>
                  <View style={styles.cardBody}>
                    <Text style={[styles.cardTitle, done && styles.cardTitleDone]}>{a.title}</Text>
                    <Text style={styles.cardDesc}>{a.desc}</Text>
                  </View>
                  <View style={styles.cardReward}>
                    <Text style={styles.rewardNum}>+{a.reward}</Text>
                    <Text style={styles.rewardLabel}>🪙</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.motto}>
          <Text style={styles.mottoText}>☯  Каждое доброе дело оставляет след</Text>
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
  catTitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f1a0f', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1e3020', opacity: 0.5 },
  cardDone: { opacity: 1, borderColor: '#2d6a3f' },
  cardEmoji: { fontSize: 28, marginRight: 14 },
  locked: { opacity: 0.4 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  cardTitleDone: { color: '#e8e4d8' },
  cardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  cardReward: { alignItems: 'center' },
  rewardNum: { fontSize: 16, fontWeight: '600', color: '#e8c97a' },
  rewardLabel: { fontSize: 12 },
  motto: { marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#0f1a0f', borderWidth: 1, borderColor: '#1e3020', alignItems: 'center' },
  mottoText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 },
});