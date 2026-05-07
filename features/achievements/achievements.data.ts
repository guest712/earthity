import type { EarthitySave, Translation } from '../../lib/shared/types';

export type AchievementCategory = 'first' | 'eco' | 'home' | 'ahimsa' | 'legend';

/** Snapshot of save fields referenced by achievement `condition` callbacks. */
export type AchievementProgressSnapshot = Pick<
  EarthitySave,
  'deeds' | 'xp' | 'outdoorDeeds' | 'homeDeeds' | 'petDeeds' | 'totalDobri' | 'testDeeds'
>;

export type AchievementDefinition = {
  id: string;
  title: Translation;
  desc: Translation;
  emoji: string;
  reward: number;
  category: AchievementCategory;
  givesTitle?: boolean;
  condition: (progress: AchievementProgressSnapshot) => boolean;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_deed',
    title: { ru: 'Искра', de: 'Funke', uk: 'Іскра', ar: 'شرارة', en: 'Spark' },
    desc: {
      ru: 'Первое доброе дело',
      de: 'Erste gute Tat',
      uk: 'Перша добра справа',
      ar: 'أول عمل جيد',
      en: 'First good deed',
    },
    emoji: '✨',
    reward: 10,
    category: 'first',
    condition: (s) => s.deeds >= 1,
  },
  {
    id: 'ten_deeds',
    title: { ru: 'Огонёк', de: 'Flämmchen', uk: 'Вогник', ar: 'شعلة', en: 'Flame' },
    desc: {
      ru: '10 добрых дел',
      de: '10 gute Taten',
      uk: '10 добрих справ',
      ar: '10 أعمال جيدة',
      en: '10 good deeds',
    },
    emoji: '🔥',
    reward: 30,
    category: 'first',
    condition: (s) => s.deeds >= 10,
  },
  {
    id: 'first_level',
    title: { ru: 'Пробуждение', de: 'Erwachen', uk: 'Пробудження', ar: 'صحوة', en: 'Awakening' },
    desc: {
      ru: 'Достичь уровня Эко',
      de: 'Öko-Level erreichen',
      uk: 'Досягти рівня Еко',
      ar: 'الوصول لمستوى إيكو',
      en: 'Reach Eco level',
    },
    emoji: '🌿',
    reward: 50,
    category: 'first',
    condition: (s) => s.xp >= 50,
  },
  {
    id: 'clean_5',
    title: { ru: 'Чистые руки', de: 'Saubere Hände', uk: 'Чисті руки', ar: 'أيدٍ نظيفة', en: 'Clean Hands' },
    desc: {
      ru: '5 уличных квестов',
      de: '5 Outdoor-Quests',
      uk: '5 вуличних квестів',
      ar: '5 مهام خارجية',
      en: '5 outdoor quests',
    },
    emoji: '🧤',
    reward: 25,
    category: 'eco',
    condition: (s) => s.outdoorDeeds >= 5,
  },
  {
    id: 'clean_20',
    title: {
      ru: 'Хранитель улиц',
      de: 'Straßenhüter',
      uk: 'Охоронець вулиць',
      ar: 'حارس الشوارع',
      en: 'Street Guardian',
    },
    desc: {
      ru: '20 уличных квестов',
      de: '20 Outdoor-Quests',
      uk: '20 вуличних квестів',
      ar: '20 مهمة خارجية',
      en: '20 outdoor quests',
    },
    emoji: '🛡',
    reward: 75,
    category: 'eco',
    condition: (s) => s.outdoorDeeds >= 20,
  },
  {
    id: 'clean_50',
    title: {
      ru: 'Легенда района',
      de: 'Stadtteillegende',
      uk: 'Легенда району',
      ar: 'أسطورة الحي',
      en: 'District Legend',
    },
    desc: {
      ru: '50 уличных квестов',
      de: '50 Outdoor-Quests',
      uk: '50 вуличних квестів',
      ar: '50 مهمة خارجية',
      en: '50 outdoor quests',
    },
    emoji: '🏆',
    reward: 200,
    category: 'eco',
    condition: (s) => s.outdoorDeeds >= 50,
  },
  {
    id: 'home_5',
    title: { ru: 'Уют', de: 'Gemütlichkeit', uk: 'Затишок', ar: 'راحة', en: 'Cozy' },
    desc: {
      ru: '5 домашних квестов',
      de: '5 Heimquests',
      uk: '5 домашніх квестів',
      ar: '5 مهام منزلية',
      en: '5 home quests',
    },
    emoji: '🏠',
    reward: 20,
    category: 'home',
    condition: (s) => s.homeDeeds >= 5,
  },
  {
    id: 'home_10',
    title: {
      ru: 'Мастер дома',
      de: 'Heimmeister',
      uk: 'Майстер дому',
      ar: 'سيد المنزل',
      en: 'Home Master',
    },
    desc: {
      ru: '10 домашних квестов',
      de: '10 Heimquests',
      uk: '10 домашніх квестів',
      ar: '10 مهام منزلية',
      en: '10 home quests',
    },
    emoji: '🔑',
    reward: 50,
    category: 'home',
    condition: (s) => s.homeDeeds >= 10,
  },
  {
    id: 'ahimsa_pet',
    title: {
      ru: 'Мир в доме',
      de: 'Frieden zuhause',
      uk: 'Мир у домі',
      ar: 'السلام في المنزل',
      en: 'Home Peace',
    },
    desc: {
      ru: 'Не накричать на питомца 3 раза',
      de: '3x nicht auf Haustier schreien',
      uk: 'Не кричати на улюбленця 3 рази',
      ar: 'عدم الصراخ على الحيوان 3 مرات',
      en: 'Be kind to pet 3 times',
    },
    emoji: '🐾',
    reward: 40,
    category: 'ahimsa',
    condition: (s) => s.petDeeds >= 3,
  },
  {
    id: 'ahimsa_level',
    title: {
      ru: 'Путь ахимсы',
      de: 'Pfad der Ahimsa',
      uk: 'Шлях ахімси',
      ar: 'طريق الأهيمسا',
      en: 'Path of Ahimsa',
    },
    desc: {
      ru: 'Достичь уровня Хранитель',
      de: 'Hüter-Level erreichen',
      uk: 'Досягти рівня Хранитель',
      ar: 'الوصول لمستوى الحارس',
      en: 'Reach Guardian level',
    },
    emoji: '☯',
    reward: 100,
    category: 'ahimsa',
    condition: (s) => s.xp >= 150,
  },
  {
    id: 'legend',
    title: {
      ru: 'Легенда Earthity',
      de: 'Earthity-Legende',
      uk: 'Легенда Earthity',
      ar: 'أسطورة Earthity',
      en: 'Earthity Legend',
    },
    desc: {
      ru: '100 добрых дел',
      de: '100 gute Taten',
      uk: '100 добрих справ',
      ar: '100 عمل جيد',
      en: '100 good deeds',
    },
    emoji: '⭐',
    reward: 500,
    category: 'legend',
    givesTitle: true,
    condition: (s) => s.deeds >= 100,
  },
  {
    id: 'universal',
    title: { ru: 'Универсал', de: 'Allrounder', uk: 'Універсал', ar: 'متعدد المهارات', en: 'All-Rounder' },
    desc: {
      ru: 'Квесты всех категорий',
      de: 'Alle Quest-Kategorien',
      uk: 'Квести всіх категорій',
      ar: 'جميع فئات المهام',
      en: 'All quest categories',
    },
    emoji: '🌍',
    reward: 300,
    category: 'legend',
    givesTitle: true,
    condition: (s) => s.outdoorDeeds >= 1 && s.homeDeeds >= 1,
  },
  {
    id: 'dobri_2500',
    title: { ru: 'Добрый', de: 'Gütig', uk: 'Добрий', ar: 'طيب', en: 'Kind Soul' },
    desc: {
      ru: 'Заработать 2500 добриков',
      de: '2500 Dobriki verdienen',
      uk: 'Заробити 2500 добриків',
      ar: 'كسب 2500 دوبريكي',
      en: 'Earn 2500 dobriki',
    },
    emoji: '💛',
    reward: 100,
    category: 'legend',
    givesTitle: true,
    condition: (s) => s.totalDobri >= 2500,
  },
];
