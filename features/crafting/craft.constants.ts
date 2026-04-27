import type { CraftRecipe } from './craft.types';

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'compost_brick',
    emoji: '🟫',
    label: {
      ru: 'Компост-брикет',
      de: 'Kompost-Brikett',
      uk: 'Компост-брикет',
      ar: 'قالب سماد',
      en: 'Compost brick',
    },
    description: {
      ru: 'Удобрение для редких цветов.',
      de: 'Dünger für seltene Blumen.',
      uk: 'Добриво для рідкісних квітів.',
      ar: 'سماد للزهور النادرة.',
      en: 'Fertilizer for rare flowers.',
    },
    cost: [{ type: 'bio', amount: 6 }],
  },
  {
    id: 'eco_seed',
    emoji: '🌰',
    label: {
      ru: 'Эко-семя',
      de: 'Öko-Saatgut',
      uk: 'Еко-насіння',
      ar: 'بذرة بيئية',
      en: 'Eco-seed',
    },
    description: {
      ru: 'Семя для редкого растения.',
      de: 'Samen für eine seltene Pflanze.',
      uk: 'Насіння для рідкісної рослини.',
      ar: 'بذرة لنبتة نادرة.',
      en: 'Seed for a rare plant.',
    },
    cost: [
      { type: 'paper', amount: 3 },
      { type: 'bio', amount: 4 },
    ],
  },
  {
    id: 'flowerpot',
    emoji: '🪴',
    label: {
      ru: 'Горшок',
      de: 'Blumentopf',
      uk: 'Горщик',
      ar: 'إناء زهور',
      en: 'Flowerpot',
    },
    description: {
      ru: 'Из переплавленного пластика.',
      de: 'Aus eingeschmolzenem Plastik.',
      uk: 'З переплавленого пластику.',
      ar: 'من البلاستيك المعاد تدويره.',
      en: 'From melted plastic.',
    },
    cost: [
      { type: 'plastic', amount: 5 },
      { type: 'bio', amount: 2 },
    ],
  },
  {
    id: 'paper_lantern',
    emoji: '🏮',
    label: {
      ru: 'Бумажный фонарик',
      de: 'Papierlaterne',
      uk: 'Паперовий ліхтарик',
      ar: 'فانوس ورقي',
      en: 'Paper lantern',
    },
    description: {
      ru: 'Декор для дома.',
      de: 'Dekoration fürs Zuhause.',
      uk: 'Декор для дому.',
      ar: 'زينة للمنزل.',
      en: 'Home decoration.',
    },
    cost: [
      { type: 'paper', amount: 8 },
      { type: 'glass', amount: 2 },
    ],
  },
  {
    id: 'mosaic_tile',
    emoji: '🔷',
    label: {
      ru: 'Мозаичная плитка',
      de: 'Mosaikfliese',
      uk: 'Мозаїчна плитка',
      ar: 'بلاطة فسيفسائية',
      en: 'Mosaic tile',
    },
    description: {
      ru: 'Задел под кинцуги-крафт.',
      de: 'Vorbereitung für Kintsugi.',
      uk: 'Задаток для кінцуґі.',
      ar: 'تمهيد لحرفة الكينتسوغي.',
      en: 'Foundation for kintsugi craft.',
    },
    cost: [{ type: 'glass', amount: 4 }],
  },
];
