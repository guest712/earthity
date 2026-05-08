import '../../lib/home/preloadHomeModels';

import { getSave, patchSave, resetSaveToDefaults } from '../../lib/storage/save.repository';
import { requestNotificationPermissions, scheduleCreatureNotification } from '../../lib/notifications';
import { Audio } from 'expo-av';
import { QUESTS } from '../../features/quests/quest.constants';
import { MINDFUL_PHRASES } from '../../features/quests/mindful-phrases';
import { BIO_PICKUP_AMOUNT, ACTION_COOLDOWN_MS } from '../../features/resources/resource.constants';
import { LANGS, FLAG } from '../../lib/i18n/i18n';
import { guessDeviceLanguage } from '../../lib/i18n/guess-locale';
import { getDistance, getLevelKey, getLevelName } from '../../lib/shared/game-utils';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import WorldMap from '../../components/map/WorldMap';
import PlayerModelPreviewPanel from '../../components/map/PlayerModelPreviewPanel';
import RNMapView from 'react-native-maps';
import HomeMapLayer from '../../components/home/HomeMapLayer';
import { homeScreenStyles as styles } from '../../components/home/homeScreen.styles';
import {
  applyQuestCompletion,
  canInteractWithCreature,
  getCreatureRewardResult,
  registerCreatureSeen,
  registerCreatureCared,
  rollCreatureDrop,
  DROP_INFO,
} from '../../lib/shared/game-engine';
import type { DropId } from '../../lib/shared/types';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Onboarding from './onboarding';
import { Redirect, useRouter } from 'expo-router';
import HomeHeader from '../../components/home/HomeHeader';
import CategoryTabs from '../../components/home/CategoryTabs';
import QuestDetailCard from '../../components/home/QuestDetailCard';
import CreaturePopup from '../../components/home/CreaturePopup';

import { Creature, Quest } from '../../lib/shared/types';
import { useLocationState } from '../../features/location/useLocationState';
import { useCreatureSystem } from '../../features/creatures/creature.hook';
import { useAppLanguage } from '../../lib/i18n/LanguageContext';
import type { SpawnedCreature, CareDiaryEntry, LanguageCode } from '../../lib/shared/types';
import { useInventory } from '../../features/inventory/inventory.context';
import { useDailyQuests } from '../../features/dailyQuests/dailyQuests.context';
import { AVATARS, DEFAULT_AVATAR_ID } from '../../features/profile/avatar.constants';
import { useHomeMapCamera } from '../../hooks/useHomeMapCamera';
import { useCreatureMapSpawns } from '../../hooks/useCreatureMapSpawns';
import { useResourceSpotRespawn } from '../../hooks/useResourceSpotRespawn';

/**
 * Dev flag: keep false for normal app flow.
 * Toggle to true only when you want to boot directly into the 3D test route.
 */
const USE_3D_TEST_SCREEN = false;

export default function HomeScreen() {
  if (USE_3D_TEST_SCREEN) {
    return <Redirect href="/three-test" />;
  }
  return <HomeScreenInner />;
}

function HomeScreenInner() {
  const router = useRouter();
  const { lang, setAppLanguage, openLanguagePicker } = useAppLanguage();
  const [dobri, setDobri] = useState(0);
  const [totalDobri, setTotalDobri] = useState(0);
  const [xp, setXp] = useState(0);
  const [deeds, setDeeds] = useState(0);
  const [mapTileStyle, setMapTileStyle] = useState<'standard' | 'satellite'>('standard');
  const [mapMode, setMapMode] = useState<'2D' | '3D_Tilt'>('2D');

  const {
  creatureCooldowns,
  setCreatureCooldowns,
  feedingProgress,
  isFeeding,
  startFeeding,
} = useCreatureSystem();

  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [selectedSpawn, setSelectedSpawn] = useState<SpawnedCreature | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [selected, setSelected] = useState<Quest | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [category, setCategory] = useState<'all' | 'outdoor' | 'home'>('all');
  const [onboarded, setOnboarded] = useState(false);
  const [streak, setStreak] = useState(0);
  const { location, isLocationFallback, heading } = useLocationState();
  const lastWalkPosRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const [lastOpenDate, setLastOpenDate] = useState('');
  const [testDeeds, setTestDeeds] = useState(0);
  

  const {
    resources,
    drops,
    addDrop,
    consumeFeed,
    consumeWater,
    addFeed: addFeedInv,
    addWater: addWaterInv,
    addTrash: addTrashInv,
    refillWater: refillWaterInv,
    reload: reloadInventory,
  } = useInventory();
  const { increment: incrementDaily, walkTrackingKind } = useDailyQuests();
  const feedCount = resources.feed;
  const plastic = resources.trash.plastic;
  const glass = resources.trash.glass;
  const paper = resources.trash.paper;
  const bio = resources.trash.bio;
  const [showConfirmBtn, setShowConfirmBtn] = useState(false);
  const [careDiary, setCareDiary] = useState<CareDiaryEntry[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [devIgnoreInteractionDistance, setDevIgnoreInteractionDistance] = useState(false);
  const [autoCompass2DEnabled, setAutoCompass2DEnabled] = useState(false);
  const [autoCompass3DEnabled, setAutoCompass3DEnabled] = useState(true);
  const devBypassDistance = __DEV__ && devIgnoreInteractionDistance;
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR_ID);
  const [dropToast, setDropToast] = useState<{ dropId: DropId; msg: string } | null>(null);
  const dropToastOpacity = useSharedValue(0);
  const dropToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActionAtRef = useRef({
    creature: 0,
    water: 0,
    feed: 0,
    trash: 0,
    bio: 0,
  });
  const mapRef = useRef<RNMapView | null>(null);

  const { recenterOnUser } = useHomeMapCamera({
    mapRef,
    location,
    heading,
    mapMode,
    autoCompass2DEnabled,
    autoCompass3DEnabled,
  });

  const {
    activeSpawns,
    setActiveSpawns,
    lastSpawnCenter,
    lastSpawnRefreshAt,
    hydrateCreatureMapSpawns,
  } = useCreatureMapSpawns(location);

  const {
    resourceRespawnUntil,
    isResourceSpotActive,
    despawnResourceSpot,
    hydrateResourceRespawnUntil,
  } = useResourceSpotRespawn();

  const playRewardSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/reward.mp3')
      );
      try {
        await sound.playAsync();
      } finally {
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            void sound.unloadAsync();
          }
        });
      }
    } catch {
      /* audio / keep-awake timing on Android dev — ignore */
    }
  };
  const prevLevelKey = useRef('');const rewardScale = useSharedValue(1);
  const rewardOpacity = useSharedValue(1);
  const isAutoCompassCurrentModeEnabled =
    mapMode === '3D_Tilt' ? autoCompass3DEnabled : autoCompass2DEnabled;

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

  function isActionCoolingDown(kind: keyof typeof lastActionAtRef.current): boolean {
    const now = Date.now();
    if (now - lastActionAtRef.current[kind] < ACTION_COOLDOWN_MS) {
      return true;
    }
    lastActionAtRef.current[kind] = now;
    return false;
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
}, [breathScale]);

const breathStyle = useAnimatedStyle(() => ({
  transform: [{ scale: breathScale.value }],
}));

const dropToastStyle = useAnimatedStyle(() => ({
  opacity: dropToastOpacity.value,
  transform: [{ translateY: (1 - dropToastOpacity.value) * 16 }],
}));

function triggerDropToast(dropId: DropId, lang: string) {
  const info = DROP_INFO[dropId];
  const label = info.label[lang] ?? info.label['en'];
  const msg = `${info.emoji} ${label}`;
  setDropToast({ dropId, msg });
  dropToastOpacity.value = withTiming(1, { duration: 250 });
  if (dropToastTimerRef.current) clearTimeout(dropToastTimerRef.current);
  dropToastTimerRef.current = setTimeout(() => {
    dropToastOpacity.value = withTiming(0, { duration: 400 });
    setTimeout(() => setDropToast(null), 450);
  }, 2500);
}

  useEffect(() => {
    requestNotificationPermissions();
  }, []);



 useEffect(() => {
  const loadHome = async () => {
    try {
      const save = await getSave();

      setDobri(save.dobri);
      setXp(save.xp);
      setDeeds(save.deeds);
      setCompleted(save.completed);
      setOnboarded(save.onboarded);
      setOutdoorDeeds(save.outdoorDeeds);
      setHomeDeeds(save.homeDeeds);
      setPetDeeds(save.petDeeds);
      setTestDeeds(save.testDeeds);
      setTotalDobri(save.totalDobri || save.dobri || 0);
      setCareDiary(save.careDiary || []);
      setAvatar(save.avatar || DEFAULT_AVATAR_ID);

      hydrateResourceRespawnUntil(save.resourceRespawnUntil);
      hydrateCreatureMapSpawns(save.creatureMapSpawns);

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
      setIsHydrated(true);
    } catch (e) {
      console.warn('Home load error', e);
      setIsHydrated(true);
    }
  };

  loadHome();
}, [hydrateCreatureMapSpawns, hydrateResourceRespawnUntil]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const save = await getSave();
          if (!cancelled) {
            setAvatar(save.avatar || DEFAULT_AVATAR_ID);
            setDobri(save.dobri);
            setTotalDobri(save.totalDobri || save.dobri || 0);
            setXp(save.xp);
          }
        } catch {
          /* keep current */
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

 useEffect(() => {
  if (!lang || !isHydrated) return;

  if (autosaveTimeoutRef.current) {
    clearTimeout(autosaveTimeoutRef.current);
  }

  autosaveTimeoutRef.current = setTimeout(() => {
    patchSave({
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
      careDiary,
      resources,
      drops,
      resourceRespawnUntil,
      creatureMapSpawns: {
        activeSpawns,
        lastSpawnCenter,
        lastSpawnRefreshAt,
      },
    }).catch((e) => {
      console.warn('Home save error', e);
    });
  }, 500);

  return () => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
  };
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
  careDiary,
  isHydrated,
  resources,
  drops,
  resourceRespawnUntil,
  activeSpawns,
  lastSpawnCenter,
  lastSpawnRefreshAt,
]);

  useEffect(() => {
    const currentKey = getLevelKey(xp);
    if (prevLevelKey.current && prevLevelKey.current !== currentKey) {
      setDobri((prev) => prev + 50);
      setTotalDobri((prev) => prev + 50);
    }
    prevLevelKey.current = currentKey;
  }, [xp]);

  useEffect(() => {
    if (walkTrackingKind !== 'gps') {
      lastWalkPosRef.current = location ?? null;
      return;
    }
    if (!location || isLocationFallback) {
      lastWalkPosRef.current = location ?? null;
      return;
    }
    const prev = lastWalkPosRef.current;
    if (!prev) {
      lastWalkPosRef.current = location;
      return;
    }
    const stepMeters = getDistance(
      prev.latitude,
      prev.longitude,
      location.latitude,
      location.longitude
    );
    if (stepMeters >= 10 && stepMeters <= 250) {
      incrementDaily('walk_meters', Math.round(stepMeters));
    }
    lastWalkPosRef.current = location;
  }, [location, isLocationFallback, incrementDaily, walkTrackingKind]);



  if (!lang) {
    const pick = LANGS[guessDeviceLanguage()];
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.langScreen}>
          <Text style={styles.langSymbol}>🌍</Text>
          <Text style={styles.langTitle}>Earthity</Text>
          <Text style={styles.langSub}>{pick.langPickerSubtitle}</Text>
          <View style={styles.langGrid}>
            {(Object.keys(LANGS) as LanguageCode[]).map((l) => (
              <TouchableOpacity key={l} style={styles.langBtn} onPress={() => setAppLanguage(l)}>
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
    return <Onboarding onDone={() => setOnboarded(true)} />;
  }

  const t = LANGS[lang];
  const isQuestUnlocked = (q: typeof QUESTS[number]) => {
    if (!q.unlockedBy) return true;
    return (drops[q.unlockedBy.dropId] ?? 0) >= q.unlockedBy.amount;
  };

  const activeQuests = QUESTS.filter(q => !completed.includes(q.id) && isQuestUnlocked(q));
  const filteredQuests = activeQuests.filter(q => {
    if (category === 'outdoor') return q.type === 'trash' || q.type === 'help';
    if (category === 'home') return q.type === 'home';
    return true;
  });

  const lockedQuests = QUESTS.filter(q => !completed.includes(q.id) && !isQuestUnlocked(q)).filter(q => {
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
  const currentAvatar = AVATARS.find((item) => item.id === avatar) ?? AVATARS[0];



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
        onPressLanguage={openLanguagePicker}
        rewardAnimStyle={rewardAnimStyle}
      />
      <View style={styles.resourcesStrip}>
        <View style={styles.resourcePill}>
          <Text style={styles.resourceEmoji}>💧</Text>
          <Text style={styles.resourceText}>{resources.water}</Text>
        </View>
        <View style={styles.resourcePill}>
          <Image
            source={require('../../assets/images/items/feed.png')}
            style={{ width: 18, height: 18 }}
            resizeMode="contain"
          />
          <Text style={styles.resourceText}>{feedCount}</Text>
        </View>
        <View style={styles.resourcePill}>
          <Image
            source={require('../../assets/images/items/plastictrash.png')}
            style={{ width: 18, height: 18 }}
            resizeMode="contain"
          />
          <Text style={styles.resourceText}>{plastic}</Text>
        </View>
        <View style={styles.resourcePill}>
          <Image
            source={require('../../assets/images/items/glasstrash.png')}
            style={{ width: 18, height: 18 }}
            resizeMode="contain"
          />
          <Text style={styles.resourceText}>{glass}</Text>
        </View>
        <View style={styles.resourcePill}>
          <Image
            source={require('../../assets/images/items/papertrash.png')}
            style={{ width: 18, height: 18 }}
            resizeMode="contain"
          />
          <Text style={styles.resourceText}>{paper}</Text>
        </View>
        <View style={styles.resourcePill}>
          <Image
            source={require('../../assets/images/items/bio.png')}
            style={{ width: 18, height: 18 }}
            resizeMode="contain"
          />
          <Text style={styles.resourceText}>{bio}</Text>
        </View>
      </View>
      {__DEV__ && isLocationFallback && (
        <View style={styles.devGeoHint}>
          <Text style={styles.devGeoHintText}>DEV GEO: fallback location active</Text>
        </View>
      )}
      {__DEV__ && (
        <View style={styles.devDock}>
          <TouchableOpacity style={styles.devBtn} onPress={() => setShowDevPanel((prev) => !prev)}>
            <Text style={styles.devBtnText}>DEV</Text>
          </TouchableOpacity>
        </View>
      )}
      {__DEV__ && showDevPanel && (
        <View style={styles.devPanel}>
          <TouchableOpacity
            style={[styles.devPanelBtn, devIgnoreInteractionDistance && styles.devPanelBtnActive]}
            onPress={() => setDevIgnoreInteractionDistance((v) => !v)}
          >
            <Text style={styles.devPanelBtnText}>
              ignore all distance: {devIgnoreInteractionDistance ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.devPanelBtn, autoCompass2DEnabled && styles.devPanelBtnActive]}
            onPress={() => setAutoCompass2DEnabled((v) => !v)}
          >
            <Text style={styles.devPanelBtnText}>
              auto-compass 2D: {autoCompass2DEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.devPanelBtn, autoCompass3DEnabled && styles.devPanelBtnActive]}
            onPress={() => setAutoCompass3DEnabled((v) => !v)}
          >
            <Text style={styles.devPanelBtnText}>
              auto-compass 3D: {autoCompass3DEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.devPanelBtn}
            onPress={() => router.push('/three-test')}
          >
            <Text style={styles.devPanelBtnText}>open 3D test</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.devPanelBtn}
            onPress={() => addWaterInv(3)}
          >
            <Text style={styles.devPanelBtnText}>+3 water</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.devPanelBtn}
            onPress={() => addFeedInv(3)}
          >
            <Text style={styles.devPanelBtnText}>+3 feed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.devPanelBtn}
            onPress={() => addTrashInv('bio', BIO_PICKUP_AMOUNT)}
          >
            <Text style={styles.devPanelBtnText}>+bio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.devPanelBtnDanger}
            onPress={async () => {
              const reset = await resetSaveToDefaults();
              setDobri(reset.dobri);
              setTotalDobri(reset.totalDobri);
              setXp(reset.xp);
              setDeeds(reset.deeds);
              setCompleted(reset.completed);
              setOnboarded(reset.onboarded);
              setOutdoorDeeds(reset.outdoorDeeds);
              setHomeDeeds(reset.homeDeeds);
              setPetDeeds(reset.petDeeds);
              setTestDeeds(reset.testDeeds);
              setCareDiary(reset.careDiary);
              hydrateResourceRespawnUntil(reset.resourceRespawnUntil);
              hydrateCreatureMapSpawns(reset.creatureMapSpawns);
              await reloadInventory();
              setStreak(reset.streak);
              setLastOpenDate(reset.lastOpenDate);
              alert('DEV: save reset');
            }}
          >
            <Text style={styles.devPanelBtnText}>reset save</Text>
          </TouchableOpacity>
        </View>
      )}
      {selectedCreature && (
  <CreaturePopup
    t={t}
    selectedCreature={selectedCreature}
    lang={lang}
    waterLevel={resources.water}
    isFeeding={isFeeding}
    feedingProgress={feedingProgress}
    breathStyle={breathStyle}
    creatureCooldowns={creatureCooldowns}
    onPressAction={() => {
  if (isActionCoolingDown('creature')) return;
  const now = Date.now();
  const lastTime = creatureCooldowns[selectedCreature.id] || 0;
  
if (!selectedSpawn) return;

const dist = location
  ? getDistance(
      location.latitude,
      location.longitude,
      selectedSpawn.latitude,
      selectedSpawn.longitude
    )
  : 999;

  const effectiveDist = devBypassDistance ? 0 : dist;

  const interaction = canInteractWithCreature({
    creature: selectedCreature,
    distance: effectiveDist,
    waterLevel: resources.water,
    lastInteractionTime: lastTime,
    now,
  });

  if (!interaction.ok) {
    
    if (interaction.reason === 'too_far') {
      alert(t.alertTooFar);
    } else if (interaction.reason === 'no_water') {
      alert(t.alertNoWater);
    } else if (interaction.reason === 'cooldown' && !isFeeding) {
      setSelectedCreature(null);
    }
    return;
  }
  
  if (selectedCreature.type === 'animal' && feedCount <= 0) {
  alert(t.alertNoFeed);
  return;
}

  if (isFeeding) return;

const creature = selectedCreature;
const spawn = selectedSpawn;

if (!creature || !spawn) return;

startFeeding(() => {
  const rewardResult = getCreatureRewardResult({
    creature,
    dobri,
    totalDobri,
    xp,
    waterLevel: resources.water,
  });

  setDobri(rewardResult.dobri);
  setTotalDobri(rewardResult.totalDobri);
  setXp(rewardResult.xp);
  if (creature.type === 'flower') {
    consumeWater(1);
    incrementDaily('water_flowers', 1);
  } else if (creature.type === 'animal') {
    consumeFeed(1);
    incrementDaily('feed_animals', 1);
  }

  setCreatureCooldowns((p) => ({
    ...p,
    [creature.id]: Date.now(),
  }));

  animateReward();
  playRewardSound();
  scheduleCreatureNotification(creature, lang);

  setCareDiary((prev) =>
  registerCreatureCared({
    diary: prev,
    creatureId: creature.id,
  })
);

  setActiveSpawns((prev) =>
    prev.filter((item) => item.spawnId !== spawn.spawnId)
  );

  setSelectedCreature(null);
  setSelectedSpawn(null);

  const droppedId = rollCreatureDrop(creature);
  if (droppedId) {
    addDrop(droppedId, 1);
    triggerDropToast(droppedId, lang);
  }
});
}}
    onClose={() => {
  setSelectedCreature(null);
  setSelectedSpawn(null);
}}
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
              style={[styles.mapBtn, mapTileStyle === 'standard' && styles.mapBtnActive]}
              onPress={() => setMapTileStyle('standard')}
            >
              <Text style={styles.mapBtnText}>🗺️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapBtn, mapTileStyle === 'satellite' && styles.mapBtnActive]}
              onPress={() => setMapTileStyle('satellite')}
            >
              <Text style={styles.mapBtnText}>🛰️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapBtn, mapMode === '3D_Tilt' && styles.mapBtnActive3D]}
              onPress={() => setMapMode((prev) => (prev === '2D' ? '3D_Tilt' : '2D'))}
            >
              <Text style={styles.mapBtnText}>{mapMode === '3D_Tilt' ? '🧭' : '2D'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapBtn, isAutoCompassCurrentModeEnabled && styles.mapBtnActive3D]}
              onPress={() => {
                if (mapMode === '3D_Tilt') {
                  setAutoCompass3DEnabled((prev) => !prev);
                } else {
                  setAutoCompass2DEnabled((prev) => !prev);
                }
              }}
            >
              <Text style={styles.mapBtnText}>
                {mapMode === '3D_Tilt'
                  ? `🧭${autoCompass3DEnabled ? '✓' : '✕'}`
                  : `N${autoCompass2DEnabled ? '✓' : '✕'}`}
              </Text>
            </TouchableOpacity>
            {location ? (
              <TouchableOpacity style={styles.mapBtn} onPress={recenterOnUser}>
                <Text style={styles.mapBtnText}>📍</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          
          <View style={styles.mapWrapper}>
          <WorldMap
  ref={mapRef}
  style={styles.mapInner}
  initialRegion={
    location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      : {
          latitude: 52.52,
          longitude: 13.405,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
  }
  mapTileStyle={mapTileStyle}
  userLocation={location}
  userAvatarSource={currentAvatar.image}
  userAvatarId={avatar}
>
            <HomeMapLayer
              t={t}
              lang={lang}
              location={location}
              filteredQuests={filteredQuests}
              activeSpawns={activeSpawns}
              selectedSpawn={selectedSpawn}
              devBypassDistance={devBypassDistance}
              resourcesWater={resources.water}
              feedCount={feedCount}
              plastic={plastic}
              glass={glass}
              paper={paper}
              bio={bio}
              isResourceSpotActive={isResourceSpotActive}
              despawnResourceSpot={despawnResourceSpot}
              isActionCoolingDown={isActionCoolingDown}
              incrementDaily={incrementDaily}
              refillWaterInv={refillWaterInv}
              addFeedInv={addFeedInv}
              addTrashInv={addTrashInv}
              onQuestMarkerPress={(q) => {
                setSelected(q);
                setShowConfirmBtn(false);
                setTimeout(() => setShowConfirmBtn(true), 1500);
              }}
              onCreatureSpawnPress={(creature, spawn) => {
                setSelectedCreature(creature);
                setSelectedSpawn(spawn);
                setCareDiary((prev) =>
                  registerCreatureSeen({
                    diary: prev,
                    creatureId: creature.id,
                  })
                );
              }}
            />
          </WorldMap>
          </View>
          <PlayerModelPreviewPanel />
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
            {filteredQuests.length === 0 && lockedQuests.length === 0 && (
              <View style={{ alignItems: 'center', marginTop: 40, gap: 16 }}>
                <Text style={styles.empty}>{t.empty}</Text>
                <TouchableOpacity
                  style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1e3020' }}
                  onPress={() => setCompleted([])}
                >
                  <Text style={styles.newQuestsText}>{t.newQuests}</Text>
                </TouchableOpacity>
              </View>
            )}
            {lockedQuests.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 12, color: 'rgba(255,255,255,0.25)' }]}>
                  🔒 {lockedQuests.length}
                </Text>
                {lockedQuests.map(q => {
                  const cond = q.unlockedBy!;
                  const have = drops[cond.dropId] ?? 0;
                  const info = DROP_INFO[cond.dropId];
                  return (
                    <View key={q.id} style={styles.cardLocked}>
                      <Text style={styles.cardEmoji}>{q.emoji}</Text>
                      <View style={styles.cardBody}>
                        <Text style={styles.cardTitleLocked}>{q.title[lang]}</Text>
                        <Text style={styles.cardDesc}>
                          {t.questLockedNeed}: {have}/{cond.amount} {info.emoji}
                        </Text>
                      </View>
                      <Text style={styles.cardRewardLocked}>+{q.reward}🪙</Text>
                    </View>
                  );
                })}
              </>
            )}
          </ScrollView>
        </>
      )}
      {dropToast && (
        <Animated.View style={[styles.dropToast, dropToastStyle]} pointerEvents="none">
          <Text style={styles.dropToastText}>{t.dropToastPrefix} {dropToast.msg}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
