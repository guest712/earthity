import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Onboarding from './onboarding';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});



const LANGS: Record<string, any> = {
  ru: {
    level1: '🌱 Росток', level2: '🌿 Эко', level3: '🌳 Хранитель', level4: '⭐ Герой',
    dobriki: 'добриков', deeds: 'дел', nearby: 'задачи рядом', clean: '🌍 Район чист!',
    done: '✅  Выполнено!', back: '← Назад', reward: 'добриков',
    confirm: 'Подтвердить?', yes: 'Да!', no: 'Отмена', how: 'Как выполнить',
    steps_trash: ['Подойди к месту', 'Убери мусор', 'Нажми Выполнено'],
    steps_help: ['Подойди к человеку', 'Предложи помощь', 'Нажми Выполнено'],
    steps_home: ['Сделай дома', 'Будь осознанным', 'Нажми Выполнено'],
    empty: 'Вы убрали всё рядом. Отличная работа!',
    catAll: 'Все', catOutdoor: 'Улица', catHome: 'Дома',
  },
  de: {
    level1: '🌱 Keimling', level2: '🌿 Öko', level3: '🌳 Hüter', level4: '⭐ Held',
    dobriki: 'Dobriki', deeds: 'Taten', nearby: 'Aufgaben in der Nähe', clean: '🌍 Sauber!',
    done: '✅  Erledigt!', back: '← Zurück', reward: 'Dobriki',
    confirm: 'Bestätigen?', yes: 'Ja!', no: 'Abbrechen', how: 'So geht\'s',
    steps_trash: ['Geh zum Ort', 'Müll aufheben', 'Erledigt drücken'],
    steps_help: ['Geh zur Person', 'Hilfe anbieten', 'Erledigt drücken'],
    steps_home: ['Zu Hause machen', 'Achtsam sein', 'Erledigt drücken'],
    empty: 'Alles aufgeräumt. Gut gemacht!',
    catAll: 'Alle', catOutdoor: 'Draußen', catHome: 'Zuhause',
  },
  uk: {
    level1: '🌱 Паросток', level2: '🌿 Еко', level3: '🌳 Хранитель', level4: '⭐ Герой',
    dobriki: 'добриків', deeds: 'справ', nearby: 'завдання поруч', clean: '🌍 Район чистий!',
    done: '✅  Виконано!', back: '← Назад', reward: 'добриків',
    confirm: 'Підтвердити?', yes: 'Так!', no: 'Скасувати', how: 'Як виконати',
    steps_trash: ['Підійди до місця', 'Забери сміття', 'Натисни Виконано'],
    steps_help: ['Підійди до людини', 'Запропонуй допомогу', 'Натисни Виконано'],
    steps_home: ['Зроби вдома', 'Будь усвідомленим', 'Натисни Виконано'],
    empty: 'Ви прибрали все поруч. Чудова робота!',
    catAll: 'Всі', catOutdoor: 'Вулиця', catHome: 'Вдома',
  },
  ar: {
    level1: '🌱 بذرة', level2: '🌿 أخضر', level3: '🌳 حارس', level4: '⭐ بطل',
    dobriki: 'دوبريكي', deeds: 'أعمال', nearby: 'مهام قريبة', clean: '🌍 الحي نظيف!',
    done: '✅  تم!', back: 'رجوع →', reward: 'دوبريكي',
    confirm: 'تأكيد؟', yes: 'نعم!', no: 'إلغاء', how: 'كيف تنفذ',
    steps_trash: ['اذهب إلى المكان', 'التقط القمامة', 'اضغط تم'],
    steps_help: ['اذهب إلى الشخص', 'اعرض المساعدة', 'اضغط تم'],
    steps_home: ['افعل ذلك في المنزل', 'كن واعياً', 'اضغط تم'],
    empty: 'لقد نظفت كل شيء. عمل رائع!',
    catAll: 'الكل', catOutdoor: 'خارج', catHome: 'منزل',
  },
  en: {
    level1: '🌱 Sprout', level2: '🌿 Eco', level3: '🌳 Guardian', level4: '⭐ Hero',
    dobriki: 'dobriki', deeds: 'deeds', nearby: 'quests nearby', clean: '🌍 Area is clean!',
    done: '✅  Done!', back: '← Back', reward: 'dobriki',
    confirm: 'Confirm?', yes: 'Yes!', no: 'Cancel', how: 'How to complete',
    steps_trash: ['Go to the location', 'Pick up the litter', 'Press Done'],
    steps_help: ['Go to the person', 'Offer your help', 'Press Done'],
    steps_home: ['Do it at home', 'Be mindful', 'Press Done'],
    empty: 'You cleaned everything nearby. Great job!',
    catAll: 'All', catOutdoor: 'Outdoor', catHome: 'Home',
  },
};

const QUESTS = [
  { id: 1, title: { ru: 'Стакан у скамейки', de: 'Becher bei der Bank', uk: 'Стакан біля лавки', ar: 'كوب عند المقعد', en: 'Cup by the bench' }, desc: { ru: 'Парк рядом', de: 'Park nebenan', uk: 'Парк поруч', ar: 'الحديقة', en: 'Nearby park' }, reward: 15, emoji: '🥤', type: 'trash' },
  { id: 2, title: { ru: 'Пакет у урны', de: 'Tüte am Mülleimer', uk: 'Пакет біля урни', ar: 'كيس عند السلة', en: 'Bag by the bin' }, desc: { ru: 'Главная улица', de: 'Hauptstraße', uk: 'Головна вулиця', ar: 'الشارع الرئيسي', en: 'Main street' }, reward: 20, emoji: '🛍', type: 'trash' },
  { id: 3, title: { ru: 'Помочь донести сумку', de: 'Tasche tragen helfen', uk: 'Допомогти нести сумку', ar: 'مساعدة في حمل الحقيبة', en: 'Help carry bags' }, desc: { ru: 'Рядом с метро', de: 'U-Bahn-Nähe', uk: 'Біля метро', ar: 'بالقرب من المترو', en: 'Near metro' }, reward: 40, emoji: '🤝', type: 'help' },
  { id: 4, title: { ru: 'Бутылки у входа', de: 'Flaschen am Eingang', uk: 'Пляшки біля входу', ar: 'زجاجات عند المدخل', en: 'Bottles at entrance' }, desc: { ru: 'Центральная площадь', de: 'Zentralplatz', uk: 'Центральна площа', ar: 'الساحة المركزية', en: 'Central square' }, reward: 25, emoji: '🍾', type: 'trash' },
  { id: 5, title: { ru: 'Вынести мусор', de: 'Müll rausbringen', uk: 'Винести сміття', ar: 'إخراج القمامة', en: 'Take out trash' }, desc: { ru: 'Домашний квест', de: 'Heimquest', uk: 'Домашнє завдання', ar: 'مهمة منزلية', en: 'Home quest' }, reward: 5, emoji: '🗑️', type: 'home' },
  { id: 6, title: { ru: 'Полить цветы', de: 'Blumen gießen', uk: 'Полити квіти', ar: 'سقي الزهور', en: 'Water the plants' }, desc: { ru: 'Домашний квест', de: 'Heimquest', uk: 'Домашнє завдання', ar: 'مهمة منزلية', en: 'Home quest' }, reward: 5, emoji: '🌸', type: 'home' },
  { id: 7, title: { ru: 'Спортивные упражнения', de: 'Sport machen', uk: 'Спортивні вправи', ar: 'تمارين رياضية', en: 'Exercise' }, desc: { ru: 'Домашний квест', de: 'Heimquest', uk: 'Домашнє завдання', ar: 'مهمة منزلية', en: 'Home quest' }, reward: 8, emoji: '💪', type: 'home' },
  { id: 8, title: { ru: 'Нарисовать что-нибудь', de: 'Etwas zeichnen', uk: 'Намалювати щось', ar: 'رسم شيء ما', en: 'Draw something' }, desc: { ru: 'Для творцов', de: 'Für Kreative', uk: 'Для творців', ar: 'للمبدعين', en: 'For creators' }, reward: 10, emoji: '🎨', type: 'home' },
  { id: 9, title: { ru: 'Не накричать на питомца', de: 'Nicht auf Haustier schreien', uk: 'Не накричати на улюбленця', ar: 'عدم الصراخ على الحيوان', en: 'Be kind to your pet' }, desc: { ru: 'Ахимса дома', de: 'Ahimsa zuhause', uk: 'Ахімса вдома', ar: 'أهيمسا في المنزل', en: 'Ahimsa at home' }, reward: 15, emoji: '🐾', type: 'home' },
  { id: 10, title: { ru: 'Отсортировать мусор', de: 'Müll sortieren', uk: 'Відсортувати сміття', ar: 'فرز القمامة', en: 'Sort the recycling' }, desc: { ru: 'Домашний квест', de: 'Heimquest', uk: 'Домашнє завдання', ar: 'مهمة منزلية', en: 'Home quest' }, reward: 8, emoji: '♻️', type: 'home' },
  { id: 11, title: { ru: 'Тест', de: 'Test', uk: 'Тест', ar: 'اختبار', en: 'Test' }, desc: { ru: 'Тестовый квест', de: 'Testquest', uk: 'Тестовий квест', ar: 'مهمة اختبار', en: 'Test quest' }, reward: 1, emoji: '🧪', type: 'test' },
];
const CREATURES = [
  { id: 'flower1', type: 'flower', image: require('../../assets/images/creatures/flower_1.png'), label: { ru: 'Цветок', de: 'Blume', uk: 'Квітка', ar: 'زهرة', en: 'Flower' }, reward: 8, cooldown: 3600000 },
  { id: 'flower2', type: 'flower', image: require('../../assets/images/creatures/sunflower.png'), label: { ru: 'Подсолнух', de: 'Sonnenblume', uk: 'Соняшник', ar: 'عباد الشمس', en: 'Sunflower' }, reward: 8, cooldown: 3600000 },
  { id: 'animal1', type: 'animal', image: require('../../assets/images/creatures/fox.png'), label: { ru: 'Лисёнок', de: 'Fuchs', uk: 'Лисеня', ar: 'ثعلب', en: 'Fox' }, reward: 15, cooldown: 7200000 },
  { id: 'animal2', type: 'animal', image: require('../../assets/images/creatures/turtoise.png'), label: { ru: 'Черепашка', de: 'Schildkröte', uk: 'Черепашка', ar: 'سلحفاة', en: 'Turtle' }, reward: 12, cooldown: 7200000 },
  { id: 'animal3', type: 'animal', image: require('../../assets/images/creatures/butterfly.png'), label: { ru: 'Бабочка', de: 'Schmetterling', uk: 'Метелик', ar: 'فراشة', en: 'Butterfly' }, reward: 10, cooldown: 7200000 },
  { id: 'codariocalyx', type: 'flower', image: require('../../assets/images/creatures/desmodium.png'), label: { ru: 'Кодариокаликс', de: 'Codariocalyx', uk: 'Кодаріокалікс', ar: 'كوداريوكاليكس', en: 'Codariocalyx' }, reward: 12, cooldown: 5400000 },
];

const WATER_SPOTS = [
  { id: 'water1' },
  { id: 'water2' },
  { id: 'water3' },
];

const MINDFUL_PHRASES = [
  { ru: 'Этот мусор лежит здесь потому что кто-то решил что земля — его мусорное ведро. Ты думаешь иначе.', en: 'This litter is here because someone decided the earth is their bin. You think differently.', de: 'Dieser Müll liegt hier, weil jemand die Erde als seine Mülltonne betrachtet. Du denkst anders.', uk: 'Це сміття тут тому що хтось вирішив що земля — його смітник. Ти думаєш інакше.', ar: 'هذه القمامة هنا لأن شخصاً ما قرر أن الأرض سلة مهملاته. أنت تفكر بشكل مختلف.' },
  { ru: 'Каждый убранный предмет — это существо которое не отравится. Спасибо тебе.', en: 'Every piece of litter removed is a creature that won\'t be poisoned. Thank you.', de: 'Jedes aufgehobene Stück ist ein Lebewesen das nicht vergiftet wird. Danke.', uk: 'Кожен прибраний предмет — це істота яка не отруїться. Дякую тобі.', ar: 'كل قطعة تُزال هي مخلوق لن يُسمَّم. شكراً لك.' },
  { ru: 'Ты только что сделал мир чуть чище для кого-то кто ещё не родился.', en: 'You just made the world a little cleaner for someone not yet born.', de: 'Du hast die Welt gerade etwas sauberer gemacht für jemanden der noch nicht geboren ist.', uk: 'Ти щойно зробив світ трохи чистішим для когось хто ще не народився.', ar: 'لقد جعلت العالم أكثر نظافة قليلاً لشخص لم يولد بعد.' },
  { ru: 'Небольшое действие. Большое значение. Ахимса в действии.', en: 'Small action. Big meaning. Ahimsa in action.', de: 'Kleine Handlung. Große Bedeutung. Ahimsa in Aktion.', uk: 'Маленька дія. Велике значення. Ахімса в дії.', ar: 'فعل صغير. معنى كبير. أهيمسا في العمل.' },
  { ru: 'Природа не просит о помощи словами. Она просит действиями.', en: 'Nature doesn\'t ask for help with words. It asks through actions.', de: 'Die Natur bittet nicht mit Worten um Hilfe. Sie bittet durch Handlungen.', uk: 'Природа не просить допомоги словами. Вона просить діями.', ar: 'الطبيعة لا تطلب المساعدة بالكلمات. تطلبها من خلال الأفعال.' },
];

const FLAG: Record<string, string> = { ru: '🇷🇺', de: '🇩🇪', uk: '🇺🇦', ar: '🇸🇦', en: '🇬🇧' };

const getLevelName = (xp: number, t: any) =>
  xp < 50 ? t.level1 : xp < 150 ? t.level2 : xp < 300 ? t.level3 : t.level4;

const getLevelKey = (xp: number) =>
  xp < 50 ? 'level1' : xp < 150 ? 'level2' : xp < 300 ? 'level3' : 'level4';

export default function HomeScreen() {
  const [lang, setLang] = useState<'ru' | 'de' | 'uk' | 'ar' | 'en' | null>(null);
  const [dobri, setDobri] = useState(0);
  const [totalDobri, setTotalDobri] = useState(0);
  const [xp, setXp] = useState(0);
  const [deeds, setDeeds] = useState(0);
  const [mapMode, setMapMode] = useState<'standard' | 'satellite'>('standard');
  const [creatureCooldowns, setCreatureCooldowns] = useState<Record<string, number>>({});
  const [selectedCreature, setSelectedCreature] = useState<any>(null);
  const [feedingProgress, setFeedingProgress] = useState(0);
  const [isFeeding, setIsFeeding] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [category, setCategory] = useState<'all' | 'outdoor' | 'home'>('all');
  const [onboarded, setOnboarded] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastOpenDate, setLastOpenDate] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [testDeeds, setTestDeeds] = useState(0);
  const [waterLevel, setWaterLevel] = useState(10);
  const [showConfirmBtn, setShowConfirmBtn] = useState(false);
  const playRewardSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/reward.mp3')
    );
    await sound.playAsync();
  };
  const prevLevelKey = useRef('');const rewardScale = useSharedValue(1);
  const rewardOpacity = useSharedValue(1);

  const rewardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rewardScale.value }],
    opacity: rewardOpacity.value,
  }));


  function animateReward() {
    rewardOpacity.value = withTiming(1, { duration: 100 });
    rewardScale.value = withSequence(
      withSpring(1.5),
      withSpring(1),
    );
    setTimeout(() => {
      rewardOpacity.value = withTiming(1, { duration: 500 });
    }, 800);
  }
  const [outdoorDeeds, setOutdoorDeeds] = useState(0);
  const [homeDeeds, setHomeDeeds] = useState(0);
  const [petDeeds, setPetDeeds] = useState(0);
const breathScale = useSharedValue(1);

useEffect(() => {
  breathScale.value = withRepeat(
    withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
    -1,
    true
  );
}, []);

const breathStyle = useAnimatedStyle(() => ({
  transform: [{ scale: breathScale.value }],
}));


  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  async function scheduleCreatureNotification(creature: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌍 Earthity',
        body: creature.type === 'flower' 
          ? `${creature.emoji} Цветок хочет пить! Полей его.`
          : `${creature.emoji} ${creature.label['ru']} голоден! Покорми его.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: creature.cooldown / 1000,
      },
    });
  }

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({}).then(loc => {
          setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
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
          if (save.xp) setXp(save.xp);
          if (save.deeds) setDeeds(save.deeds);
          if (save.completed) setCompleted(save.completed);
          if (save.lang) setLang(save.lang as 'ru' | 'de' | 'uk' | 'ar' | 'en');
          if (save.onboarded) setOnboarded(true);
          if (save.outdoorDeeds) setOutdoorDeeds(save.outdoorDeeds);
          if (save.homeDeeds) setHomeDeeds(save.homeDeeds);
          if (save.petDeeds) setPetDeeds(save.petDeeds);
          if (save.testDeeds) setTestDeeds(save.testDeeds)
          if (save.waterLevel !== undefined) setWaterLevel(save.waterLevel);
         setTotalDobri(save.totalDobri || save.dobri || 0);
         const today = new Date().toDateString();
          const last = save.lastOpenDate || '';
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          
          if (last === today) {
            setStreak(save.streak || 0);
          } else if (last === yesterday) {
            const newStreak = (save.streak || 0) + 1;
            setStreak(newStreak);
          } else if (last !== '') {
            setStreak(1);
          } else {
            setStreak(1);
          }
          setLastOpenDate(today);
        } catch (e) { }
      }
    });
  }, []);

 useEffect(() => {
    AsyncStorage.getItem('earthity_save').then(existing => {
      const old = existing ? JSON.parse(existing) : {};
      AsyncStorage.setItem('earthity_save', JSON.stringify({ ...old, dobri, xp, deeds, completed, lang, onboarded, outdoorDeeds, homeDeeds, petDeeds, totalDobri, streak, lastOpenDate, testDeeds, waterLevel }));
    });
  }, [dobri, xp, deeds, completed, lang, onboarded, outdoorDeeds, homeDeeds, petDeeds, totalDobri, streak, lastOpenDate, testDeeds, waterLevel]);

  useEffect(() => {
    const currentKey = getLevelKey(xp);
    if (prevLevelKey.current && prevLevelKey.current !== currentKey) {
      setDobri(prev => prev + 50);
    }
    prevLevelKey.current = currentKey;
  }, [xp]);



  if (!lang) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.langScreen}>
          <Text style={styles.langSymbol}>🌍</Text>
          <Text style={styles.langTitle}>Earthity</Text>
          <Text style={styles.langSub}>Choose your language</Text>
          <View style={styles.langGrid}>
            {(Object.keys(LANGS) as Array<'ru' | 'de' | 'uk' | 'ar' | 'en'>).map(l => (
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
  
  if (!onboarded) {
    return <Onboarding onDone={() => setOnboarded(true)} lang={lang} />;
  }

  const t = LANGS[lang];
  const activeQuests = QUESTS.filter(q => !completed.includes(q.id));
  const filteredQuests = activeQuests.filter(q => {
    if (category === 'outdoor') return q.type === 'trash' || q.type === 'help';
    if (category === 'home') return q.type === 'home';
    return true;
  });
  const level = getLevelName(xp, t);
  const nextXp = xp < 50 ? 50 : xp < 150 ? 150 : xp < 300 ? 300 : 500;
  const prevXp = xp < 50 ? 0 : xp < 150 ? 50 : xp < 300 ? 150 : 300;
  const xpProgress = Math.min(100, ((xp - prevXp) / (nextXp - prevXp)) * 100);

  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

 function complete() {
    if (!selected) return;
    const type = selected.type;
    const id = selected.id;
    setCompleted(prev => [...prev, id]);
    setDobri(prev => prev + selected.reward);
    setTotalDobri(prev => prev + selected.reward);
    const streakBonus = streak >= 20 ? 1.15 : streak >= 10 ? 1.10 : streak >= 5 ? 1.05 : 1;
    setXp(prev => prev + Math.round(selected.reward * streakBonus));
    setDeeds(prev => prev + 1);
    if (type === 'trash' || type === 'help') {
      setOutdoorDeeds(prev => prev + 1);
    } else if (type === 'home') {
      setHomeDeeds(prev => prev + 1);
      if (id === 9) setPetDeeds(prev => prev + 1);
    }
    if (selected.type === 'test') {
      setTestDeeds(prev => prev + 1);
    }
    animateReward();
    playRewardSound();
    setSelected(null);
    setConfirming(false);
    setShowConfirmBtn(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Earth<Text style={styles.brandGreen}>ity</Text></Text>
            <Text style={styles.level}>{level}</Text>
            {streak > 0 && (
              <Text style={styles.streak}>🔥 {streak} дней</Text>
            )}
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
             <Animated.View style={rewardAnimStyle}>
                <Text style={styles.statNum}>{dobri}</Text>
                <Text style={styles.statLabel}>{t.dobriki}</Text>
              </Animated.View>
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
        <View style={styles.xpBarBg}>
          <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
          <Text style={styles.xpLabel}>{xp} / {nextXp} XP</Text>
        </View>
      </View>
      {selectedCreature && (
  <View style={styles.creaturePopup}>
    {selectedCreature.id === 'animal1' ? (
      <Animated.Image
        source={selectedCreature.image}
        style={[{ width: 80, height: 80, marginBottom: 8 }, breathStyle]}
      />
    ) : (
      <Image
        source={selectedCreature.image}
        style={{ width: 80, height: 80, marginBottom: 8 }}
      />
    )}
          <Text style={styles.creatureName}>{selectedCreature.label[lang]}</Text>
          <Text style={styles.creatureReward}>+{selectedCreature.reward} 🪙</Text>
          {selectedCreature.type === 'flower' && (
  <Text style={{ fontSize: 13, color: '#7ab8f5', marginBottom: 8 }}>
    💧 Вода: {waterLevel} / 10
  </Text>
)}
          {isFeeding && (
            <View style={styles.feedingBarBg}>
              <View style={[styles.feedingBarFill, { width: `${feedingProgress}%` }]} />
            </View>
          )}
          <TouchableOpacity
          
            style={styles.creatureBtn}
           onPress={() => {
  const now = Date.now();
  const lastTime = creatureCooldowns[selectedCreature.id] || 0;
  const creatureIndex = CREATURES.findIndex(c => c.id === selectedCreature.id);
  const creatureLat = (location?.latitude ?? 52.52) + (Math.sin(creatureIndex * 1.5) * 0.003);
  const creatureLon = (location?.longitude ?? 13.405) + (Math.cos(creatureIndex * 1.5) * 0.003);
  const dist = location ? getDistance(location.latitude, location.longitude, creatureLat, creatureLon) : 999;
  
  if (dist > 300) {
    alert('Подойдите ближе! 📍');
    return;
  }

  if (selectedCreature.type === 'flower' && waterLevel <= 0) {
    alert('Лейка пуста! Найдите родник 💧');
    return;
  }

  if (now - lastTime > selectedCreature.cooldown && !isFeeding) {
    setIsFeeding(true);
    setFeedingProgress(0);
    const interval = setInterval(() => {
      setFeedingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsFeeding(false);
          setDobri(p => p + selectedCreature.reward);
          setXp(p => p + selectedCreature.reward);
          setCreatureCooldowns(p => ({ ...p, [selectedCreature.id]: Date.now() }));
          if (selectedCreature.type === 'flower') {
            setWaterLevel(p => Math.max(0, p - 1));
          }
          animateReward();
          playRewardSound();
          scheduleCreatureNotification(selectedCreature);
          setSelectedCreature(null);
          return 0;
        }
        return prev + 5;
      });
    }, 100);
  } else if (!isFeeding) {
    setSelectedCreature(null);
  }
}}
          >
            <Text style={styles.creatureBtnText}>
              {creatureCooldowns[selectedCreature.id] && Date.now() - creatureCooldowns[selectedCreature.id] < selectedCreature.cooldown
                ? '⏳ Подождите'
                : selectedCreature.type === 'flower' ? '💧 Полить' : '🍃 Покормить'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedCreature(null)} style={{ padding: 10 }}>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>✕ Закрыть</Text>
          </TouchableOpacity>
        </View>
      )}
      {selected ? (
        <View style={styles.detail}>
          <Text style={styles.detailEmoji}>{selected.emoji}</Text>
          <Text style={styles.detailTitle}>{selected.title[lang]}</Text>
          <Text style={styles.detailDesc}>{selected.desc[lang]}</Text>
          <Text style={styles.detailReward}>🪙 +{selected.reward} {t.reward}</Text>
          <View style={styles.mindfulBox}>
            <Text style={styles.mindfulText}>
              {MINDFUL_PHRASES[selected.id % MINDFUL_PHRASES.length][lang]}
            </Text>
          </View>
          <View style={styles.steps}>
            <Text style={styles.stepsLabel}>{t.how}</Text>
            {(selected.type === 'trash' ? t.steps_trash : selected.type === 'home' ? t.steps_home : t.steps_help).map((step: string, i: number) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
          {!confirming ? (
            <TouchableOpacity 
              style={[styles.btnComplete, !showConfirmBtn && { opacity: 0.3 }]} 
              onPress={() => showConfirmBtn && setConfirming(true)}
            >
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
           <View style={styles.mapControls}>
            <TouchableOpacity
              style={[styles.mapBtn, mapMode === 'standard' && styles.mapBtnActive]}
              onPress={() => setMapMode('standard')}
            >
              <Text style={styles.mapBtnText}>🗺️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapBtn, mapMode === 'satellite' && styles.mapBtnActive]}
              onPress={() => setMapMode('satellite')}
            >
              <Text style={styles.mapBtnText}>🛰️</Text>
            </TouchableOpacity>
          </View>
          <MapView
  style={{ height: 220, margin: 12, borderRadius: 16 }}
  region={location ? {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  } : {
    latitude: 52.52,
    longitude: 13.405,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  }}
  showsUserLocation={true}
  showsMyLocationButton={true}
  followsUserLocation={true}
  mapType={mapMode}
>
          
            {filteredQuests.map(q => (
              <Marker
                key={q.id}
                coordinate={{
                  latitude: (location?.latitude ?? 52.52) + (q.id * 0.003),
                  longitude: (location?.longitude ?? 13.405) + (q.id * 0.002),
                }}
                title={q.title[lang]}
                description={`+${q.reward} ${t.reward}`}
                onPress={() => { setSelected(q); setShowConfirmBtn(false); setTimeout(() => setShowConfirmBtn(true), 1500); }}
              />
            ))}
            {CREATURES.map((c, i) => (
  <Marker
    key={c.id}
    coordinate={{
      latitude: (location?.latitude ?? 52.52) + (Math.sin(i * 1.5) * 0.003),
      longitude: (location?.longitude ?? 13.405) + (Math.cos(i * 1.5) * 0.003),
    }}
    onPress={() => setSelectedCreature(c)}
  >
    <View style={{ alignItems: 'center' }}>
      {c.id === 'animal1' ? (
        <Image
          source={require('../../assets/images/creatures/fox.png')}
          style={{ width: 40, height: 40 }}
          resizeMode="contain"
        />
      ) : (
        <Image 
  source={c.image} 
  style={{ width: 40, height: 40 }} 
/>
      )}
    </View>
  </Marker>
))}
{WATER_SPOTS.map((spot, i) => (
  <Marker
    key={spot.id}
    coordinate={{
      latitude: (location?.latitude ?? 52.52) + (Math.cos(i * 2.1) * 0.005),
      longitude: (location?.longitude ?? 13.405) + (Math.sin(i * 2.1) * 0.005),
    }}
    onPress={() => {
      if (waterLevel >= 10) {
        alert('Лейка уже полна! 💧');
        return;
      }
      setWaterLevel(10);
      alert('Лейка пополнена! 💧');
    }}
  >
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 28 }}>💧</Text>
    </View>
  </Marker>
))}
            ))
          </MapView>
          <View style={styles.catRow}>
            {(['all', 'outdoor', 'home'] as const).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catBtn, category === cat && styles.catBtnActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                 {cat === 'all' ? `🌍 ${t.catAll}` : cat === 'outdoor' ? `🗺️ ${t.catOutdoor}` : `🏠 ${t.catHome}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <ScrollView style={styles.list}>
            <Text style={styles.sectionTitle}>
              {filteredQuests.length > 0 ? `${filteredQuests.length} ${t.nearby}` : t.clean}
            </Text>
            {filteredQuests.map(q => (
              <TouchableOpacity key={q.id} style={styles.card} onPress={() => { setSelected(q); setShowConfirmBtn(false); setTimeout(() => setShowConfirmBtn(true), 1500); }}>
                <Text style={styles.cardEmoji}>{q.emoji}</Text>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{q.title[lang]}</Text>
                  <Text style={styles.cardDesc}>{q.desc[lang]}</Text>
                </View>
                <Text style={styles.cardReward}>+{q.reward}🪙</Text>
              </TouchableOpacity>
            ))}
            {filteredQuests.length === 0 && (
              <View style={{ alignItems: 'center', marginTop: 40, gap: 16 }}>
                <Text style={styles.empty}>{t.empty}</Text>
                <TouchableOpacity
                  style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1e3020' }}
                  onPress={() => setCompleted([])}
                >
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>🔄 Новые квесты</Text>
                </TouchableOpacity>
              </View>
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
  xpBarBg: { height: 18, backgroundColor: '#0f1a0f', marginHorizontal: 12, borderRadius: 9, overflow: 'hidden', justifyContent: 'center' },
  xpBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#3d8b52', borderRadius: 9 },
  xpLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center', letterSpacing: 1 },
  catRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  catBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#1e3020', alignItems: 'center' },
  catBtnActive: { backgroundColor: '#1e3020', borderColor: '#3d8b52' },
  catText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  catTextActive: { color: '#5aad6a', fontWeight: '500' },
  mapControls: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  mapBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#1e3020', backgroundColor: '#0f1a0f' },
  mapBtnActive: { borderColor: '#3d8b52', backgroundColor: '#1e3020' },
  mapBtnText: { fontSize: 16 },
  creaturePopup: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: '#0f1a0f', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#2d6a3f', zIndex: 100 },
  creatureEmoji: { fontSize: 52, marginBottom: 8 },
  creatureName: { fontSize: 18, color: '#e8e4d8', fontWeight: '500', marginBottom: 4 },
  creatureReward: { fontSize: 14, color: '#e8c97a', marginBottom: 16 },
  creatureBtn: { backgroundColor: '#2d6a3f', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32, marginBottom: 8 },
  creatureBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  feedingBarBg: { width: '100%', height: 8, backgroundColor: '#1e3020', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  feedingBarFill: { height: '100%', backgroundColor: '#5aad6a', borderRadius: 4 },
  streak: { fontSize: 11, color: '#e8c97a', marginTop: 2, letterSpacing: 1 },
  mindfulBox: { backgroundColor: 'rgba(45,106,63,0.08)', borderLeftWidth: 2, borderLeftColor: '#3d8b52', borderRadius: 4, padding: 14, marginBottom: 20, width: '100%' },
  mindfulText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20, fontStyle: 'italic' },
});