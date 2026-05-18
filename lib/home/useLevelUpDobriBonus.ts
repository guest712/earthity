import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';

import { getLevelKey } from '../shared/game-utils';

export function useLevelUpDobriBonus(
  xp: number,
  setDobri: Dispatch<SetStateAction<number>>,
  setTotalDobri: Dispatch<SetStateAction<number>>
) {
  const prevLevelKey = useRef('');

  useEffect(() => {
    const currentKey = getLevelKey(xp);
    if (prevLevelKey.current && prevLevelKey.current !== currentKey) {
      setDobri((prev) => prev + 50);
      setTotalDobri((prev) => prev + 50);
    }
    prevLevelKey.current = currentKey;
  }, [xp, setDobri, setTotalDobri]);
}
