type QuestType = 'trash' | 'help' | 'home' | 'test';

type Quest = {
  id: number;
  reward: number;
  type: QuestType;
};

type CompleteQuestResult = {
  completed: number[];
  dobri: number;
  totalDobri: number;
  xp: number;
  deeds: number;
  outdoorDeeds: number;
  homeDeeds: number;
  petDeeds: number;
  testDeeds: number;
};

export function getStreakBonus(streak: number): number {
  if (streak >= 20) return 1.15;
  if (streak >= 10) return 1.1;
  if (streak >= 5) return 1.05;
  return 1;
}

export function applyQuestCompletion(params: {
  selected: Quest;
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
}): CompleteQuestResult {
  const {
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
  } = params;

  const streakBonus = getStreakBonus(streak);
  const gainedXp = Math.round(selected.reward * streakBonus);

  return {
    completed: [...completed, selected.id],
    dobri: dobri + selected.reward,
    totalDobri: totalDobri + selected.reward,
    xp: xp + gainedXp,
    deeds: deeds + 1,
    outdoorDeeds:
      selected.type === 'trash' || selected.type === 'help'
        ? outdoorDeeds + 1
        : outdoorDeeds,
    homeDeeds: selected.type === 'home' ? homeDeeds + 1 : homeDeeds,
    petDeeds: selected.id === 9 ? petDeeds + 1 : petDeeds,
    testDeeds: selected.type === 'test' ? testDeeds + 1 : testDeeds,
  };
}

export function getCreaturePosition(
  baseLatitude: number,
  baseLongitude: number,
  index: number
) {
  return {
    latitude: baseLatitude + Math.sin(index * 1.5) * 0.003,
    longitude: baseLongitude + Math.cos(index * 1.5) * 0.003,
  };
}

export function isWithinInteractionDistance(
  distance: number,
  maxDistance = 300
): boolean {
  return distance <= maxDistance;
}