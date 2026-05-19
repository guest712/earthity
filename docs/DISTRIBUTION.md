# Раздача сборки Earthity (EAS)

Проект на Expo: **mare_tranquillitatis/earthity**  
`projectId` в `app.json` → `extra.eas.projectId`

---

## Быстрый путь (первая APK)

### 1. Секреты (один раз)

Локальный `.env` в облачную сборку **не попадает**. Задай переменные в [expo.dev](https://expo.dev) → проект **earthity** → **Environment variables** (profile **preview**), либо в терминале:

```bash
cd e:\E_DElVl\earthity
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxx.supabase.co" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..." --type string
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "AIza..." --type string
```

Имена должны совпадать с `.env.example`.

### 2. Сборка

```bash
eas build -p android --profile preview
```

- Первый раз спросит про Android keystore → **Let Expo manage** (рекомендуется).
- Ждать ~15–25 мин; ссылка на APK в терминале и на expo.dev → Builds.

### 3. Установка тестеру

1. Открыть ссылку на телефоне (Android).
2. Скачать APK → установить («неизвестные источники», если спросит).
3. Зарегистрироваться в приложении (тот же Supabase, что в секретах).

### 4. Google Maps после первой сборки

Если карта серая / без тайлов:

1. expo.dev → проект → **Credentials** → Android → SHA-1 fingerprint (EAS keystore).
2. Google Cloud Console → API key → **Android apps** → добавить package `com.anonymous.earthity` + этот SHA-1.
3. Пересобрать: `eas build -p android --profile preview`.

Локальный `debug.keystore` для EAS-сборок **не используется**.

---

## Профили (`eas.json`)

| Профиль | Назначение |
|---------|------------|
| `preview` | APK для друзей / пилота (основной) |
| `development` | Dev client с отладкой |
| `production` | AAB для Play Store (позже) |

---

## Обновление версии

Перед новой раздачей:

1. Поднять `version` в `app.json` (и при необходимости `android.versionCode` через EAS remote version).
2. `eas build -p android --profile preview`
3. Отправить новую ссылку тестерам (старый APK можно оставить, но лучше одна актуальная).

---

## Что не подходит для пилота

| Способ | Почему |
|--------|--------|
| Только Expo Go | Другая среда, не «твоё» приложение |
| `expo start` без tunnel | Только та же Wi‑Fi сеть |
| Web | Карта/гео не как на телефоне |

---

## Чеклист «готово к пилоту»

- [ ] Секреты заданы на EAS (3 переменные)
- [ ] `preview` сборка успешна
- [ ] APK ставится на **чужой** Android (не только твой dev)
- [ ] Карта, логин, метка мусора, сейв работают
- [ ] Ссылка на сборку сохранена в чате тестеров

См. также [SUPABASE.md](./SUPABASE.md), [PRODUCT.md](./PRODUCT.md).
