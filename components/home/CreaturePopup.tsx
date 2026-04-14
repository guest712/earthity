import { Image, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

type Props = {
  selectedCreature: any;
  lang: string;
  waterLevel: number;
  isFeeding: boolean;
  feedingProgress: number;
  breathStyle: any;
  creatureCooldowns: Record<string, number>;
  onPressAction: () => void;
  onClose: () => void;
};

export default function CreaturePopup({
  selectedCreature,
  lang,
  waterLevel,
  isFeeding,
  feedingProgress,
  breathStyle,
  creatureCooldowns,
  onPressAction,
  onClose,
}: Props) {
  const isCoolingDown =
    creatureCooldowns[selectedCreature.id] &&
    Date.now() - creatureCooldowns[selectedCreature.id] < selectedCreature.cooldown;

  return (
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
        <Text style={styles.waterText}>💧 Вода: {waterLevel} / 10</Text>
      )}

      {isFeeding && (
        <View style={styles.feedingBarBg}>
          <View style={[styles.feedingBarFill, { width: `${feedingProgress}%` }]} />
        </View>
      )}

      <TouchableOpacity style={styles.creatureBtn} onPress={onPressAction}>
        <Text style={styles.creatureBtnText}>
          {isCoolingDown
            ? '⏳ Подождите'
            : selectedCreature.type === 'flower'
            ? '💧 Полить'
            : '🍃 Покормить'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>✕ Закрыть</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  creaturePopup: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#0f1a0f',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d6a3f',
    zIndex: 100,
  },
  creatureName: {
    fontSize: 18,
    color: '#e8e4d8',
    fontWeight: '500',
    marginBottom: 4,
  },
  creatureReward: {
    fontSize: 14,
    color: '#e8c97a',
    marginBottom: 16,
  },
  waterText: {
    fontSize: 13,
    color: '#7ab8f5',
    marginBottom: 8,
  },
  creatureBtn: {
    backgroundColor: '#2d6a3f',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 8,
  },
  creatureBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  feedingBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#1e3020',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  feedingBarFill: {
    height: '100%',
    backgroundColor: '#5aad6a',
    borderRadius: 4,
  },
});