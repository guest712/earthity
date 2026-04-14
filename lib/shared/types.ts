export type LanguageCode = 'ru' | 'de' | 'uk' | 'ar' | 'en';

export type Translation = Record<LanguageCode, string>;

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

export type Creature = {
  id: string;
  label: Translation;
  reward: number;
  cooldown: number;
  type: CreatureType;
  image: any;
};

export type SpawnedCreature = {
  spawnId: string;
  creatureId: string;
  latitude: number;
  longitude: number;
  spawnedAt: number;
  expiresAt: number;
};

export type CareDiaryEntry = {
  creatureId: string;
  firstSeenAt: number;
  lastSeenAt: number;
  interactions: number;
  firstCaredAt?: number;
  lastCaredAt?: number;
};

export type UnlockedTitle = {
  id: string;
  title: string | Record<string, string>;
  emoji: string;
};

export type EarthitySave = {
  dobri: number;
  totalDobri: number;
  xp: number;
  deeds: number;
  completed: number[];

  lang: LanguageCode;
  onboarded: boolean;

  outdoorDeeds: number;
  homeDeeds: number;
  petDeeds: number;
  streak: number;
  lastOpenDate: string;
  testDeeds: number;
  waterLevel: number;
  feedCount: number;
  plastic: number;
  glass: number;
  paper: number;

  avatar: string;
  name: string;

  selectedTitle: string;
  selectedTitleEmoji: string;
  selectedTitleName: string | Record<string, string> | '';

  unlockedTitles: UnlockedTitle[];
  careDiary: CareDiaryEntry[];
};