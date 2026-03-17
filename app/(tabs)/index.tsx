import { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const LANGS: Record<string, any> = {
  ru: {
    level1: '🌱 Росток', level2: '🌿 Эко', level3: '🌳 Хранитель', level4: '⭐ Герой',
    dobriki: 'добриков', deeds: 'дел', nearby: 'задачи рядом', clean: '🌍 Район чист!',
    done: '✅  Выполнено!', back: '← Назад', reward: 'добриков',
    confirm: 'Подтвердить?', yes: 'Да!', no: 'Отмена', how: 'Как выполнить',
    steps_trash: ['Подойди к месту', 'Убери мусор', 'Нажми Выполнено'],
    steps_help: ['Подойди к человеку', 'Предложи помощь', 'Нажми Выполнено'],
    empty: 'Вы убрали всё рядом. Отличная работа!',
  },
  de: {
    level1: '🌱 Keimling', level2: '🌿 Öko', level3: '🌳 Hüter', level4: '⭐ Held',
    dobriki: 'Dobriki', deeds: 'Taten', nearby: 'Aufgaben in der Nähe', clean: '🌍 Sauber!',
    done: '✅  Erledigt!', back: '← Zurück', reward: 'Dobriki',
    confirm: 'Bestätigen?', yes: 'Ja!', no: 'Abbrechen', how: 'So geht\'s',
    steps_trash: ['Geh zum Ort', 'Müll aufheben', 'Erledigt drücken'],
    steps_help: ['Geh zur Person', 'Hilfe anbieten', 'Erledigt drücken'],
    empty: 'Alles aufgeräumt. Gut gemacht!',
  },
  uk: {
    level1: '🌱 Паросток', level2: '🌿 Еко', level3: '🌳 Хранитель', level4: '⭐ Герой',
    dobriki: 'добриків', deeds: 'справ', nearby: 'завдання поруч', clean: '🌍 Район чистий!',
    done: '✅  Виконано!', back: '← Назад', reward: 'добриків',
    confirm: 'Підтвердити?', yes: 'Так!', no: 'Скасувати', how: 'Як виконати',
    steps_trash: ['Підійди до місця', 'Забери сміття', 'Натисни Виконано'],
    steps_help: ['Підійди до людини', 'Запропонуй допомогу', 'Натисни Виконано'],
    empty: 'Ви прибрали все поруч. Чудова робота!',
  },
  ar: {
    level1: '🌱 بذرة', level2: '🌿 أخضر', level3: '🌳 حارس', level4: '⭐ بطل',
    dobriki: 'دوبريكي', deeds: 'أعمال', nearby: 'مهام قريبة', clean: '🌍 الحي نظيف!',
    done: '✅  تم!', back: 'رجوع →', reward: 'دوبريكي',
    confirm: 'تأكيد؟', yes: 'نعم!', no: 'إلغاء', how: 'كيف تنفذ',
    steps_trash: ['اذهب إلى المكان', 'التقط القمامة', 'اضغط تم'],
    steps_help: ['اذهب إلى الشخص', 'اعرض المساعدة', 'اضغط تم'],
    empty: 'لقد نظفت كل شيء. عمل رائع!',
  },
};

const QUESTS = [
  { id: 1, title: { ru: 'Стакан у скамейки', de: 'Becher bei der Bank', uk: 'Стакан біля лавки', ar: 'كوب عند المقعد' }, desc: { ru: 'Парк рядом', de: 'Park nebenan', uk: 'Парк поруч', ar: 'الحديقة' }, reward: 15, emoji: '🥤', type: 'trash' },
  { id: 2, title: { ru: 'Пакет у урны', de: 'Tüte am Mülleimer', uk: 'Пакет біля урни', ar: 'كيس عند السلة' }, desc: { ru: 'Главная улица', de: 'Hauptstraße', uk: 'Головна вулиця', ar: 'الشارع الرئيسي' }, reward: 20, emoji: '🛍', type: 'trash' },
  { id: 3, title: { ru: 'Помочь донести сумку', de: 'Tasche tragen helfen', uk: 'Допомогти нести сумку', ar: 'مساعدة في حمل الحقيبة' }, desc: { ru: 'Рядом с метро', de: 'U-Bahn-Nähe', uk: 'Біля метро', ar: 'بالقرب من المترو' }, reward: 40, emoji: '🤝', type: 'help' },
  { id: 4, title: { ru: 'Бутылки у входа', de: 'Flaschen am Eingang', uk: 'Пляшки біля входу', ar: 'زجاجات عند المدخل' }, desc: { ru: 'Центральная площадь', de: 'Zentralplatz', uk: 'Центральна площа', ar: 'الساحة المركزية' }, reward: 25, emoji: '🍾', type: 'trash' },
];

const FLAG: Record<string, string> = { ru: '🇷🇺', de: '🇩🇪', uk: '🇺🇦', ar: '🇸🇦' };

export default function HomeScreen() {
  const [lang, setLang] = useState<'ru' | 'de' | 'uk' | 'ar' | null>(null);
  const [dobri, setDobri] = useState(0);
  const [deeds, setDeeds] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({}).then(loc => {
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        });
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('earthity_save').then(data => {
      if (data) {
        try {
          const save = JSON.parse(data);
          if (save.dobri) setDobri(save.dobri);
          if (save.deeds) setDeeds(save.deeds);
          if (save.completed) setCompleted(save.completed);
          if (save.lang) setLang(save.lang as 'ru' | 'de' | 'uk' | 'ar');
        } catch (e) { }
      }
    });
  }, []);

  useEffect(() => {
    if (lang !== null) {
      AsyncStorage.setItem('earthity_save', JSON.stringify({ dobri, deeds, completed, lang }));
    }
  }, [dobri, deeds, completed, lang]);

  if (!lang) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.langScreen}>
          <Text style={styles.langSymbol}>🌍</Text>
          <Text style={styles.langTitle}>Earthity</Text>
          <Text style={styles.langSub}>Choose your language</Text>
          <View style={styles.langGrid}>
            {(Object.keys(LANGS) as Array<'ru' | 'de' | 'uk' | 'ar'>).map(l => (
              <TouchableOpacity key={l} style={styles.langBtn} onPress={() => setLang(l)}>
                <Text style={styles.langFlag}>{FLAG[l]}</Text>
                <Text style={styles.langName}>{l.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const t = LANGS[lang];
  const activeQuests = QUESTS.filter(q => !completed.includes(q.id));
  const level = dobri < 50 ? t.level1 : dobri < 150 ? t.level2 : dobri < 300 ? t.level3 : t.level4;

  function complete() {
    if (!selected) return;
    setCompleted(prev => [...prev, selected.id]);
    setDobri(prev => prev + selected.reward);
    setDeeds(prev => prev + 1);
    setSelected(null);
    setConfirming(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Earth<Text style={styles.brandGreen}>ity</Text></Text>
          <Text style={styles.level}>{level}</Text>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{dobri}</Text>
            <Text style={styles.statLabel}>{t.dobriki}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumGreen}>{deeds}</Text>
            <Text style={styles.statLabel}>{t.deeds}</Text>
          </View>
          <TouchableOpacity onPress={() => setLang(null)} style={{ padding: 10 }}>
            <Text style={{ fontSize: 22 }}>{FLAG[lang]}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selected ? (
        <View style={styles.detail}>
          <Text style={styles.detailEmoji}>{selected.emoji}</Text>
          <Text style={styles.detailTitle}>{selected.title[lang]}</Text>
          <Text style={styles.detailDesc}>{selected.desc[lang]}</Text>
          <Text style={styles.detailReward}>🪙 +{selected.reward} {t.reward}</Text>
          <View style={styles.steps}>
            <Text style={styles.stepsLabel}>{t.how}</Text>
            {(selected.type === 'trash' ? t.steps_trash : t.steps_help).map((step: string, i: number) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
          {!confirming ? (
            <TouchableOpacity style={styles.btnComplete} onPress={() => setConfirming(true)}>
              <Text style={styles.btnCompleteText}>{t.done}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.confirmRow}>
              <Text style={styles.confirmText}>{t.confirm}</Text>
              <View style={styles.confirmBtns}>
                <TouchableOpacity style={styles.btnNo} onPress={() => setConfirming(false)}>
                  <Text style={styles.btnNoText}>{t.no}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnYes} onPress={complete}>
                  <Text style={styles.btnYesText}>{t.yes}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <TouchableOpacity style={styles.btnBack} onPress={() => { setSelected(null); setConfirming(false); }}>
            <Text style={styles.btnBackText}>{t.back}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <MapView
  style={{ height: 220, margin: 12, borderRadius: 16 }}
  initialRegion={{
    latitude: location?.latitude ?? 52.52,
    longitude: location?.longitude ?? 13.405,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  }}
  showsUserLocation={true}
  showsMyLocationButton={true}
>
            {activeQuests.map(q => (
              <Marker
                key={q.id}
                coordinate={{ latitude: 52.52 + (q.id * 0.003), longitude: 13.405 + (q.id * 0.002) }}
                title={q.title[lang]}
                description={`+${q.reward} ${t.reward}`}
                onPress={() => setSelected(q)}
              />
            ))}
          </MapView>
          <ScrollView style={styles.list}>
            <Text style={styles.sectionTitle}>
              {activeQuests.length > 0 ? `${activeQuests.length} ${t.nearby}` : t.clean}
            </Text>
            {activeQuests.map(q => (
              <TouchableOpacity key={q.id} style={styles.card} onPress={() => setSelected(q)}>
                <Text style={styles.cardEmoji}>{q.emoji}</Text>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{q.title[lang]}</Text>
                  <Text style={styles.cardDesc}>{q.desc[lang]}</Text>
                </View>
                <Text style={styles.cardReward}>+{q.reward}🪙</Text>
              </TouchableOpacity>
            ))}
            {activeQuests.length === 0 && (
              <Text style={styles.empty}>{t.empty}</Text>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c120c' },
  langScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  langSymbol: { fontSize: 56, marginBottom: 16 },
  langTitle: { fontSize: 36, fontWeight: '300', color: '#e8f5ea', letterSpacing: 2, marginBottom: 8 },
  langSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 40, letterSpacing: 1 },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  langBtn: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#0f1a0f', borderWidth: 1, borderColor: '#1e3020', alignItems: 'center', justifyContent: 'center', gap: 6 },
  langFlag: { fontSize: 28 },
  langName: { fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a2a1a' },
  brand: { fontSize: 28, fontWeight: '300', color: '#e8f5ea', letterSpacing: 1 },
  brandGreen: { color: '#5aad6a' },
  level: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: 2 },
  stats: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '600', color: '#e8c97a' },
  statNumGreen: { fontSize: 20, fontWeight: '600', color: '#5aad6a' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 },
  list: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 16, color: '#e8e4d8', fontWeight: '500', marginBottom: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f1a0f', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1e3020' },
  cardEmoji: { fontSize: 28, marginRight: 14 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, color: '#e8e4d8', fontWeight: '500' },
  cardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 },
  cardReward: { fontSize: 13, color: '#e8c97a', fontWeight: '600' },
  detail: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  detailEmoji: { fontSize: 56, marginBottom: 16 },
  detailTitle: { fontSize: 22, color: '#e8e4d8', fontWeight: '500', textAlign: 'center', marginBottom: 6 },
  detailDesc: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14 },
  detailReward: { fontSize: 17, color: '#e8c97a', fontWeight: '600', marginBottom: 20 },
  steps: { width: '100%', marginBottom: 24 },
  stepsLabel: { fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.3)', marginBottom: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(90,173,106,0.15)', alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 11, color: '#5aad6a', fontWeight: '600' },
  stepText: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  btnComplete: { backgroundColor: '#2d6a3f', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 10 },
  btnCompleteText: { color: 'white', fontSize: 15, fontWeight: '600' },
  confirmRow: { width: '100%', alignItems: 'center', marginBottom: 10 },
  confirmText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
  confirmBtns: { flexDirection: 'row', gap: 10 },
  btnNo: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: '#1e3020' },
  btnNoText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  btnYes: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, backgroundColor: '#2d6a3f' },
  btnYesText: { color: 'white', fontSize: 14, fontWeight: '600' },
  btnBack: { padding: 12 },
  btnBackText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  empty: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40, fontSize: 14, lineHeight: 22 },
});