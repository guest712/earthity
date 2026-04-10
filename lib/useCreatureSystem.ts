import { useEffect, useRef, useState } from 'react';

export const useCreatureSystem = () => {
  const [creatureCooldowns, setCreatureCooldowns] = useState<Record<string, number>>({});
  const [feedingProgress, setFeedingProgress] = useState(0);
  const [isFeeding, setIsFeeding] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopFeeding = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsFeeding(false);
    setFeedingProgress(0);
  };

  const startFeeding = (onComplete?: () => void) => {
    if (isFeeding) return;

    setIsFeeding(true);
    setFeedingProgress(0);

    let progress = 0;

    intervalRef.current = setInterval(() => {
      progress += 10;
      setFeedingProgress(progress);

      if (progress >= 100) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        setFeedingProgress(100);
        setIsFeeding(false);
        onComplete?.();
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    creatureCooldowns,
    setCreatureCooldowns,
    feedingProgress,
    setFeedingProgress,
    isFeeding,
    setIsFeeding,
    startFeeding,
    stopFeeding,
  };
};