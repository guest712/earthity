import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DropId, EarthitySave } from '../shared/types';

const VALID_DROP_IDS: DropId[] = ['feather', 'wool', 'pollen', 'scale', 'petal', 'seed'];
const VALID_DROP_SET = new Set<string>(VALID_DROP_IDS);

const STORAGE_KEY = 'earthity_save';
const STORAGE_BACKUP_KEY = 'earthity_save_backup';
const SAVE_VERSION = 1;

type SaveUpdater =
  | Partial<EarthitySave>
  | ((current: EarthitySave) => Partial<EarthitySave> | EarthitySave);

let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(task, task);
  writeQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function toNonNegativeNumber(value: unknown, fallback: number, max?: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const clamped = Math.max(0, numeric);
  return typeof max === 'number' ? Math.min(max, clamped) : clamped;
}

function normalizeSave(input: unknown): EarthitySave {
  const source = input && typeof input === 'object' ? (input as Partial<EarthitySave>) : {};
  const merged = { ...defaultSave, ...source };

  const legacyWater = (source as any)?.waterLevel;
  const legacyFeed = (source as any)?.feedCount;
  const legacyTrash = {
    plastic: (source as any)?.plastic,
    glass: (source as any)?.glass,
    paper: (source as any)?.paper,
    bio: (source as any)?.bio,
  };
  const sourceResources = (source as any)?.resources;

  const water = toNonNegativeNumber(
    sourceResources?.water ?? legacyWater ?? defaultSave.resources.water,
    defaultSave.resources.water
  );
  const feed = toNonNegativeNumber(
    sourceResources?.feed ?? legacyFeed ?? defaultSave.resources.feed,
    defaultSave.resources.feed
  );
  const trashPlastic = toNonNegativeNumber(
    sourceResources?.trash?.plastic ?? legacyTrash.plastic ?? defaultSave.resources.trash.plastic,
    defaultSave.resources.trash.plastic
  );
  const trashGlass = toNonNegativeNumber(
    sourceResources?.trash?.glass ?? legacyTrash.glass ?? defaultSave.resources.trash.glass,
    defaultSave.resources.trash.glass
  );
  const trashPaper = toNonNegativeNumber(
    sourceResources?.trash?.paper ?? legacyTrash.paper ?? defaultSave.resources.trash.paper,
    defaultSave.resources.trash.paper
  );
  const trashBio = toNonNegativeNumber(
    sourceResources?.trash?.bio ?? legacyTrash.bio ?? defaultSave.resources.trash.bio,
    defaultSave.resources.trash.bio
  );

  const completed = Array.isArray(source.completed)
    ? source.completed.filter((item): item is number => Number.isFinite(item as number))
    : defaultSave.completed;

  const unlockedTitles = Array.isArray(source.unlockedTitles)
    ? source.unlockedTitles.filter(
        (item): item is EarthitySave['unlockedTitles'][number] =>
          Boolean(item && typeof item === 'object' && 'id' in item && 'emoji' in item && 'title' in item)
      )
    : defaultSave.unlockedTitles;

  const careDiary = Array.isArray(source.careDiary)
    ? source.careDiary.filter(
        (entry): entry is EarthitySave['careDiary'][number] =>
          Boolean(
            entry &&
              typeof entry === 'object' &&
              typeof entry.creatureId === 'string' &&
              Number.isFinite(entry.firstSeenAt) &&
              Number.isFinite(entry.lastSeenAt) &&
              Number.isFinite(entry.interactions)
          )
      )
    : defaultSave.careDiary;

  const drops: EarthitySave['drops'] =
    source.drops && typeof source.drops === 'object'
      ? Object.fromEntries(
          Object.entries(source.drops)
            .filter(([k]) => VALID_DROP_SET.has(k))
            .map(([k, v]) => [k, toNonNegativeNumber(v, 0)])
        )
      : {};

  const totalDobri = Math.max(
    toNonNegativeNumber(source.totalDobri, defaultSave.totalDobri),
    toNonNegativeNumber(source.dobri, defaultSave.dobri)
  );

  return {
    saveVersion: SAVE_VERSION,
    dobri: toNonNegativeNumber(source.dobri, defaultSave.dobri),
    totalDobri,
    xp: toNonNegativeNumber(source.xp, defaultSave.xp),
    deeds: toNonNegativeNumber(source.deeds, defaultSave.deeds),
    completed,
    lang: merged.lang ?? defaultSave.lang,
    onboarded: Boolean(merged.onboarded),
    outdoorDeeds: toNonNegativeNumber(source.outdoorDeeds, defaultSave.outdoorDeeds),
    homeDeeds: toNonNegativeNumber(source.homeDeeds, defaultSave.homeDeeds),
    petDeeds: toNonNegativeNumber(source.petDeeds, defaultSave.petDeeds),
    streak: toNonNegativeNumber(source.streak, defaultSave.streak),
    lastOpenDate: typeof merged.lastOpenDate === 'string' ? merged.lastOpenDate : defaultSave.lastOpenDate,
    testDeeds: toNonNegativeNumber(source.testDeeds, defaultSave.testDeeds),
    resources: {
      water,
      feed,
      trash: {
        plastic: trashPlastic,
        glass: trashGlass,
        paper: trashPaper,
        bio: trashBio,
      },
    },
    avatar: typeof merged.avatar === 'string' ? merged.avatar : defaultSave.avatar,
    name: typeof merged.name === 'string' ? merged.name : defaultSave.name,
    selectedTitle: typeof merged.selectedTitle === 'string' ? merged.selectedTitle : defaultSave.selectedTitle,
    selectedTitleEmoji:
      typeof merged.selectedTitleEmoji === 'string' ? merged.selectedTitleEmoji : defaultSave.selectedTitleEmoji,
    selectedTitleName:
      typeof merged.selectedTitleName === 'string' ||
      (typeof merged.selectedTitleName === 'object' && merged.selectedTitleName !== null)
        ? merged.selectedTitleName
        : defaultSave.selectedTitleName,
    unlockedTitles,
    careDiary,
    drops,
  };
}

async function readSaveSnapshot(): Promise<EarthitySave> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const backupRaw = await AsyncStorage.getItem(STORAGE_BACKUP_KEY);

  if (!raw && !backupRaw) return defaultSave;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return normalizeSave(parsed);
    } catch (error) {
      console.warn('Primary save is corrupted, trying backup:', error);
    }
  }

  if (backupRaw) {
    try {
      const parsedBackup = JSON.parse(backupRaw);
      const restored = normalizeSave(parsedBackup);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
      return restored;
    } catch (error) {
      console.warn('Backup save is corrupted:', error);
    }
  }

  return defaultSave;
}

export const defaultSave: EarthitySave = {
  saveVersion: SAVE_VERSION,
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
  resources: {
    water: 10,
    feed: 0,
    trash: {
      plastic: 0,
      glass: 0,
      paper: 0,
      bio: 0,
    },
  },

  avatar: 'lumi',
  name: 'Earthling',

  selectedTitle: '',
  selectedTitleEmoji: '',
  selectedTitleName: '',

  unlockedTitles: [],
  careDiary: [],
  drops: {},
};

export async function loadSave(): Promise<EarthitySave> {
  try {
    return await readSaveSnapshot();
  } catch (error) {
    console.warn('Failed to load save:', error);
    return defaultSave;
  }
}

export async function saveSave(save: EarthitySave): Promise<void> {
  await enqueueWrite(async () => {
    try {
      const normalized = normalizeSave(save);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      await AsyncStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.warn('Failed to save data:', error);
    }
  });
}

export async function updateSave(updater: SaveUpdater): Promise<EarthitySave> {
  return enqueueWrite(async () => {
    const current = await readSaveSnapshot();
    const patch = typeof updater === 'function' ? updater(current) : updater;
    const next = normalizeSave({ ...current, ...patch });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    await AsyncStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(next));
    return next;
  });
}