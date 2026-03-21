import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ACHIEVEMENTS: Record<string, any>[] = [
  { id: 'first_deed', title: { ru: 'Искра', de: 'Funke', uk: 'Іскра', ar: 'شرارة', en: 'Spark' }, desc: { ru: 'Первое доброе дело', de: 'Erste gute Tat', uk: 'Перша добра справа', ar: 'أول عمل جيد', en: 'First good deed' }, emoji: '✨', reward: 10, category: 'first', condition: (s: any) => s.deeds >= 1 },
  { id: 'ten_deeds', title: { ru: 'Огонёк', de: 'Flämmchen', uk: 'Вогник', ar: 'شعلة', en: 'Flame' }, desc: { ru: '10 добрых дел', de: '10 gute Taten', uk: '10 добрих справ', ar: '10 أعمال جيدة', en: '10 good deeds' }, emoji: '🔥', reward: 30, category: 'first', condition: (s: any) => s.deeds >= 10 },
  { id: 'first_level', title: { ru: 'Пробуждение', de: 'Erwachen', uk: 'Пробудження', ar: 'صحوة', en: 'Awakening' }, desc: { ru: 'Достичь уровня Эко', de: 'Öko-Level erreichen', uk: 'Досягти рівня Еко', ar: 'الوصول لمستوى إيكو', en: 'Reach Eco level' }, emoji: '🌿', reward: 50, category: 'first', condition: (s: any) => s.xp >= 50 },
  { id: 'clean_5', title: { ru: 'Чистые руки', de: 'Saubere Hände', uk: 'Чисті руки', ar: 'أيدٍ نظيفة', en: 'Clean Hands' }, desc: { ru: '5 уличных квестов', de: '5 Outdoor-Quests', uk: '5 вуличних квестів', ar: '5 مهام خارجية', en: '5 outdoor quests' }, emoji: '🧤', reward: 25, category: 'eco', condition: (s: any) => s.outdoorDeeds >= 5 },
  { id: 'clean_20', title: { ru: 'Хранитель улиц', de: 'Straßenhüter', uk: 'Охоронець вулиць', ar: 'حارس الشوارع', en: 'Street Guardian' }, desc: { ru: '20 уличных квестов', de: '20 Outdoor-Quests', uk: '20 вуличних квестів', ar: '20 مهمة خارجية', en: '20 outdoor quests' }, emoji: '🛡', reward: 75, category: 'eco', condition: (s: any) => s.outdoorDeeds >= 20 },
  { id: 'clean_50', title: { ru: 'Легенда района', de: 'Stadtteillegende', uk: 'Легенда району', ar: 'أسطورة الحي', en: 'District Legend' }, desc: { ru: '50 уличных квестов', de: '50 Outdoor-Quests', uk: '50 вуличних квестів', ar: '50 مهمة خارجية', en: '50 outdoor quests' }, emoji: '🏆', reward: 200, category: 'eco', condition: (s: any) => s.outdoorDeeds >= 50 },
  { id: 'home_5', title: { ru: 'Уют', de: 'Gemütlichkeit', uk: 'Затишок', ar: 'راحة', en: 'Cozy' }, desc: { ru: '5 домашних квестов', de: '5 Heimquests', uk: '5 домашніх квестів', ar: '5 مهام منزلية', en: '5 home quests' }, emoji: '🏠', reward: 20, category: 'home', condition: (s: any) => s.homeDeeds >= 5 },
  { id: 'home_10', title: { ru: 'Мастер дома', de: 'Heimmeister', uk: 'Майстер дому', ar: 'سيد المنزل', en: 'Home Master' }, desc: { ru: '10 домашних квестов', de: '10 Heimquests', uk: '10 домашніх квестів', ar: '10 مهام منزلية', en: '10 home quests' }, emoji: '🔑', reward: 50, category: 'home', condition: (s: any) => s.homeDeeds >= 10 },
  { id: 'ahimsa_pet', title: { ru: 'Мир в доме', de: 'Frieden zuhause', uk: 'Мир у домі', ar: 'السلام في المنزل', en: 'Home Peace' }, desc: { ru: 'Не накричать на питомца 3 раза', de: '3x nicht auf Haustier schreien', uk: 'Не кричати на улюбленця 3 рази', ar: 'عدم الصراخ على الحيوان 3 مرات', en: 'Be kind to pet 3 times' }, emoji: '🐾', reward: 40, category: 'ahimsa', condition: (s: any) => s.petDeeds >= 3 },
  { id: 'ahimsa_level', title: { ru: 'Путь ахимсы', de: 'Pfad der Ahimsa', uk: 'Шлях ахімси', ar: 'طريق الأهيمسا', en: 'Path of Ahimsa' }, desc: { ru: 'Достичь уровня Хранитель', de: 'Hüter-Level erreichen', uk: 'Досягти рівня Хранитель', ar: 'الوصول لمستوى الحارس', en: 'Reach Guardian level' }, emoji: '☯', reward: 100, category: 'ahimsa', condition: (s: any) => s.xp >= 150 },
  { id: 'legend', title: { ru: 'Легенда Earthity', de: 'Earthity-Legende', uk: 'Легенда Earthity', ar: 'أسطورة Earthity', en: 'Earthity Legend' }, desc: { ru: '100 добрых дел', de: '100 gute Taten', uk: '100 добрих справ', ar: '100 عمل جيد', en: '100 good deeds' }, emoji: '⭐', reward: 500, category: 'legend', condition: (s: any) => s.deeds >= 100 },
  { id: 'universal', title: { ru: 'Универсал', de: 'Allrounder', uk: 'Універсал', ar: 'متعدد المهارات', en: 'All-Rounder' }, desc: { ru: 'Квесты всех категорий', de: 'Alle Quest-Kategorien', uk: 'Квести всіх категорій', ar: 'جميع فئات المهام', en: 'All quest categories' }, emoji: '🌍', reward: 300, category: 'legend', condition: (s: any) => s.outdoorDeeds >= 1 && s.homeDeeds >= 1 },
  { id: 'dobri_2500', title: { ru: 'Добрый', de: 'Gütig', uk: 'Добрий', ar: 'طيب', en: 'Kind Soul' }, desc: { ru: 'Заработать 2500 добриков', de: '2500 Dobriki verdienen', uk: 'Заробити 2500 добриків', ar: 'كسب 2500 دوبريكي', en: 'Earn 2500 dobriki' }, emoji: '💛', reward: 100, category: 'legend', condition: (s: any) => s.totalDobri >= 2500 },
];

export default function AchievementsScreen() {
  const [stats, setStats] = useState<any>({ deeds: 0, xp: 0, outdoorDeeds: 0, homeDeeds: 0, petDeeds: 0, totalDobri: 0 });
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [lang, setLang] = useState('ru');
  const [selectedTitle, setSelectedTitle] = useState('');

 function selectTitle(a: any) {
    setSelectedTitle(a.id);
    AsyncStorage.getItem('earthity_save').then(data => {
      const save = data ? JSON.parse(data) : {};
      const existing = save.unlockedTitles || [];
      const alreadyExists = existing.find((t: any) => t.id === a.id);
      const updated = alreadyExists ? existing : [...existing, { id: a.id, title: a.title, emoji: a.emoji }];
      AsyncStorage.setItem('earthity_save', JSON.stringify({ 
        ...save, 
        selectedTitle: a.id, 
        selectedTitleEmoji: a.emoji, 
        selectedTitleName: a.title,
        unlockedTitles: updated,
      }));
    });
  }

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
            if (save.lang) setLang(save.lang);
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
    <Text style={styles.catTitle}>{
      cat === 'first' ? (lang === 'en' ? '🌱 First Steps' : lang === 'de' ? '🌱 Erste Schritte' : lang === 'uk' ? '🌱 Перші кроки' : lang === 'ar' ? '🌱 الخطوات الأولى' : '🌱 Первые шаги') :
      cat === 'eco' ? (lang === 'en' ? '🌍 Eco Warrior' : lang === 'de' ? '🌍 Öko-Kämpfer' : lang === 'uk' ? '🌍 Еко-воїн' : lang === 'ar' ? '🌍 المحارب البيئي' : '🌍 Эко-воин') :
      cat === 'home' ? (lang === 'en' ? '🏠 Home Hero' : lang === 'de' ? '🏠 Heimheld' : lang === 'uk' ? '🏠 Домашній герой' : lang === 'ar' ? '🏠 بطل المنزل' : '🏠 Домашний герой') :
      cat === 'ahimsa' ? '☯ Ahimsa' :
      lang === 'en' ? '⭐ Legendary' : lang === 'de' ? '⭐ Legendär' : lang === 'uk' ? '⭐ Легендарні' : lang === 'ar' ? '⭐ أسطوري' : '⭐ Легендарные'
    }</Text>
            {ACHIEVEMENTS.filter(a => a.category === cat).map(a => {
              const done = a.condition(stats);
              return (
                <TouchableOpacity key={a.id} style={[styles.card, a.category === 'legend' && styles.cardLegend, done && styles.cardDone, done && a.category === 'legend' && styles.cardLegendDone, selectedTitle === a.id && styles.cardSelected]} onPress={() => done && selectTitle(a)} activeOpacity={done ? 0.7 : 1}>
                  <Text style={[styles.cardEmoji, !done && styles.locked]}>{done ? a.emoji : '🔒'}</Text>
                  <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, done && styles.cardTitleDone]}>{a.title[lang] || a.title.en}</Text>
                    <Text style={styles.cardDesc}>{a.desc[lang] || a.desc.en}</Text>
                  </View>
                  <View style={styles.cardReward}>
                    <Text style={styles.rewardNum}>+{a.reward}</Text>
                    <Text style={styles.rewardLabel}>🪙</Text>
                  </View>
                  {done && selectedTitle === a.id && (
  <Text style={{ fontSize: 11, color: '#e8c97a', marginLeft: 8 }}>✓</Text>
)}
                 </TouchableOpacity>
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
  motto: { marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#0f1a0f', borderWidth: 1, borderColor: '#1e3020', alignItems: 'center' },
  mottoText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 },
});