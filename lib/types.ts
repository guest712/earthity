export type LanguageCode = 'ru' | 'de' | 'uk' | 'ar' | 'en';

export type Translation = Record<LanguageCode, string>;

export type Creature = {
  id: string;
  label: Translation;
  reward: number;
  cooldown: number;
  type: CreatureType;
  image: any; // позже можно типизировать через ImageSourcePropType
};

export type SpawnedCreature = {
  spawnId: string;
  creatureId: string;
  latitude: number;
  longitude: number;
  spawnedAt: number;
  expiresAt: number;
};

export type QuestType = 'trash' | 'help' | 'home' | 'test';

export type Quest = {
  id: number;
  title: Translation;
  desc: Translation;
  reward: number;
  type: QuestType;
  emoji: string;
};

export type CreatureType = 'animal' | 'flower';

export type EarthitySave = {
  dobri: number;
  totalDobri: number;
  xp: number;
  deeds: number;

  outdoorDeeds: number;
  homeDeeds: number;
  petDeeds: number;
  testDeeds: number;

  completed: number[];

  lang: LanguageCode;
  onboarded: boolean;

  streak: number;
  lastOpenDate: string;

  waterLevel: number;

  avatar: string;
  name: string;

  selectedTitle: string;
  selectedTitleEmoji: string;
  selectedTitleName: any;

  unlockedTitles: any[];
  careDiary: CareDiaryEntry[];
};

export type CareDiaryEntry = {
  creatureId: string;
  firstSeenAt: number;
  lastSeenAt: number;
  interactions: number;
  firstCaredAt?: number;
  lastCaredAt?: number;
};