import '../../lib/home/preloadHomeModels';

import { resetSaveToDefaults } from '../../lib/storage/save.repository';
import { requestNotificationPermissions, scheduleCreatureNotification } from '../../lib/notifications';
import { QUESTS } from '../../features/quests/quest.constants';
import { MINDFUL_PHRASES } from '../../features/quests/mindful-phrases';
import { BIO_PICKUP_AMOUNT, ACTION_COOLDOWN_MS } from '../../features/resources/resource.constants';
import { LANGS, FLAG } from '../../lib/i18n/i18n';
import { guessDeviceLanguage } from '../../lib/i18n/guess-locale';
import { getDistance, getLevelKey, getLevelName } from '../../lib/shared/game-utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RNMapView from 'react-native-maps';
import { homeScreenStyles as styles } from '../../components/home/homeScreen.styles';
import {
  applyQuestCompletion,
  canInteractWithCreature,
  getCreatureRewardResult,
  registerCreatureSeen,
  registerCreatureCared,
  rollCreatureDrop,
} from '../../lib/shared/game-engine';
import type { CareDiaryEntry, Creature, EarthitySave, LanguageCode, Quest, SpawnedCreature } from '../../lib/shared/types';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Onboarding from './onboarding';
import { Redirect, useRouter } from 'expo-router';
import HomeScreenDevTools from '../../components/home/HomeScreenDevTools';
import HomeScreenMapSection from '../../components/home/HomeScreenMapSection';
import HomeScreenQuestPanel from '../../components/home/HomeScreenQuestPanel';
import HomeHeader from '../../components/home/HomeHeader';
import QuestDetailCard from '../../components/home/QuestDetailCard';
import CreaturePopup from '../../components/home/CreaturePopup';

import { useCreatureSystem } from '../../features/creatures/creature.hook';
import { useLocationState } from '../../features/location/useLocationState';
import { useAppLanguage } from '../../lib/i18n/LanguageContext';
import { useInventory } from '../../features/inventory/inventory.context';
import { useDailyQuests } from '../../features/dailyQuests/dailyQuests.context';
import { AVATARS, DEFAULT_AVATAR_ID } from '../../features/profile/avatar.constants';
import { useCreatureMapSpawns } from '../../lib/home/useCreatureMapSpawns';
import { useHomeMapCamera } from '../../lib/home/useHomeMapCamera';
import { useHomeRewardFeedback } from '../../lib/home/useHomeRewardFeedback';
import { useHomeSaveSync } from '../../lib/home/useHomeSaveSync';
import { useResourceSpotRespawn } from '../../lib/home/useResourceSpotRespawn';

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
  const {
    dropToast,
    dropToastStyle,
    rewardAnimStyle,
    playRewardSound,
    animateReward,
    triggerDropToast,
  } = useHomeRewardFeedback();
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

  const isAutoCompassCurrentModeEnabled =
    mapMode === '3D_Tilt' ? autoCompass3DEnabled : autoCompass2DEnabled;

  const prevLevelKey = useRef('');

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

  const onBootstrapSave = useCallback(
    (save: EarthitySave) => {
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
    },
    [hydrateCreatureMapSpawns, hydrateResourceRespawnUntil]
  );

  const onFocusRevalidate = useCallback((save: EarthitySave) => {
    setAvatar(save.avatar || DEFAULT_AVATAR_ID);
    setDobri(save.dobri);
    setTotalDobri(save.totalDobri || save.dobri || 0);
    setXp(save.xp);
  }, []);

  const autosavePayload = useMemo(
    () =>
      lang
        ? {
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
          }
        : null,
    [
      lang,
      dobri,
      xp,
      deeds,
      completed,
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
      activeSpawns,
      lastSpawnCenter,
      lastSpawnRefreshAt,
    ]
  );

  useHomeSaveSync({
    lang,
    isHydrated,
    setIsHydrated,
    onBootstrapSave,
    onFocusRevalidate,
    autosavePayload,
  });

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

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

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

  const activeQuests = QUESTS.filter((q) => !completed.includes(q.id) && isQuestUnlocked(q));
  const filteredQuests = activeQuests.filter((q) => {
    if (category === 'outdoor') return q.type === 'trash' || q.type === 'help';
    if (category === 'home') return q.type === 'home';
    return true;
  });

  const lockedQuests = QUESTS.filter((q) => !completed.includes(q.id) && !isQuestUnlocked(q)).filter(
    (q) => {
      if (category === 'outdoor') return q.type === 'trash' || q.type === 'help';
      if (category === 'home') return q.type === 'home';
      return true;
    }
  );
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

  function handleQuestCardPress(q: Quest) {
    setSelected(q);
    setShowConfirmBtn(false);
    setTimeout(() => setShowConfirmBtn(true), 1500);
  }

  const homeMapLayerProps = {
    t,
    lang,
    location,
    filteredQuests,
    activeSpawns,
    selectedSpawn,
    devBypassDistance,
    resourcesWater: resources.water,
    feedCount,
    plastic,
    glass,
    paper,
    bio,
    isResourceSpotActive,
    despawnResourceSpot,
    isActionCoolingDown,
    incrementDaily,
    refillWaterInv,
    addFeedInv,
    addTrashInv,
    onQuestMarkerPress: handleQuestCardPress,
    onCreatureSpawnPress: (creature: Creature, spawn: SpawnedCreature) => {
      setSelectedCreature(creature);
      setSelectedSpawn(spawn);
      setCareDiary((prev) =>
        registerCreatureSeen({
          diary: prev,
          creatureId: creature.id,
        })
      );
    },
  };

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
      <HomeScreenDevTools
        isLocationFallback={isLocationFallback}
        showDevPanel={showDevPanel}
        onToggleDevPanel={() => setShowDevPanel((prev) => !prev)}
        devIgnoreInteractionDistance={devIgnoreInteractionDistance}
        onToggleIgnoreDistance={() => setDevIgnoreInteractionDistance((v) => !v)}
        autoCompass2DEnabled={autoCompass2DEnabled}
        onToggleAutoCompass2D={() => setAutoCompass2DEnabled((v) => !v)}
        autoCompass3DEnabled={autoCompass3DEnabled}
        onToggleAutoCompass3D={() => setAutoCompass3DEnabled((v) => !v)}
        onOpenThreeTest={() => router.push('/three-test')}
        onDevAddWater3={() => addWaterInv(3)}
        onDevAddFeed3={() => addFeedInv(3)}
        onDevAddBio={() => addTrashInv('bio', BIO_PICKUP_AMOUNT)}
        onResetSave={async () => {
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
      />
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

              setActiveSpawns((prev) => prev.filter((item) => item.spawnId !== spawn.spawnId));

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
          <HomeScreenMapSection
            mapRef={mapRef}
            mapTileStyle={mapTileStyle}
            mapMode={mapMode}
            isAutoCompassCurrentModeEnabled={isAutoCompassCurrentModeEnabled}
            autoCompass2DEnabled={autoCompass2DEnabled}
            autoCompass3DEnabled={autoCompass3DEnabled}
            location={location}
            userAvatarSource={currentAvatar.image}
            userAvatarId={avatar}
            homeMapLayerProps={homeMapLayerProps}
            onSelectStandardMap={() => setMapTileStyle('standard')}
            onSelectSatelliteMap={() => setMapTileStyle('satellite')}
            onToggle2D3D={() => setMapMode((prev) => (prev === '2D' ? '3D_Tilt' : '2D'))}
            onToggleAutoCompass={() => {
              if (mapMode === '3D_Tilt') {
                setAutoCompass3DEnabled((prev) => !prev);
              } else {
                setAutoCompass2DEnabled((prev) => !prev);
              }
            }}
            onRecenter={recenterOnUser}
          />
          <HomeScreenQuestPanel
            category={category}
            onCategoryChange={setCategory}
            categoryLabels={{
              all: t.catAll,
              outdoor: t.catOutdoor,
              home: t.catHome,
            }}
            t={t}
            lang={lang}
            filteredQuests={filteredQuests}
            lockedQuests={lockedQuests}
            drops={drops}
            onQuestCardPress={handleQuestCardPress}
            onClearCompletedQuests={() => setCompleted([])}
          />
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
