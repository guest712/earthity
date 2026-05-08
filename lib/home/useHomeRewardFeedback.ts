import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { DROP_INFO } from '../shared/game-engine';
import type { DropId } from '../shared/types';

export function useHomeRewardFeedback() {
  const [dropToast, setDropToast] = useState<{ dropId: DropId; msg: string } | null>(null);
  const dropToastOpacity = useSharedValue(0);
  const dropToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rewardScale = useSharedValue(1);
  const rewardOpacity = useSharedValue(1);

  const rewardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rewardScale.value }],
    opacity: rewardOpacity.value,
  }));

  const dropToastStyle = useAnimatedStyle(() => ({
    opacity: dropToastOpacity.value,
    transform: [{ translateY: (1 - dropToastOpacity.value) * 16 }],
  }));

  useEffect(() => {
    return () => {
      if (dropToastTimerRef.current) clearTimeout(dropToastTimerRef.current);
    };
  }, []);

  const playRewardSound = useCallback(async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../../assets/sounds/reward.mp3'));
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
  }, []);

  const animateReward = useCallback(() => {
    rewardOpacity.value = withTiming(1, { duration: 100 });
    rewardScale.value = withSequence(withSpring(1.5), withSpring(1));
    setTimeout(() => {
      rewardOpacity.value = withTiming(1, { duration: 500 });
    }, 800);
  }, []);

  const triggerDropToast = useCallback((dropId: DropId, lang: string) => {
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
  }, []);

  return {
    dropToast,
    dropToastStyle,
    rewardAnimStyle,
    playRewardSound,
    animateReward,
    triggerDropToast,
  };
}
