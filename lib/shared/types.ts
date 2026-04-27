export type LanguageCode = 'ru' | 'de' | 'uk' | 'ar' | 'en';

export type Translation = Record<LanguageCode, string>;

export type QuestType = 'trash' | 'help' | 'home' | 'test';

export type DropId = 'feather' | 'wool' | 'pollen' | 'scale' | 'petal' | 'seed';

export type CreatureGroup =
  | 'mammal'
  | 'bird'
  | 'insect'
  | 'reptile'
  | 'flora_flower'
  | 'flora_seed';

export type ResourceRewardKind = 'dobri' | 'water' | 'feed';

export type ResourceReward = {
  kind: ResourceRewardKind;
  amount: number;
};

export type TrashId = 'plastic' | 'glass' | 'paper' | 'bio';

export type CraftedItemId =
  | 'flowerpot'
  | 'paper_lantern'
  | 'eco_seed'
  | 'compost_brick'
  | 'mosaic_tile';

export type InventoryItemId =
  | 'water'
  | 'feed'
  | TrashId
  | 'watering_can'
  | DropId
  | CraftedItemId;

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

/**
 * GLB/GLTF asset reference for a poly-model. Either a Metro module id from
 * `require('../../assets/models/foo.glb')` (number) or a remote URL (string).
 * Mirror of `ModelSource` from `components/three/Model.tsx` — duplicated here
 * to avoid pulling three.js types into the shared types module.
 */
export type CreatureModelSource = number | string;

/** One visual step in a growth / mood arc; index = capped `CareDiaryEntry.interactions`. */
export type ARModelStage = {
  model: CreatureModelSource;
  arScale?: number;
  arHeadingOffsetDeg?: number;
};

export type Creature = {
  id: string;
  label: Translation;
  reward: number;
  cooldown: number;
  type: CreatureType;
  group: CreatureGroup;
  image: any;
  /**
   * Optional 3D poly-model. When set, the creature is rendered in the AR
   * overlay (`MapARScene`) and the legacy 2D marker becomes a transparent
   * tap hitbox. When unset, the existing 2D image marker is used as before.
   * Ignored for AR when `stages` is set (stages define models instead).
   */
  model?: CreatureModelSource;
  /**
   * AR growth stages: model and scale follow `careDiary` interaction count
   * for this `creatureId` (0 → first stage, capped at last stage).
   */
  stages?: ARModelStage[];
  /** Per-creature visual scale in the AR scene (px units). Default ~20. */
  arScale?: number;
  /** Compensation for non-standard "forward" axis in the source GLB. */
  arHeadingOffsetDeg?: number;
  /** Max distance in meters to interact (water/feed); defaults to global resource radius. */
  interactionDistance?: number;
  requiredItem?: InventoryItemId;
  rewardResource?: ResourceReward;
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
  crafted: Partial<Record<CraftedItemId, number>>;
  dailyQuests: DailyQuestsSave | null;
};

export type DailyQuestKind =
  | 'walk_meters'
  | 'water_flowers'
  | 'feed_animals'
  | 'collect_trash'
  | 'collect_feed'
  | 'do_crafts';

export type ActiveDailyQuest = {
  kind: DailyQuestKind;
  target: number;
  progress: number;
  rewardDobri: number;
  rewardXp: number;
  claimed: boolean;
};

export type DailyQuestsSave = {
  /** Local-day key; rotates every calendar day. */
  date: string;
  quests: ActiveDailyQuest[];
};
