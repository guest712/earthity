import * as Notifications from 'expo-notifications';
import type { Creature, LanguageCode } from './types';
import { LANGS } from './i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  try {
    await Notifications.requestPermissionsAsync();
  } catch (error) {
    console.warn('Notification permission error', error);
  }
}

function formatTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

export async function scheduleCreatureNotification(
  creature: Creature,
  lang: LanguageCode = 'en'
) {
  try {
    const t = LANGS[lang] || LANGS.en;
    const creatureName = creature.label[lang] || creature.label.en;

    const body =
      creature.type === 'flower'
        ? formatTemplate(t.notificationFlowerNeedsWater, { name: creatureName })
        : formatTemplate(t.notificationAnimalHungry, { name: creatureName });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: t.notificationTitle,
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: creature.cooldown / 1000,
      },
    });
  } catch (error) {
    console.warn('Schedule creature notification error', error);
  }
}