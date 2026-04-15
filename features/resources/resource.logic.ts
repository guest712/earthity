import { Resources, Trash } from './resource.types';
import { MAX_WATER, MAX_FEED } from './resource.constants';

export function addFeed(resources: Resources, amount: number): Resources {
  return {
    ...resources,
    feed: Math.min(resources.feed + amount, MAX_FEED),
  };
}

export function refillWater(resources: Resources): Resources {
  return {
    ...resources,
    water: MAX_WATER,
  };
}

export function consumeWater(resources: Resources, amount = 1): Resources {
  return {
    ...resources,
    water: Math.max(resources.water - amount, 0),
  };
}

export function addTrash(
  resources: Resources,
  type: keyof Trash,
  amount: number
): Resources {
  return {
    ...resources,
    trash: {
      ...resources.trash,
      [type]: resources.trash[type] + amount,
    },
  };
}