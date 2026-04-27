import type { DailyQuestKind, Translation } from '../../lib/shared/types';

export type DailyQuestTemplate = {
  kind: DailyQuestKind;
  target: number;
  rewardDobri: number;
  rewardXp: number;
  emoji: string;
  label: Translation;
};

export const DAILY_QUEST_TEMPLATES: DailyQuestTemplate[] = [
  {
    kind: 'walk_meters',
    target: 1000,
    rewardDobri: 8,
    rewardXp: 8,
    emoji: '🚶',
    label: {
      ru: 'Пройти 1 км',
      de: '1 km gehen',
      uk: 'Пройти 1 км',
      ar: 'امشِ 1 كم',
      en: 'Walk 1 km',
    },
  },
  {
    kind: 'water_flowers',
    target: 5,
    rewardDobri: 10,
    rewardXp: 10,
    emoji: '💧',
    label: {
      ru: 'Полить 5 растений',
      de: '5 Pflanzen gießen',
      uk: 'Полити 5 рослин',
      ar: 'اسقِ 5 نباتات',
      en: 'Water 5 plants',
    },
  },
  {
    kind: 'feed_animals',
    target: 5,
    rewardDobri: 10,
    rewardXp: 10,
    emoji: '🍃',
    label: {
      ru: 'Накормить 5 животных',
      de: '5 Tiere füttern',
      uk: 'Нагодувати 5 тварин',
      ar: 'أطعم 5 حيوانات',
      en: 'Feed 5 animals',
    },
  },
  {
    kind: 'collect_trash',
    target: 15,
    rewardDobri: 12,
    rewardXp: 12,
    emoji: '♻️',
    label: {
      ru: 'Собрать 15 ед. мусора',
      de: '15 Einh. Müll sammeln',
      uk: 'Зібрати 15 од. сміття',
      ar: 'اجمع 15 وحدة قمامة',
      en: 'Collect 15 trash',
    },
  },
  {
    kind: 'collect_feed',
    target: 10,
    rewardDobri: 8,
    rewardXp: 8,
    emoji: '🥕',
    label: {
      ru: 'Собрать 10 корма',
      de: '10 Futter sammeln',
      uk: 'Зібрати 10 корму',
      ar: 'اجمع 10 طعام',
      en: 'Collect 10 feed',
    },
  },
  {
    kind: 'do_crafts',
    target: 3,
    rewardDobri: 25,
    rewardXp: 25,
    emoji: '🔧',
    label: {
      ru: 'Сделать 3 апсайклинга',
      de: '3-mal upcyceln',
      uk: 'Зробити 3 апсайклінги',
      ar: 'قم بإعادة تدوير 3 مرات',
      en: 'Do 3 upcycles',
    },
  },
];

export const DAILY_QUESTS_PER_DAY = 3;
