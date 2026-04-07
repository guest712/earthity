export type LanguageCode = 'ru' | 'de' | 'uk' | 'ar' | 'en';

export interface UnlockedTitle {
  id: string;
  title: string | Record<string, string>;
  emoji: string;
}

export interface EarthitySave {
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

  avatar: string;
  name: string;

  selectedTitle: string;
  selectedTitleEmoji: string;
  selectedTitleName: string | Record<string, string> | '';

  unlockedTitles: UnlockedTitle[];
}