import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SLIDES = [
  {
    emoji: '🌍',
    title: { ru: 'Добро пожаловать\nв Earthity', de: 'Willkommen\nbei Earthity', uk: 'Ласкаво просимо\nдо Earthity', ar: 'مرحباً\nفي Earthity', en: 'Welcome\nto Earthity' },
    text: { ru: 'Приложение где добрые дела становятся игрой. Для людей, животных и планеты.', de: 'Die App wo gute Taten zum Spiel werden. Für Menschen, Tiere und den Planeten.', uk: 'Застосунок де добрі справи стають грою. Для людей, тварин і планети.', ar: 'التطبيق الذي يحول الأعمال الطيبة إلى لعبة. للناس والحيوانات والكوكب.', en: 'The app where good deeds become a game. For people, animals and the planet.' },
  },
  {
    emoji: '🪙',
    title: { ru: 'Что такое Добрики?', de: 'Was sind Dobriki?', uk: 'Що таке Добрики?', ar: 'ما هي الدوبريكي؟', en: 'What are Dobriki?' },
    text: { ru: 'Добрики — внутренняя валюта Earthity. Их нельзя купить. Только заработать реальными добрыми делами.', de: 'Dobriki sind die interne Währung von Earthity. Man kann sie nicht kaufen. Nur durch echte gute Taten verdienen.', uk: 'Добрики — внутрішня валюта Earthity. Їх не можна купити. Тільки заробити реальними добрими справами.', ar: 'الدوبريكي هي العملة الداخلية لـ Earthity. لا يمكن شراؤها. فقط كسبها بأعمال طيبة حقيقية.', en: 'Dobriki are the internal currency of Earthity. You cannot buy them. Only earn them through real good deeds.' },
  },
  {
    emoji: '🗺️',
    title: { ru: 'Как это работает?', de: 'Wie funktioniert es?', uk: 'Як це працює?', ar: 'كيف يعمل؟', en: 'How does it work?' },
    text: { ru: 'Открой карту. Найди квест рядом. Выполни в реальном мире. Получи добрики.', de: 'Öffne die Karte. Finde eine Quest in der Nähe. Erledige sie in der echten Welt. Erhalte Dobriki.', uk: 'Відкрий карту. Знайди квест поруч. Виконай у реальному світі. Отримай добрики.', ar: 'افتح الخريطة. ابحث عن مهمة قريبة. نفذها في العالم الحقيقي. احصل على دوبريكي.', en: 'Open the map. Find a quest nearby. Complete it in the real world. Get Dobriki.' },
  },
  {
    emoji: '⚠️',
    title: { ru: 'Правила безопасности', de: 'Sicherheitsregeln', uk: 'Правила безпеки', ar: 'قواعد السلامة', en: 'Safety Rules' },
    text: { ru: 'Не трогай подозрительные предметы — вызови службы.\nВыполняй квесты только в безопасных местах.\nПомощь людям — только публично и днём.', de: 'Berühre keine verdächtigen Gegenstände — ruf die Behörden.\nErledige Quests nur an sicheren Orten.\nHilf Menschen nur öffentlich und tagsüber.', uk: 'Не торкайся підозрілих предметів — виклич служби.\nВиконуй квести лише у безпечних місцях.\nДопомога людям — лише публічно і вдень.', ar: 'لا تلمس الأشياء المشبوهة — اتصل بالسلطات.\nنفذ المهام في أماكن آمنة فقط.\nمساعدة الناس علنياً وفي النهار فقط.', en: 'Do not touch suspicious objects — call authorities.\nComplete quests only in safe places.\nHelp people only publicly and during the day.' },
  },
  {
    emoji: '☯',
    title: { ru: 'Наш принцип', de: 'Unser Prinzip', uk: 'Наш принцип', ar: 'مبدأنا', en: 'Our Principle' },
    text: { ru: 'Ахимса — ненасилие по отношению к людям, животным и природе. Это основа всего что мы делаем.', de: 'Ahimsa — Gewaltlosigkeit gegenüber Menschen, Tieren und der Natur. Das ist die Grundlage von allem was wir tun.', uk: 'Ахімса — ненасильство по відношенню до людей, тварин і природи. Це основа всього що ми робимо.', ar: 'أهيمسا — اللاعنف تجاه الناس والحيوانات والطبيعة. هذا أساس كل ما نفعله.', en: 'Ahimsa — non-violence towards people, animals and nature. This is the foundation of everything we do.' },
  },
];

type Props = {
  onDone: () => void;
  lang?: string;
};

export default function Onboarding({ onDone, lang: initialLang }: Props) {
  const [step, setStep] = useState(0);
 const [lang, setLang] = useState<'ru' | 'de' | 'uk' | 'ar' | 'en'>(
    (['ru','de','uk','ar','en'].includes(initialLang || '') ? initialLang : 'en') as any
  );
console.log('initialLang:', initialLang, 'lang:', lang);
  useEffect(() => {
  if (initialLang) setLang(initialLang as any);
}, [initialLang]);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        {/* Slide */}
        <View style={styles.slide}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
          <Text style={styles.title}>{typeof slide.title === 'object' ? slide.title[lang] || slide.title.en : slide.title}</Text>
          <Text style={styles.text}>{typeof slide.text === 'object' ? slide.text[lang] || slide.text.en : slide.text}</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.btnMain}
            onPress={() => isLast ? onDone() : setStep(s => s + 1)}
          >
            <Text style={styles.btnMainText}>
              {isLast ? (lang === 'en' ? '🌱 Start' : lang === 'de' ? '🌱 Starten' : lang === 'uk' ? '🌱 Почати' : lang === 'ar' ? '🌱 ابدأ' : '🌱 Начать') : (lang === 'en' ? 'Next →' : lang === 'de' ? 'Weiter →' : lang === 'uk' ? 'Далі →' : lang === 'ar' ? 'التالي →' : 'Далее →')}
            </Text>
          </TouchableOpacity>

          {step > 0 && (
            <TouchableOpacity style={styles.btnBack} onPress={() => setStep(s => s - 1)}>
              <Text style={styles.btnBackText}>{lang === 'en' ? '← Back' : lang === 'de' ? '← Zurück' : lang === 'uk' ? '← Назад' : lang === 'ar' ? 'رجوع →' : '← Назад'}</Text>
            </TouchableOpacity>
          )}

          {!isLast && (
            <TouchableOpacity style={styles.btnSkip} onPress={onDone}>
             <Text style={styles.btnSkipText}>{lang === 'en' ? 'Skip' : lang === 'de' ? 'Überspringen' : lang === 'uk' ? 'Пропустити' : lang === 'ar' ? 'تخطي' : 'Пропустить'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c120c' },
  content: { flex: 1, padding: 28, justifyContent: 'space-between' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1e3020' },
  dotActive: { backgroundColor: '#5aad6a', width: 20 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  emoji: { fontSize: 72 },
  title: { fontSize: 28, fontWeight: '400', color: '#e8e4d8', textAlign: 'center', lineHeight: 36 },
  text: { fontSize: 15, color: '#8aab8a', textAlign: 'center', lineHeight: 24, maxWidth: 300 },
  buttons: { gap: 10, paddingBottom: 20 },
  btnMain: { backgroundColor: '#2d6a3f', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnMainText: { color: 'white', fontSize: 16, fontWeight: '600' },
  btnBack: { paddingVertical: 12, alignItems: 'center' },
  btnBackText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  btnSkip: { paddingVertical: 8, alignItems: 'center' },
  btnSkipText: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
});