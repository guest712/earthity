/**
 * Dynamic Expo config. Google Maps key:
 * - Put GOOGLE_MAPS_API_KEY in `.env` in the project root (not committed).
 * - We load `.env` here explicitly so `expo prebuild` / `expo run:android` always see it on Windows too.
 *
 * Debug signing: `android/app/build.gradle` uses `android/app/debug.keystore` (not ~/.android/debug.keystore).
 * In Google Cloud → API key → Android restrictions, add SHA-1 from THAT file:
 *   keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
 */
const fs = require('fs');
const path = require('path');

function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadDotEnv();

module.exports = ({ config }) => {
  const apiKey = (process.env.GOOGLE_MAPS_API_KEY ?? '').trim();

  if (!apiKey) {
    console.warn(
      '\n[app.config.js] GOOGLE_MAPS_API_KEY is empty. Check `.env` in project root and rebuild native app (prebuild + run:android).\n'
    );
  }

  const basePlugins = config.plugins ?? [];
  const sensorsPlugin = [
    'expo-sensors',
    {
      motionPermission:
        'Earthity uses motion to count your steps for daily walk quests when GPS is not used.',
    },
  ];
  const hasSensors = basePlugins.some(
    (p) => Array.isArray(p) && p[0] === 'expo-sensors'
  );

  return {
    ...config,
    plugins: hasSensors ? basePlugins : [...basePlugins, sensorsPlugin],
    android: {
      ...config.android,
      permissions: [
        ...(config.android?.permissions ?? []),
        'android.permission.ACTIVITY_RECOGNITION',
      ],
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey,
        },
      },
    },
    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        googleMapsApiKey: apiKey,
      },
    },
  };
};
