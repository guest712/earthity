import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  CLEANUP_BASE_DOBRI,
  CLEANUP_BASE_XP,
  displayRewardMultiplier,
} from '../../features/cleanupSpots/cleanupReward';
import type { CleanupSpot } from '../../features/cleanupSpots/cleanupSpot.types';
import type { LocaleStrings } from '../../lib/i18n/locale-strings';

type Props = {
  t: LocaleStrings;
  spot: CleanupSpot;
  currentUserId: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onMarkCleaned: () => void;
  onDeleteOwn: () => void;
};

export default function CleanupSpotSheet({
  t,
  spot,
  currentUserId,
  isSubmitting,
  onClose,
  onMarkCleaned,
  onDeleteOwn,
}: Props) {
  const isOwn = currentUserId != null && spot.userId === currentUserId;
  const multLabel = displayRewardMultiplier(spot.rewardMultiplier);
  const epicLine =
    spot.rewardTier === 'epic'
      ? t.cleanupSpotEpicQuest.replace('{mult}', String(multLabel))
      : spot.rewardTier === 'rare'
        ? t.cleanupSpotRareQuest.replace('{mult}', String(multLabel))
        : null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.card}>
        <Text style={styles.emoji}>🗑️</Text>
        <Text style={styles.title}>{t.cleanupSpotTitle}</Text>
        <Text style={styles.body}>{spot.note ?? t.cleanupReportMessage}</Text>
        {epicLine ? (
          <Text
            style={[
              styles.rewardLine,
              spot.rewardTier === 'epic' && styles.rewardLineEpic,
            ]}
          >
            {epicLine}
          </Text>
        ) : null}
        {!isOwn && spot.rewardTier !== 'normal' ? (
          <Text style={styles.rewardHint}>
            {t.cleanupSpotRewardHint
              .replace('{dobri}', String(Math.round(CLEANUP_BASE_DOBRI * spot.rewardMultiplier)))
              .replace('{xp}', String(Math.round(CLEANUP_BASE_XP * spot.rewardMultiplier)))}
          </Text>
        ) : null}
        {isOwn ? (
          <Text style={styles.ownHint}>{t.cleanupSpotYourReport}</Text>
        ) : null}

        {isOwn ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnDanger]}
            onPress={onDeleteOwn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#f0c0c0" />
            ) : (
              <Text style={styles.btnDangerText}>{t.cleanupSpotDelete}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={onMarkCleaned}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#0c120c" />
            ) : (
              <Text style={styles.btnPrimaryText}>{t.cleanupSpotMarkCleaned}</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btnGhost} onPress={onClose}>
          <Text style={styles.btnGhostText}>{t.creaturePopupClose}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    margin: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#0f1a0f',
    borderWidth: 1,
    borderColor: '#2a4a30',
    alignItems: 'center',
  },
  emoji: { fontSize: 40, marginBottom: 8 },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#e8f5ea',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginBottom: 8,
  },
  ownHint: {
    fontSize: 12,
    color: '#8ab896',
    marginBottom: 12,
  },
  rewardLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d09050',
    textAlign: 'center',
    marginBottom: 6,
  },
  rewardLineEpic: {
    color: '#e8c97a',
    fontSize: 14,
  },
  rewardHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 10,
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimary: { backgroundColor: '#5aad6a' },
  btnPrimaryText: { color: '#0c120c', fontWeight: '700', fontSize: 15 },
  btnDanger: { backgroundColor: 'rgba(180,80,80,0.25)', borderWidth: 1, borderColor: '#8a4040' },
  btnDangerText: { color: '#e8a0a0', fontWeight: '600', fontSize: 15 },
  btnGhost: { marginTop: 4, padding: 10 },
  btnGhostText: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
});
