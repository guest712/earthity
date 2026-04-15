import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EarthitySave } from '../shared/types';

const STORAGE_KEY = 'earthity_save';

export const defaultSave: EarthitySave = {
  dobri: 0,
  totalDobri: 0,
  xp: 0,
  deeds: 0,
  completed: [],
  lang: 'en',
  onboarded: false,
  outdoorDeeds: 0,
  homeDeeds: 0,
  petDeeds: 0,
  streak: 0,
  lastOpenDate: '',
  testDeeds: 0,

  waterLevel: 10,
  feedCount: 0,
  plastic: 0,
  glass: 0,
  paper: 0,
  resources: {
    water: 10,
    feed: 0,
    trash: {
      plastic: 0,
      glass: 0,
      paper: 0,
    },
  },

  avatar: 'lumi',
  name: 'Earthling',

  selectedTitle: '',
  selectedTitleEmoji: '',
  selectedTitleName: '',

  unlockedTitles: [],
  careDiary: [],
};

export async function loadSave(): Promise<EarthitySave> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave;
    

    const parsed = JSON.parse(raw);

    const merged = {
      ...defaultSave,
      ...parsed,
    };
    const resourcesBlock = parsed?.resources ?? {
      water: merged.resources.water,
      feed: merged.feedCount,
      trash: {
        plastic: merged.plastic,
        glass: merged.glass,
        paper: merged.paper,
      },
    };

    const totalDobri = Math.max(merged.totalDobri ?? 0, merged.dobri ?? 0);

    return {
      ...merged,
      totalDobri,
      resources: resourcesBlock,
    };
  } catch (error) {
    console.warn('Failed to load save:', error);
    return defaultSave;
  }
}

export async function saveSave(save: EarthitySave): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch (error) {
    console.warn('Failed to save data:', error);
  }
}

export async function updateSave(patch: Partial<EarthitySave>): Promise<EarthitySave> {
  const current = await loadSave();
  const next = { ...current, ...patch };
  await saveSave(next);
  return next;
}