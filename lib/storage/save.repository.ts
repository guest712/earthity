import type { EarthitySave } from '../shared/types';
import type { Resources } from '../../features/resources/resource.types';
import { defaultSave, loadSave, updateSave } from './storage';

export async function getSave(): Promise<EarthitySave> {
  return loadSave();
}

export async function patchSave(patch: Partial<EarthitySave>): Promise<EarthitySave> {
  return updateSave(patch);
}

export async function getResources(): Promise<Resources> {
  const save = await loadSave();
  return save.resources;
}

export async function resetSaveToDefaults(): Promise<EarthitySave> {
  return updateSave(() => defaultSave);
}
