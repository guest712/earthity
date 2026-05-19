# Раздача сборки Earthity (EAS)

Проект на Expo: **mare_tranquillitatis/earthity**  
`projectId` в `app.json` → `extra.eas.projectId`

**Статус (май 2026):** preview APK собирается; пилот на Android проверен (карта, auth, cleanup).

---

## Быстрый путь

### 1. Секреты (один раз)

Локальный `.env` в облачную сборку **не попадает**. Задай переменные в [expo.dev](https://expo.dev) → проект **earthity** → **Environment variables** (profile **preview**):

| Переменная | Назначение |
|------------|------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | anon key (RLS обязателен) |
| `GOOGLE_MAPS_API_KEY` | вшивается в APK при сборке (`app.config.js`) |

Имена как в `.env.example`.

### 2. Сборка

```bash
eas build -p android --profile preview
```

- Keystore → **Let Expo manage**.
- ~15–25 мин; ссылка в терминале и expo.dev → Builds.

### 3. Установка тестеру

1. Ссылка/QR на телефоне (Android).
2. Удалить старую версию при смене keystore/подписи.
3. Включить геолокацию для карты и placement.

---

## Google Maps (обязательно для APK)

Симптом: **серый прямоугольник + логотип Google**, кнопки 🗺️ есть, тайлов нет.

1. expo.dev → **Credentials** → Android → скопировать **SHA-1** keystore, которым подписан **этот** APK (**upload** / default build — не `debug.keystore` с ПК).
2. [Google Cloud Console](https://console.cloud.google.com/) → API key → **Android apps**:
   - package: `com.anonymous.earthity`
   - SHA-1 из шага 1  
   Если был первый неудачный билд с **другим** fingerprint — добавьте **оба** SHA-1 или только актуальный upload.
3. **Maps SDK for Android** включён; billing на проекте GCP.
4. Подождать 10–15 мин. **Пересборка APK не нужна**, если ключ уже был в env при сборке — достаточно обновить Google и переустановить тот же APK.

Локальный `expo run:android` использует **другой** SHA-1 (debug) — для EAS это не то.

---

## Supabase cleanup (два игрока)

Если «убрал» чужую метку → **Could not save marker** при **200** в API:

- Применить миграцию **`005_cleanup_spots_select_cleaned_by.sql`** (см. `docs/SUPABASE.md`).
- Проверить политику **`cleanup_spots_mark_cleaned`** (UPDATE, чужая метка, `status → cleaned`).

---

## Release vs dev (3D)

Preview APK **без** Map 3D / волка (`MapARSceneGate`, `__DEV__`). В `expo start` 3D как раньше.  
Подробности: [EAS_RELEASE_3D_ROLLBACK.md](./EAS_RELEASE_3D_ROLLBACK.md).

---

## Профили (`eas.json`)

| Профиль | Назначение |
|---------|------------|
| `preview` | APK для друзей / пилота |
| `development` | Dev client |
| `production` | AAB для Play Store (позже) |

---

## Обновление версии

1. Поднять `version` в `app.json`.
2. `eas build -p android --profile preview`
3. Одна актуальная ссылка тестерам.

---

## Чеклист «готово к пилоту»

- [x] Секреты на EAS (3 переменные, profile preview)
- [x] `preview` сборка успешна
- [x] APK на Android: карта (после upload SHA-1), логин, сейв
- [x] Два аккаунта: метка → уборка чужим → награда (миграция 005)
- [ ] Скриншоты / ссылка в чате расширенного круга тестеров

См. [SUPABASE.md](./SUPABASE.md), [PRODUCT.md](./PRODUCT.md).
