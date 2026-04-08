import { loadSave, updateSave } from '../../lib/storage';
import { Audio } from 'expo-av';
import { QUESTS, CREATURES, WATER_SPOTS, MINDFUL_PHRASES } from  '../../lib/game-data';
import { LANGS, FLAG } from '../../lib/i18n';
import { getDistance, getLevelKey, getLevelName } from '../../lib/game-utils';
import { applyQuestCompletion, getCreaturePosition, isWithinInteractionDistance, } from '../../lib/game-engine';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Onboarding from './onboarding';
import HomeHeader from '../../components/HomeHeader';
import CategoryTabs from '../../components/CategoryTabs';
import QuestDetailCard from '../../components/QuestDetailCard';
import CreaturePopup from '../../components/CreaturePopup';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});





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
  try {
    await sound.playAsync();
  } finally {
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  }
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
          ? `🌸 ${creature.label['ru']} хочет пить! Полей его.`
          : `🐾 ${creature.label['ru']} голоден! Покорми его.`,
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
  const loadHome = async () => {
    try {
      const save = await loadSave();

      setDobri(save.dobri);
      setXp(save.xp);
      setDeeds(save.deeds);
      setCompleted(save.completed);
      setLang(save.lang);
      setOnboarded(save.onboarded);
      setOutdoorDeeds(save.outdoorDeeds);
      setHomeDeeds(save.homeDeeds);
      setPetDeeds(save.petDeeds);
      setTestDeeds(save.testDeeds);
      setWaterLevel(save.waterLevel);
      setTotalDobri(save.totalDobri || save.dobri || 0);

      const today = new Date().toDateString();
      const last = save.lastOpenDate || '';
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (last === today) {
        setStreak(save.streak || 0);
      } else if (last === yesterday) {
        setStreak((save.streak || 0) + 1);
      } else {
        setStreak(1);
      }

      setLastOpenDate(today);
    } catch (e) {
      console.warn('Home load error', e);
    }
  };

  loadHome();
}, []);
 useEffect(() => {
  if (!lang) return;

  updateSave({
    dobri,
    xp,
    deeds,
    completed,
    lang,
    onboarded,
    outdoorDeeds,
    homeDeeds,
    petDeeds,
    totalDobri,
    streak,
    lastOpenDate,
    testDeeds,
    waterLevel,
  }).catch((e) => {
    console.warn('Home save error', e);
  });
}, [
  dobri,
  xp,
  deeds,
  completed,
  lang,
  onboarded,
  outdoorDeeds,
  homeDeeds,
  petDeeds,
  totalDobri,
  streak,
  lastOpenDate,
  testDeeds,
  waterLevel,
]);

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
  const selectedSteps =
  selected?.type === 'trash'
    ? t.steps_trash
    : selected?.type === 'home'
    ? t.steps_home
    : t.steps_help;

const mindfulPhrase = selected
  ? MINDFUL_PHRASES[selected.id % MINDFUL_PHRASES.length][lang]
  : '';



 function complete() {
  if (!selected) return;

  const result = applyQuestCompletion({
    selected,
    completed,
    dobri,
    totalDobri,
    xp,
    deeds,
    outdoorDeeds,
    homeDeeds,
    petDeeds,
    testDeeds,
    streak,
  });

  setCompleted(result.completed);
  setDobri(result.dobri);
  setTotalDobri(result.totalDobri);
  setXp(result.xp);
  setDeeds(result.deeds);
  setOutdoorDeeds(result.outdoorDeeds);
  setHomeDeeds(result.homeDeeds);
  setPetDeeds(result.petDeeds);
  setTestDeeds(result.testDeeds);

  animateReward();
  playRewardSound();
  setSelected(null);
  setConfirming(false);
  setShowConfirmBtn(false);
}

  return (
    <SafeAreaView style={styles.container}>
        <HomeHeader
  level={level}
  streak={streak}
  dobri={dobri}
  deeds={deeds}
  xp={xp}
  nextXp={nextXp}
  xpProgress={xpProgress}
  dobrikiLabel={t.dobriki}
  deedsLabel={t.deeds}
  flag={FLAG[lang]}
  onPressLanguage={() => setLang(null)}
  rewardAnimStyle={rewardAnimStyle}
/>
      {selectedCreature && (
  <CreaturePopup
    selectedCreature={selectedCreature}
    lang={lang}
    waterLevel={waterLevel}
    isFeeding={isFeeding}
    feedingProgress={feedingProgress}
    breathStyle={breathStyle}
    creatureCooldowns={creatureCooldowns}
    onPressAction={() => {
      const now = Date.now();
      const lastTime = creatureCooldowns[selectedCreature.id] || 0;
      const creatureIndex = CREATURES.findIndex(c => c.id === selectedCreature.id);
const creaturePos = getCreaturePosition(
  location?.latitude ?? 52.52,
  location?.longitude ?? 13.405,
  creatureIndex
);

const dist = location
  ? getDistance(
      location.latitude,
      location.longitude,
      creaturePos.latitude,
      creaturePos.longitude
    )
  : 999;
      if (!isWithinInteractionDistance(dist)) {
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
    onClose={() => setSelectedCreature(null)}
  />
)}
      
      {selected ? (
  <QuestDetailCard
    selected={selected}
    lang={lang}
    rewardLabel={t.reward}
    howLabel={t.how}
    doneLabel={t.done}
    backLabel={t.back}
    confirmLabel={t.confirm}
    yesLabel={t.yes}
    noLabel={t.no}
    mindfulPhrase={mindfulPhrase}
    steps={selectedSteps}
    confirming={confirming}
    showConfirmBtn={showConfirmBtn}
    onPressComplete={() => showConfirmBtn && setConfirming(true)}
    onPressConfirmYes={complete}
    onPressConfirmNo={() => setConfirming(false)}
    onPressBack={() => {
      setSelected(null);
      setConfirming(false);
    }}
  />
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
            
 {CREATURES.map((c, i) => {
  const pos = getCreaturePosition(
    location?.latitude ?? 52.52,
    location?.longitude ?? 13.405,
    i
  );

  return (
    <Marker
      key={c.id}
      coordinate={pos}
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
  );
})}
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
            
          </MapView>
          <CategoryTabs
  category={category}
  onChange={setCategory}
  labels={{
    all: t.catAll,
    outdoor: t.catOutdoor,
    home: t.catHome,
  }}
/>
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