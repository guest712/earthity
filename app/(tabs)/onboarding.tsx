import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';

const SLIDES = [
  {
    emoji: '🌍',
    title: 'Добро пожаловать\nв Earthity',
    text: 'Приложение где добрые дела становятся игрой. Для людей, животных и планеты.',
  },
  {
    emoji: '🪙',
    title: 'Что такое Добрики?',
    text: 'Добрики — внутренняя валюта Earthity. Их нельзя купить. Только заработать реальными добрыми делами.',
  },
  {
    emoji: '🗺️',
    title: 'Как это работает?',
    text: 'Открой карту. Найди квест рядом. Выполни в реальном мире. Получи добрики.',
  },
  {
    emoji: '⚠️',
    title: 'Правила безопасности',
    text: 'Не трогай подозрительные предметы — вызови службы.\nВыполняй квесты только в безопасных местах.\nПомощь людям — только публично и днём.',
  },
  {
    emoji: '☯',
    title: 'Наш принцип',
    text: 'Ахимса — ненасилие по отношению к людям, животным и природе. Это основа всего что мы делаем.',
  },
];

type Props = {
  onDone: () => void;
};

export default function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0);
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
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.text}>{slide.text}</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.btnMain}
            onPress={() => isLast ? onDone() : setStep(s => s + 1)}
          >
            <Text style={styles.btnMainText}>
              {isLast ? '🌱 Начать' : 'Далее →'}
            </Text>
          </TouchableOpacity>

          {step > 0 && (
            <TouchableOpacity style={styles.btnBack} onPress={() => setStep(s => s - 1)}>
              <Text style={styles.btnBackText}>← Назад</Text>
            </TouchableOpacity>
          )}

          {!isLast && (
            <TouchableOpacity style={styles.btnSkip} onPress={onDone}>
              <Text style={styles.btnSkipText}>Пропустить</Text>
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