import '../../../lib/home/preloadHomeModels';

import { resetSaveToDefaults } from '../../../lib/storage/save.repository';
import { BIO_PICKUP_AMOUNT } from '../../../features/resources/resource.constants';
import { LANGS, FLAG } from '../../../lib/i18n/i18n';
import { getLevelName } from '../../../lib/shared/game-utils';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import RNMapView from 'react-native-maps';
import type { Region } from 'react-native-maps';
import { homeScreenStyles as styles } from '../../../components/home/homeScreen.styles';
import type { CareDiaryEntry, Creature, LanguageCode, Quest, SpawnedCreature } from '../../../lib/shared/types';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import Onboarding from '@/app/(app)/(tabs)/onboarding';
import { Redirect, useRouter } from 'expo-router';
import HomeScreenDevTools from '../../../components/home/HomeScreenDevTools';
import HomeScreenMapSection from '../../../components/home/HomeScreenMapSection';
import type { ARObject } from '../../../components/map/MapARScene';
import HomeScreenQuestPanel from '../../../components/home/HomeScreenQuestPanel';
import HomeHeader from '../../../components/home/HomeHeader';
import QuestDetailCard from '../../../components/home/QuestDetailCard';
import CreaturePopup from '../../../components/home/CreaturePopup';
import HomeLanguagePicker from '../../../components/home/HomeLanguagePicker';

import { useCreatureSystem } from '../../../features/creatures/creature.hook';
import { useLocationState } from '../../../features/location/useLocationState';
import { useAppLanguage } from '../../../lib/i18n/LanguageContext';
import { useInventory } from '../../../features/inventory/inventory.context';
import { useDailyQuests } from '../../../features/dailyQuests/dailyQuests.context';
import { AVATARS, DEFAULT_AVATAR_ID } from '../../../features/profile/avatar.constants';
import { useCreatureMapSpawns } from '../../../lib/home/useCreatureMapSpawns';
import { useHomeMapCamera } from '../../../lib/home/useHomeMapCamera';
import { useHomeRewardFeedback } from '../../../lib/home/useHomeRewardFeedback';
import { useHomeScreenPersist } from '../../../lib/home/useHomeScreenPersist';
import { useResourceSpotRespawn } from '../../../lib/home/useResourceSpotRespawn';
import { useActionCooldown } from '../../../lib/home/useActionCooldown';
import { useLevelUpDobriBonus } from '../../../lib/home/useLevelUpDobriBonus';
import { useDailyWalkTracking } from '../../../lib/home/useDailyWalkTracking';
import { useHomeBreathAnimation } from '../../../lib/home/useHomeBreathAnimation';
import { useRequestNotificationsOnMount } from '../../../lib/home/useRequestNotificationsOnMount';
import { useHomeQuestLists } from '../../../lib/home/useHomeQuestLists';
import { useHomeQuestFlow } from '../../../lib/home/useHomeQuestFlow';
import { useHomeMapLayerProps } from '../../../lib/home/useHomeMapLayerProps';
import { useHomeCreatureCareActions } from '../../../lib/home/useHomeCreatureCareActions';
import { syncHomeBootstrapFromEarthitySave } from '../../../lib/home/syncHomeBootstrapFromEarthitySave';
import { useMapDecorTreeCoordinates } from '../../../lib/home/useMapDecorTreeCoordinates';

/**
 * Dev flag: keep false for normal app flow.
 * Toggle to true only when you want to boot directly into the 3D test route.
 */
const USE_3D_TEST_SCREEN = false;

// Используем оригинальную (до merge с walking.glb) модель волка — она единственная
// гарантированно проигрывает встроенную idle-анимацию на устройстве. Merged-вариант
// (assets/models/test_wolf.glb) после санитайза треков иногда не оживает на Android.
const PLAYER_MAP_MODEL = require('../../../assets/models/test_wolf1.glb');
const PLAYER_MAP_HEADING_OFFSET_DEG = 150;

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
  const [category, setCategory] = useState<'all' | 'outdoor' | 'home'>('all');
  const [onboarded, setOnboarded] = useState(false);
  const [streak, setStreak] = useState(0);
  const { location, isLocationFallback, heading } = useLocationState();
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
  const { isActionCoolingDown } = useActionCooldown();
  const mapRef = useRef<RNMapView | null>(null);
  const mapRegionTickRef = useRef(0);
  const [mapRegionSnapshot, setMapRegionSnapshot] = useState<Region | null>(null);
  const [mapRegionLayoutSeed, setMapRegionLayoutSeed] = useState(0);
  const [mapDecorProjectEpoch, setMapDecorProjectEpoch] = useState(0);
  const [mapDecorTreesDevEnabled, setMapDecorTreesDevEnabled] = useState(true);
  // 3D-модель игрока на карте. По умолчанию выключена: показывается обычный 2D-аватар.
  // Тумблер в DEV-панели → маркер прячется, поверх рендерится `MapARScene` с GLB.
  const [playerArEnabled, setPlayerArEnabled] = useState(false);

  const bumpMapProjection = useCallback(() => {
    mapRegionTickRef.current += 1;
    setMapDecorProjectEpoch((e) => e + 1);
  }, []);

  const onMapRegionChangeComplete = useCallback((r: Region) => {
    setMapRegionSnapshot(r);
    mapRegionTickRef.current += 1;
    setMapRegionLayoutSeed((s) => s + 1);
    setMapDecorProjectEpoch((e) => e + 1);
  }, []);

  const onMapLayoutReady = useCallback(() => {
    bumpMapProjection();
  }, [bumpMapProjection]);

  const decorTreeCoordinates = useMapDecorTreeCoordinates({
    enabled: mapDecorTreesDevEnabled,
    location,
    region: mapRegionSnapshot,
    regionLayoutSeed: mapRegionLayoutSeed,
  });

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

  const [outdoorDeeds, setOutdoorDeeds] = useState(0);
  const [homeDeeds, setHomeDeeds] = useState(0);
  const [petDeeds, setPetDeeds] = useState(0);

  const autosaveSnapshot = useMemo(
    () => ({
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
      creatureMapSpawns: {
        activeSpawns,
        lastSpawnCenter,
        lastSpawnRefreshAt,
      },
    }),
    [
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

  useHomeScreenPersist({
    lang,
    isHydrated,
    setIsHydrated,
    hydrateResourceRespawnUntil,
    hydrateCreatureMapSpawns,
    bootstrap: {
      setDobri,
      setXp,
      setDeeds,
      setCompleted,
      setOnboarded,
      setOutdoorDeeds,
      setHomeDeeds,
      setPetDeeds,
      setTestDeeds,
      setTotalDobri,
      setCareDiary,
      setAvatar,
      setStreak,
      setLastOpenDate,
    },
    autosaveSnapshot,
  });

  useRequestNotificationsOnMount();
  useLevelUpDobriBonus(xp, setDobri, setTotalDobri);
  useDailyWalkTracking(walkTrackingKind, location, isLocationFallback, incrementDaily);
  const { breathStyle } = useHomeBreathAnimation();
  const { filteredQuests, lockedQuests } = useHomeQuestLists(category, completed, drops);

  const localeStringsForQuests = lang ? LANGS[lang] : null;

  const questFlow = useHomeQuestFlow({
    localeStrings: localeStringsForQuests,
    lang,
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
    setSelected,
    setCompleted,
    setDobri,
    setTotalDobri,
    setXp,
    setDeeds,
    setOutdoorDeeds,
    setHomeDeeds,
    setPetDeeds,
    setTestDeeds,
    animateReward,
    playRewardSound,
  });

  const mapBridgeT = localeStringsForQuests ?? LANGS.en;
  const mapBridgeLang = (lang ?? 'en') as LanguageCode;

  const homeMapLayerProps = useHomeMapLayerProps({
    t: mapBridgeT,
    lang: mapBridgeLang,
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
    onQuestMarkerPress: questFlow.handleQuestCardPress,
    setSelectedCreature,
    setSelectedSpawn,
    setCareDiary,
  });

  const mapArObjects = useMemo<ARObject[]>(() => {
    if (!playerArEnabled || !location) return [];
    return [
      {
        id: 'player',
        coordinate: { latitude: location.latitude, longitude: location.longitude },
        modelSource: PLAYER_MAP_MODEL,
        scale: 30,
        heading: heading ?? undefined,
        headingOffsetDeg: PLAYER_MAP_HEADING_OFFSET_DEG,
        locomotion: true,
        fallbackProjectionCenter: true,
      },
    ];
  }, [playerArEnabled, location, heading]);

  const { onPressCreatureAction, onCloseCreaturePopup } = useHomeCreatureCareActions({
    selectedCreature,
    selectedSpawn,
    location,
    devBypassDistance,
    resourcesWater: resources.water,
    feedCount,
    creatureCooldowns,
    isFeeding,
    isActionCoolingDown,
    dobri,
    totalDobri,
    xp,
    lang: mapBridgeLang,
    t: mapBridgeT,
    consumeWater,
    consumeFeed,
    incrementDaily,
    animateReward,
    playRewardSound,
    triggerDropToast,
    addDrop,
    startFeeding,
    setDobri,
    setTotalDobri,
    setXp,
    setCreatureCooldowns,
    setCareDiary,
    setActiveSpawns,
    setSelectedCreature,
    setSelectedSpawn,
  });

  if (!lang) {
    return <HomeLanguagePicker onSelectLanguage={setAppLanguage} />;
  }

  if (!onboarded) {
    return <Onboarding onDone={() => setOnboarded(true)} />;
  }

  const t = LANGS[lang];
  const level = getLevelName(xp, t);
  const nextXp = xp < 50 ? 50 : xp < 150 ? 150 : xp < 300 ? 300 : 500;
  const prevXp = xp < 50 ? 0 : xp < 150 ? 50 : xp < 300 ? 150 : 300;
  const xpProgress = Math.min(100, ((xp - prevXp) / (nextXp - prevXp)) * 100);

  const currentAvatar = AVATARS.find((item) => item.id === avatar) ?? AVATARS[0];

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
          syncHomeBootstrapFromEarthitySave(reset, {
            setDobri,
            setTotalDobri,
            setXp,
            setDeeds,
            setCompleted,
            setOnboarded,
            setOutdoorDeeds,
            setHomeDeeds,
            setPetDeeds,
            setTestDeeds,
            setCareDiary,
            hydrateResourceRespawnUntil,
            hydrateCreatureMapSpawns,
          });
          await reloadInventory();
          setStreak(reset.streak);
          setLastOpenDate(reset.lastOpenDate);
          alert('DEV: save reset');
        }}
        mapDecorTreesEnabled={mapDecorTreesDevEnabled}
        onToggleMapDecorTrees={() => setMapDecorTreesDevEnabled((v) => !v)}
        playerArEnabled={playerArEnabled}
        onTogglePlayerAr={() => setPlayerArEnabled((v) => !v)}
      />
      {selectedCreature && (
        <CreaturePopup
          t={t}
          selectedCreature={selectedCreature}
          lang={lang}
          waterLevel={resources.water}
          feedCount={feedCount}
          isFeeding={isFeeding}
          feedingProgress={feedingProgress}
          breathStyle={breathStyle}
          creatureCooldowns={creatureCooldowns}
          onPressAction={onPressCreatureAction}
          onClose={onCloseCreaturePopup}
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
          mindfulPhrase={questFlow.mindfulPhrase}
          steps={questFlow.selectedSteps}
          confirming={questFlow.confirming}
          showConfirmBtn={questFlow.showConfirmBtn}
          onPressComplete={() => questFlow.showConfirmBtn && questFlow.setConfirming(true)}
          onPressConfirmYes={questFlow.complete}
          onPressConfirmNo={() => questFlow.setConfirming(false)}
          onPressBack={() => {
            setSelected(null);
            questFlow.setConfirming(false);
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
            mapRegionTickRef={mapRegionTickRef}
            decorTreeCoordinates={decorTreeCoordinates}
            mapDecorEnabled={mapDecorTreesDevEnabled}
            mapArObjects={mapArObjects}
            hideUserMarker={playerArEnabled}
            decorProjectEpoch={mapDecorProjectEpoch}
            onMapRegionChangeComplete={onMapRegionChangeComplete}
            onMapLayoutReady={onMapLayoutReady}
            resourceStrip={{
              water: resources.water,
              feedCount,
              plastic,
              glass,
              paper,
              bio,
            }}
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
            onQuestCardPress={questFlow.handleQuestCardPress}
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
