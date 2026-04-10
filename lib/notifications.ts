import * as Notifications from 'expo-notifications';
import type { Creature } from './types';

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

export async function scheduleCreatureNotification(creature: Creature) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌍 Earthity',
        body:
          creature.type === 'flower'
            ? `🌸 ${creature.label['ru']} хочет пить! Полей его.`
            : `🐾 ${creature.label['ru']} голоден! Покорми его.`,
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