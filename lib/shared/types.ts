export type LanguageCode = 'ru' | 'de' | 'uk' | 'ar' | 'en';

export type Translation = Record<LanguageCode, string>;

export type QuestType = 'trash' | 'help' | 'home' | 'test';

export type DropId = 'feather' | 'petal' | 'paw_print' | 'seed' | 'scale';

export type QuestUnlockCondition = {
  dropId: DropId;
  amount: number;
};

export type Quest = {
  id: number;
  title: Translation;
  desc: Translation;
  reward: number;
  type: QuestType;
  emoji: string;
  unlockedBy?: QuestUnlockCondition;
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
  saveVersion: number;
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
  resources: {
    water: number;
    feed: number;
    trash: {
      plastic: number;
      glass: number;
      paper: number;
      bio: number;
    };
  };

  avatar: string;
  name: string;

  selectedTitle: string;
  selectedTitleEmoji: string;
  selectedTitleName: string | Record<string, string> | '';

  unlockedTitles: UnlockedTitle[];
  careDiary: CareDiaryEntry[];
  drops: Partial<Record<DropId, number>>;
};