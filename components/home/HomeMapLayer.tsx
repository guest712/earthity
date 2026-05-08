import React from 'react';
import { Image, Text, View } from 'react-native';
import { Circle, Marker } from 'react-native-maps';

import { CREATURES } from '../../features/creatures/creature.constants';
import {
  BIO_SPOTS,
  BIO_PICKUP_AMOUNT,
  FEED_PICKUP_AMOUNT,
  FEED_SPOTS,
  MAX_BIO,
  MAX_FEED,
  MAX_TRASH_PER_TYPE,
  MAX_WATER,
  RESOURCE_INTERACTION_DISTANCE,
  TRASH_PICKUP_AMOUNT,
  TRASH_SPOTS,
  WATER_SPOTS,
} from '../../features/resources/resource.constants';
import type { LocaleStrings } from '../../lib/i18n/locale-strings';
import { getCreatureInteractionRadiusMeters } from '../../lib/shared/game-engine';
import { getDistance } from '../../lib/shared/game-utils';
import type { Creature, DailyQuestKind, LanguageCode, Quest, SpawnedCreature } from '../../lib/shared/types';

import CreatureMapMarker from '../map/CreatureMapMarker';

type TrashKind = 'plastic' | 'glass' | 'paper' | 'bio';

export type HomeMapLayerProps = {
  t: LocaleStrings;
  lang: LanguageCode;
  location: { latitude: number; longitude: number } | null;
  filteredQuests: Quest[];
  activeSpawns: SpawnedCreature[];
  selectedSpawn: SpawnedCreature | null;
  devBypassDistance: boolean;
  resourcesWater: number;
  feedCount: number;
  plastic: number;
  glass: number;
  paper: number;
  bio: number;
  isResourceSpotActive: (spotId: string) => boolean;
  despawnResourceSpot: (spotId: string, respawnMs?: number) => void;
  isActionCoolingDown: (kind: 'creature' | 'water' | 'feed' | 'trash' | 'bio') => boolean;
  incrementDaily: (kind: DailyQuestKind, amount?: number) => void;
  refillWaterInv: () => void;
  addFeedInv: (n: number) => void;
  addTrashInv: (kind: TrashKind, n: number) => void;
  onQuestMarkerPress: (q: Quest) => void;
  onCreatureSpawnPress: (creature: Creature, spawn: SpawnedCreature) => void;
};

const DEFAULT_LAT = 52.52;
const DEFAULT_LNG = 13.405;

export default function HomeMapLayer(props: HomeMapLayerProps) {
  const {
    t,
    lang,
    location,
    filteredQuests,
    activeSpawns,
    selectedSpawn,
    devBypassDistance,
    resourcesWater,
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
    onQuestMarkerPress,
    onCreatureSpawnPress,
  } = props;

  const lat0 = location?.latitude ?? DEFAULT_LAT;
  const lng0 = location?.longitude ?? DEFAULT_LNG;

  return (
    <>
      {filteredQuests.map((q) => (
        <Marker
          key={q.id}
          coordinate={{
            latitude: lat0 + q.id * 0.003,
            longitude: lng0 + q.id * 0.002,
          }}
          title={q.title[lang]}
          description={`+${q.reward} ${t.reward}`}
          onPress={() => onQuestMarkerPress(q)}
        />
      ))}

      {activeSpawns.map((spawn) => {
        const creature = CREATURES.find((c) => c.id === spawn.creatureId);
        if (!creature) return null;

        const interactRadiusM = getCreatureInteractionRadiusMeters(creature);

        const dist = location
          ? getDistance(location.latitude, location.longitude, spawn.latitude, spawn.longitude)
          : 999;

        const isClose = devBypassDistance || dist <= interactRadiusM;

        return (
          <React.Fragment key={spawn.spawnId}>
            {selectedSpawn?.spawnId === spawn.spawnId && (
              <Circle
                center={{
                  latitude: spawn.latitude,
                  longitude: spawn.longitude,
                }}
                radius={interactRadiusM}
                strokeWidth={2}
                strokeColor={
                  isClose ? 'rgba(90,200,120,0.9)' : 'rgba(90,173,106,0.5)'
                }
                fillColor={isClose ? 'rgba(90,200,120,0.25)' : 'rgba(90,173,106,0.1)'}
              />
            )}

            <CreatureMapMarker
              coordinate={{
                latitude: spawn.latitude,
                longitude: spawn.longitude,
              }}
              image={creature.image}
              onPress={() => onCreatureSpawnPress(creature, spawn)}
            />
          </React.Fragment>
        );
      })}

      {WATER_SPOTS.map((spot, i) => {
        if (!isResourceSpotActive(spot.id)) return null;
        return (
          <Marker
            key={spot.id}
            coordinate={{
              latitude: lat0 + Math.cos(i * 2.1) * 0.005,
              longitude: lng0 + Math.sin(i * 2.1) * 0.005,
            }}
            onPress={() => {
              if (isActionCoolingDown('water')) return;
              const spotLat = lat0 + Math.cos(i * 2.1) * 0.005;
              const spotLng = lng0 + Math.sin(i * 2.1) * 0.005;

              const dist = location
                ? getDistance(location.latitude, location.longitude, spotLat, spotLng)
                : 999;

              if (!devBypassDistance && dist > RESOURCE_INTERACTION_DISTANCE) {
                alert(t.alertTooFarWater);
                return;
              }

              if (resourcesWater >= MAX_WATER) {
                alert(t.alertWaterFull);
                return;
              }

              refillWaterInv();
              despawnResourceSpot(spot.id);
              alert(t.alertWaterRefilled);
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28 }}>💧</Text>
            </View>
          </Marker>
        );
      })}

      {FEED_SPOTS.map((spot, i) => {
        if (!isResourceSpotActive(spot.id)) return null;
        return (
          <Marker
            key={spot.id}
            coordinate={{
              latitude: lat0 + Math.cos(i * 1.7) * 0.004,
              longitude: lng0 + Math.sin(i * 1.7) * 0.004,
            }}
            onPress={() => {
              if (isActionCoolingDown('feed')) return;
              const spotLat = lat0 + Math.cos(i * 1.7) * 0.004;
              const spotLng = lng0 + Math.sin(i * 1.7) * 0.004;

              const dist = location
                ? getDistance(location.latitude, location.longitude, spotLat, spotLng)
                : 999;

              if (!devBypassDistance && dist > RESOURCE_INTERACTION_DISTANCE) {
                alert(t.alertTooFarFeed);
                return;
              }

              if (feedCount >= MAX_FEED) {
                alert(t.alertFeedFull);
                return;
              }

              addFeedInv(FEED_PICKUP_AMOUNT);
              incrementDaily('collect_feed', FEED_PICKUP_AMOUNT);
              despawnResourceSpot(spot.id);
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
        );
      })}

      {TRASH_SPOTS.map((spot, i) => {
        if (!isResourceSpotActive(spot.id)) return null;
        return (
          <Marker
            key={spot.id}
            coordinate={{
              latitude: lat0 + Math.cos(i * 1.3) * 0.004,
              longitude: lng0 + Math.sin(i * 1.3) * 0.004,
            }}
            onPress={() => {
              if (isActionCoolingDown('trash')) return;
              const spotLat = lat0 + Math.cos(i * 1.3) * 0.004;
              const spotLng = lng0 + Math.sin(i * 1.3) * 0.004;

              const dist = location
                ? getDistance(location.latitude, location.longitude, spotLat, spotLng)
                : 999;

              if (!devBypassDistance && dist > RESOURCE_INTERACTION_DISTANCE) {
                alert(t.alertTooFarTrash);
                return;
              }

              if (spot.type === 'plastic') {
                if (plastic >= MAX_TRASH_PER_TYPE) {
                  alert(t.alertTrashFull);
                  return;
                }
                addTrashInv('plastic', TRASH_PICKUP_AMOUNT);
              }

              if (spot.type === 'glass') {
                if (glass >= MAX_TRASH_PER_TYPE) {
                  alert(t.alertTrashFull);
                  return;
                }
                addTrashInv('glass', TRASH_PICKUP_AMOUNT);
              }

              if (spot.type === 'paper') {
                if (paper >= MAX_TRASH_PER_TYPE) {
                  alert(t.alertTrashFull);
                  return;
                }
                addTrashInv('paper', TRASH_PICKUP_AMOUNT);
              }

              incrementDaily('collect_trash', TRASH_PICKUP_AMOUNT);
              despawnResourceSpot(spot.id);
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
                      : spot.type === 'paper'
                        ? require('../../assets/images/items/papertrash.png')
                        : ''
                }
                style={{ width: 30, height: 30 }}
                resizeMode="contain"
              />
            </View>
          </Marker>
        );
      })}

      {BIO_SPOTS.map((spot, i) => {
        if (!isResourceSpotActive(spot.id)) return null;
        return (
          <Marker
            key={spot.id}
            coordinate={{
              latitude: lat0 + Math.cos(i * 2.6) * 0.006,
              longitude: lng0 + Math.sin(i * 2.6) * 0.006,
            }}
            onPress={() => {
              if (isActionCoolingDown('bio')) return;
              const spotLat = lat0 + Math.cos(i * 2.6) * 0.006;
              const spotLng = lng0 + Math.sin(i * 2.6) * 0.006;

              const dist = location
                ? getDistance(location.latitude, location.longitude, spotLat, spotLng)
                : 999;

              if (!devBypassDistance && dist > RESOURCE_INTERACTION_DISTANCE) {
                alert(t.alertTooFarBio);
                return;
              }

              if (bio >= MAX_BIO) {
                alert(t.alertBioFull);
                return;
              }

              addTrashInv('bio', BIO_PICKUP_AMOUNT);
              incrementDaily('collect_trash', BIO_PICKUP_AMOUNT);
              despawnResourceSpot(spot.id);
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
        );
      })}
    </>
  );
}
