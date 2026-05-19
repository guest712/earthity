import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.card}>
        <Text style={styles.emoji}>🗑️</Text>
        <Text style={styles.title}>{t.cleanupSpotTitle}</Text>
        <Text style={styles.body}>{spot.note ?? t.cleanupReportMessage}</Text>
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
