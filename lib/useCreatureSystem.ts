import { useState } from 'react';

export const useCreatureSystem = () => {
  const [creatureCooldowns, setCreatureCooldowns] = useState<Record<string, number>>({});
  const [feedingProgress, setFeedingProgress] = useState(0);
  const [isFeeding, setIsFeeding] = useState(false);

  return {
    creatureCooldowns,
    setCreatureCooldowns,
    feedingProgress,
    setFeedingProgress,
    isFeeding,
    setIsFeeding,
  };
};