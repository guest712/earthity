import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';

import { MINDFUL_PHRASES } from '../../features/quests/mindful-phrases';
import { applyQuestCompletion } from '../shared/game-engine';
import type { LocaleStrings } from '../i18n/locale-strings';
import type { LanguageCode, Quest } from '../shared/types';

type UseHomeQuestFlowArgs = {
  localeStrings: LocaleStrings | null;
  lang: LanguageCode | null;
  selected: Quest | null;
  completed: number[];
  dobri: number;
  totalDobri: number;
  xp: number;
  deeds: number;
  outdoorDeeds: number;
  homeDeeds: number;
  petDeeds: number;
  testDeeds: number;
  streak: number;
  setSelected: Dispatch<SetStateAction<Quest | null>>;
  setCompleted: Dispatch<SetStateAction<number[]>>;
  setDobri: Dispatch<SetStateAction<number>>;
  setTotalDobri: Dispatch<SetStateAction<number>>;
  setXp: Dispatch<SetStateAction<number>>;
  setDeeds: Dispatch<SetStateAction<number>>;
  setOutdoorDeeds: Dispatch<SetStateAction<number>>;
  setHomeDeeds: Dispatch<SetStateAction<number>>;
  setPetDeeds: Dispatch<SetStateAction<number>>;
  setTestDeeds: Dispatch<SetStateAction<number>>;
  animateReward: () => void;
  playRewardSound: () => void;
};

export function useHomeQuestFlow({
  localeStrings,
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
}: UseHomeQuestFlowArgs) {
  const [confirming, setConfirming] = useState(false);
  const [showConfirmBtn, setShowConfirmBtn] = useState(false);

  const selectedSteps = useMemo(() => {
    if (!localeStrings || !selected) return [];
    if (selected.type === 'trash') return localeStrings.steps_trash;
    if (selected.type === 'home') return localeStrings.steps_home;
    return localeStrings.steps_help;
  }, [localeStrings, selected]);

  const mindfulPhrase = useMemo(() => {
    if (!lang || !selected) return '';
    return MINDFUL_PHRASES[selected.id % MINDFUL_PHRASES.length][lang];
  }, [lang, selected]);

  const handleQuestCardPress = useCallback(
    (q: Quest) => {
      setSelected(q);
      setShowConfirmBtn(false);
      setTimeout(() => setShowConfirmBtn(true), 1500);
    },
    [setSelected]
  );

  const complete = useCallback(() => {
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
  }, [
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
    setSelected,
  ]);

  return {
    confirming,
    setConfirming,
    showConfirmBtn,
    handleQuestCardPress,
    complete,
    selectedSteps,
    mindfulPhrase,
  };
}
