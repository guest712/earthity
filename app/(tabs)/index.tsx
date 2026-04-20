import { getSave, patchSave, resetSaveToDefaults } from '../../lib/storage/save.repository';
import { requestNotificationPermissions, scheduleCreatureNotification } from '../../lib/notifications';
import { Audio } from 'expo-av';
import { QUESTS } from '../../features/quests/quest.constants';
import { MINDFUL_PHRASES } from '../../features/quests/mindful-phrases';
import { CREATURES } from '../../features/creatures/creature.constants';
import {
  WATER_SPOTS,
  FEED_SPOTS,
  TRASH_SPOTS,
  BIO_SPOTS,
  MAX_WATER,
  MAX_FEED,
  MAX_TRASH_PER_TYPE,
  MAX_BIO,
  FEED_PICKUP_AMOUNT,
  TRASH_PICKUP_AMOUNT,
  BIO_PICKUP_AMOUNT,
  RESOURCE_INTERACTION_DISTANCE,
  ACTION_COOLDOWN_MS,
} from '../../features/resources/resource.constants';
import { LANGS, FLAG } from '../../lib/i18n/i18n';
import { guessDeviceLanguage } from '../../lib/i18n/guess-locale';
import { getDistance, getLevelKey, getLevelName } from '../../lib/shared/game-utils';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import WorldMap from '../../components/map/WorldMap';
import RNMapView, { Marker, Circle } from 'react-native-maps';
import {
  applyQuestCompletion,
  canInteractWithCreature,
  generateCreatureSpawnsSpread,
  getCreatureRewardResult,
  pruneCreatureSpawns,
  shouldRefreshCreatureSpawns,
  registerCreatureSeen,
  registerCreatureCared,
  rollCreatureDrop,
  DROP_INFO,
} from '../../lib/shared/game-engine';
import type { DropId } from '../../lib/shared/types';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Onboarding from './onboarding';
import HomeHeader from '../../components/home/HomeHeader';
import CategoryTabs from '../../components/home/CategoryTabs';
import QuestDetailCard from '../../components/home/QuestDetailCard';
import CreaturePopup from '../../components/home/CreaturePopup';
import { Creature, Quest } from '../../lib/shared/types';
import { useLocationState } from '../../features/location/useLocationState';
import { useCreatureSystem } from '../../features/creatures/creature.hook';
import { useAppLanguage } from '../../lib/i18n/LanguageContext';
import type { SpawnedCreature, CareDiaryEntry, LanguageCode } from '../../lib/shared/types';
import { Resources } from '../../features/resources/resource.types';
import { addFeed, refillWater, addTrash } from '../../features/resources/resource.logic';
import { AVATARS, DEFAULT_AVATAR_ID } from '../../features/profile/avatar.constants';




export default function HomeScreen() {
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
  const [lastOpenDate, setLastOpenDate] = useState('');
  const [testDeeds, setTestDeeds] = useState(0);
  

  const [resources, setResources] = useState<Resources>({
    water: 10,
    feed: 0,
    trash: {
      plastic: 0,
      glass: 0,
      paper: 0,
      bio: 0,
    },
  });
  const feedCount = resources.feed;
  const plastic = resources.trash.plastic;
  const glass = resources.trash.glass;
  const paper = resources.trash.paper;
  const bio = resources.trash.bio;
  const [showConfirmBtn, setShowConfirmBtn] = useState(false);
  const [activeSpawns, setActiveSpawns] = useState<SpawnedCreature[]>([]);
  const [lastSpawnCenter, setLastSpawnCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [lastSpawnRefreshAt, setLastSpawnRefreshAt] = useState(0);
  const [careDiary, setCareDiary] = useState<CareDiaryEntry[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR_ID);
  const [drops, setDrops] = useState<Partial<Record<DropId, number>>>({});
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

const prevMapModeRef = useRef<'2D' | '3D_Tilt'>('2D');

useEffect(() => {
  if (!location) return;

  const bear = heading ?? 0;
  const isSwitching = prevMapModeRef.current !== mapMode;
  prevMapModeRef.current = mapMode;

  if (mapMode === '3D_Tilt') {
    const OFFSET_M = 120;
    const R = 6371000;
    const bearRad = (bear * Math.PI) / 180;
    const dLat = (OFFSET_M / R) * (180 / Math.PI) * Math.cos(bearRad);
    const dLng =
      ((OFFSET_M / R) * (180 / Math.PI) * Math.sin(bearRad)) /
      Math.cos((location.latitude * Math.PI) / 180);

    mapRef.current?.animateCamera(
      {
        center: {
          latitude: location.latitude + dLat,
          longitude: location.longitude + dLng,
        },
        pitch: 60,
        heading: bear,
        zoom: 18,
      },
      { duration: isSwitching ? 700 : 300 }
    );
  } else {
    mapRef.current?.animateCamera(
      {
        center: { latitude: location.latitude, longitude: location.longitude },
        pitch: 0,
        heading: 0,
        zoom: 17,
      },
      { duration: isSwitching ? 700 : 300 }
    );
  }
}, [mapMode, location, heading]);

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
      setDrops(save.drops || {});
      const res = save.resources;
      setResources({
        water: res.water,
        feed: res.feed,
        trash: {
          plastic: res.trash.plastic,
          glass: res.trash.glass,
          paper: res.trash.paper,
          bio: res.trash.bio,
        },
      });

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
}, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const save = await getSave();
          if (!cancelled) {
            setAvatar(save.avatar || DEFAULT_AVATAR_ID);
          }
        } catch {
          /* keep current avatar */
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
  resources,
  drops,
  isHydrated,
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
  if (!location) return;

  const now = Date.now();

  setActiveSpawns((prev) => {
    const cleaned = pruneCreatureSpawns({
      spawns: prev,
      userLatitude: location.latitude,
      userLongitude: location.longitude,
      now,
    });

    const needsRefresh = shouldRefreshCreatureSpawns({
      lastSpawnCenter,
      currentLatitude: location.latitude,
      currentLongitude: location.longitude,
      lastRefreshAt: lastSpawnRefreshAt,
      now,
    });

    if (!needsRefresh) {
      return cleaned;
    }

    const targetCount = 5;
    const missingCount = Math.max(0, targetCount - cleaned.length);

    const newSpawns =
  missingCount > 0
    ? generateCreatureSpawnsSpread({
        baseLatitude: location.latitude,
        baseLongitude: location.longitude,
        creatureIds: CREATURES.map((c) => c.id),
        existingSpawns: cleaned,
        count: missingCount,
        minGapMeters: 70,
        now,
      })
    : [];

    setLastSpawnCenter({
      latitude: location.latitude,
      longitude: location.longitude,
    });
    setLastSpawnRefreshAt(now);

    return [...cleaned, ...newSpawns];
  });
}, [location, lastSpawnCenter, lastSpawnRefreshAt]);



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
            style={styles.devPanelBtn}
            onPress={() =>
              setResources((prev) => ({
                ...prev,
                water: Math.min(MAX_WATER, prev.water + 3),
              }))
            }
          >
            <Text style={styles.devPanelBtnText}>+3 water</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.devPanelBtn}
            onPress={() =>
              setResources((prev) => ({
                ...prev,
                feed: Math.min(MAX_FEED, prev.feed + 3),
              }))
            }
          >
            <Text style={styles.devPanelBtnText}>+3 feed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.devPanelBtn}
            onPress={() =>
              setResources((prev) => addTrash(prev, 'bio', BIO_PICKUP_AMOUNT))
            }
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
              setResources(reset.resources);
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

  const interaction = canInteractWithCreature({
    creature: selectedCreature,
    distance: dist,
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
  setResources((prev) => ({
    ...prev,
    water: rewardResult.waterLevel,
    feed:
      creature.type === 'animal'
        ? Math.max(prev.feed - 1, 0)
        : prev.feed,
  }));

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
    setDrops((prev) => {
      const next = { ...prev, [droppedId]: (prev[droppedId] ?? 0) + 1 };
      return next;
    });
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
            {location ? (
              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() => {
                  if (mapMode === '3D_Tilt') {
                    const bear = heading ?? 0;
                    const OFFSET_M = 120;
                    const R = 6371000;
                    const bearRad = (bear * Math.PI) / 180;
                    const dLat = (OFFSET_M / R) * (180 / Math.PI) * Math.cos(bearRad);
                    const dLng =
                      ((OFFSET_M / R) * (180 / Math.PI) * Math.sin(bearRad)) /
                      Math.cos((location.latitude * Math.PI) / 180);
                    mapRef.current?.animateCamera(
                      {
                        center: {
                          latitude: location.latitude + dLat,
                          longitude: location.longitude + dLng,
                        },
                        pitch: 60,
                        heading: bear,
                        zoom: 18,
                      },
                      { duration: 400 }
                    );
                  } else {
                    mapRef.current?.animateToRegion(
                      {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      },
                      250
                    );
                  }
                }}
              >
                <Text style={styles.mapBtnText}>📍</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          
          <WorldMap
  ref={mapRef}
  region={
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
            
 {activeSpawns.map((spawn) => {
  const creature = CREATURES.find((c) => c.id === spawn.creatureId);
  if (!creature) return null;

  const dist = location
  ? getDistance(
      location.latitude,
      location.longitude,
      spawn.latitude,
      spawn.longitude
    )
  : 999;

const isClose = dist <= RESOURCE_INTERACTION_DISTANCE; 

  return (
    <React.Fragment key={spawn.spawnId}>
      {selectedSpawn?.spawnId === spawn.spawnId && (
       <Circle
  center={{
    latitude: spawn.latitude,
    longitude: spawn.longitude,
  }}
  radius={RESOURCE_INTERACTION_DISTANCE}
  strokeWidth={2}
  strokeColor={
    isClose
      ? "rgba(90,200,120,0.9)"
      : "rgba(90,173,106,0.5)"
  }
  fillColor={
    isClose
      ? "rgba(90,200,120,0.25)"
      : "rgba(90,173,106,0.1)"
  }
/>
      )}

      <Marker
        coordinate={{
          latitude: spawn.latitude,
          longitude: spawn.longitude,
        }}
        onPress={() => {
          setSelectedCreature(creature);
          setSelectedSpawn(spawn);

          setCareDiary((prev) =>
            registerCreatureSeen({
              diary: prev,
              creatureId: creature.id,
            })
          );
        }}
      >
        <View style={{ alignItems: 'center' }}>
          {creature.id === 'animal1' ? (
            <Image
              source={require('../../assets/images/creatures/fox.png')}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={creature.image}
              style={{ width: 40, height: 40 }}
            />
          )}
        </View>
      </Marker>
    </React.Fragment>
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
  if (isActionCoolingDown('water')) return;
  const spotLat =
    (location?.latitude ?? 52.52) + (Math.cos(i * 2.1) * 0.005);
  const spotLng =
    (location?.longitude ?? 13.405) + (Math.sin(i * 2.1) * 0.005);

  const dist = location
    ? getDistance(location.latitude, location.longitude, spotLat, spotLng)
    : 999;

  if (dist > RESOURCE_INTERACTION_DISTANCE) {
    alert(t.alertTooFarWater);
    return;
  }

  if (resources.water >= MAX_WATER) {
    alert(t.alertWaterFull);
    return;
  }

  setResources((prev) => refillWater(prev));
  alert(t.alertWaterRefilled);
}}
  >
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 28 }}>💧</Text>
    </View>
  </Marker>
))}
{FEED_SPOTS.map((spot, i) => (
  <Marker
    key={spot.id}
    coordinate={{
      latitude: (location?.latitude ?? 52.52) + (Math.cos(i * 1.7) * 0.004),
      longitude: (location?.longitude ?? 13.405) + (Math.sin(i * 1.7) * 0.004),
    }}
    onPress={() => {
      if (isActionCoolingDown('feed')) return;
      const spotLat = (location?.latitude ?? 52.52) + (Math.cos(i * 1.7) * 0.004);
      const spotLng = (location?.longitude ?? 13.405) + (Math.sin(i * 1.7) * 0.004);

      const dist = location
        ? getDistance(location.latitude, location.longitude, spotLat, spotLng)
        : 999;

      if (dist > RESOURCE_INTERACTION_DISTANCE) {
        alert(t.alertTooFarFeed);
        return;
      }

      if (feedCount >= MAX_FEED) {
        alert(t.alertFeedFull);
        return;
      }

      setResources((prev) => addFeed(prev, FEED_PICKUP_AMOUNT));
      alert(t.alertFeedCollected);
    }}
  >
    <View style={{ alignItems: 'center' }}>
  <Image
    source={require('../../assets/images/items/feed.png')}
    style={{ width: 32, height: 32 }}
    resizeMode="contain"
  />
</View>
  </Marker> 
))}
{TRASH_SPOTS.map((spot, i) => (
  <Marker
    key={spot.id}
    coordinate={{
      latitude: (location?.latitude ?? 52.52) + (Math.cos(i * 1.3) * 0.004),
      longitude: (location?.longitude ?? 13.405) + (Math.sin(i * 1.3) * 0.004),
    }}
    onPress={() => {
      if (isActionCoolingDown('trash')) return;
      const spotLat = (location?.latitude ?? 52.52) + (Math.cos(i * 1.3) * 0.004)
      const spotLng = (location?.longitude ?? 13.405) + (Math.sin(i * 1.3) * 0.004)

      const dist = location
        ? getDistance(location.latitude, location.longitude, spotLat, spotLng)
        : 999;

      if (dist > RESOURCE_INTERACTION_DISTANCE) {
        alert(t.alertTooFarTrash);
        return;
      }

      // логика ниже 👇
    if (spot.type === 'plastic') {
  if (plastic >= MAX_TRASH_PER_TYPE) {
    alert(t.alertTrashFull);
    return;
  }
  setResources((prev) => addTrash(prev, 'plastic', TRASH_PICKUP_AMOUNT));
}

if (spot.type === 'glass') {
  if (glass >= MAX_TRASH_PER_TYPE) {
    alert(t.alertTrashFull);
    return;
  }
  setResources((prev) => addTrash(prev, 'glass', TRASH_PICKUP_AMOUNT));
}

if (spot.type === 'paper') {
  if (paper >= MAX_TRASH_PER_TYPE) {
    alert(t.alertTrashFull);
    return;
  }
  setResources((prev) => addTrash(prev, 'paper', TRASH_PICKUP_AMOUNT));
}

alert(t.alertTrashCollected);
    }}
  >
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
  <Image
    source={
      spot.type === 'plastic'
        ? require('../../assets/images/items/plastictrash.png')
        : spot.type === 'glass'
        ? require('../../assets/images/items/glasstrash.png')
        :spot.type === 'paper'
        ? require('../../assets/images/items/papertrash.png')
    : ''}
    style={{ width: 30, height: 30 }}
    resizeMode="contain"
  />
</View>
  </Marker>
))}
{BIO_SPOTS.map((spot, i) => (
  <Marker
    key={spot.id}
    coordinate={{
      latitude: (location?.latitude ?? 52.52) + (Math.cos(i * 2.6) * 0.006),
      longitude: (location?.longitude ?? 13.405) + (Math.sin(i * 2.6) * 0.006),
    }}
    onPress={() => {
      if (isActionCoolingDown('bio')) return;
      const spotLat = (location?.latitude ?? 52.52) + (Math.cos(i * 2.6) * 0.006);
      const spotLng = (location?.longitude ?? 13.405) + (Math.sin(i * 2.6) * 0.006);

      const dist = location
        ? getDistance(location.latitude, location.longitude, spotLat, spotLng)
        : 999;

      if (dist > RESOURCE_INTERACTION_DISTANCE) {
        alert(t.alertTooFarBio);
        return;
      }

      if (bio >= MAX_BIO) {
        alert(t.alertBioFull);
        return;
      }

      setResources((prev) => addTrash(prev, 'bio', BIO_PICKUP_AMOUNT));
      alert(t.alertBioCollected);
    }}
  >
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={require('../../assets/images/items/bio.png')}
        style={{ width: 30, height: 30 }}
        resizeMode="contain"
      />
    </View>
  </Marker>
))}
            
          </WorldMap>
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
  mapBtnActive3D: { borderColor: '#e8c97a', backgroundColor: '#2a2010' },
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
  newQuestsText: { color: '#e8e4d8', fontSize: 16 },
  resourcesStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  resourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#0f1a0f',
    borderWidth: 1,
    borderColor: '#1e3020',
    gap: 4,
  },
  resourceEmoji: {
    fontSize: 14,
  },
  resourceText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  devGeoHint: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(246,188,64,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(246,188,64,0.35)',
  },
  devGeoHintText: {
    color: '#f6bc40',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  devDock: {
    position: 'absolute',
    right: 14,
    bottom: 18,
    zIndex: 120,
  },
  devBtn: {
    backgroundColor: '#3b235a',
    borderColor: '#8a4df3',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  devBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  devPanel: {
    position: 'absolute',
    right: 14,
    bottom: 64,
    zIndex: 120,
    backgroundColor: '#101510',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e3020',
    padding: 8,
    gap: 6,
    minWidth: 130,
  },
  devPanelBtn: {
    backgroundColor: '#1e3020',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  devPanelBtnDanger: {
    backgroundColor: '#5c1f1f',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  cardLocked: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(15,26,15,0.5)',
    borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(30,48,32,0.5)',
    opacity: 0.55,
  },
  cardTitleLocked: { fontSize: 15, color: 'rgba(232,228,216,0.5)', fontWeight: '500' },
  cardRewardLocked: { fontSize: 13, color: 'rgba(232,201,122,0.4)', fontWeight: '600' },
  dropToast: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    backgroundColor: '#1a2a1a', borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 10,
    borderWidth: 1, borderColor: '#3d8b52',
    zIndex: 200,
  },
  dropToastText: { color: '#e8e4d8', fontSize: 14, fontWeight: '500' },
  devPanelBtnText: {
    color: '#e8e4d8',
    fontSize: 12,
    textAlign: 'center',
  },
});