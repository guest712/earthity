# Earthity — бэклог и контекст проекта

Справочник для следующих итераций. Пункты сгруппированы по ожидаемой сложности.

**Карта фаз:** `ROADMAP.md`  
**Документация (продукт, питч, бизнес):** `docs/README.md`  
**Идеи без сроков:** `frankintsugi.ini`  
**Фото / антиспам UGC:** `.E_plans_tasks/validation_check.md`

---

## Сейчас в фокусе (фаза 0 → 1)

См. `ROADMAP.md`. Кратко:

- [ ] Закоммитить незакоммиченное: epic reward, placement, миграция `004`
- [x] Документация: `docs/` (PRODUCT, PITCH, BUSINESS, ARCHITECTURE, SUPABASE), обновлён `README.md`
- [x] `.env.example` + `docs/SUPABASE.md` (миграции 001–004)
- [ ] P3: удалить мёртвый REST-auth
- [ ] GLB: политика git (тестовые wolf — ignore или LFS)
- [ ] P2 Supabase + карта A (`customMapStyle`)

---

## Контекст (кратко)

| Область | Состояние |
|--------|-----------|
| Стек | React Native, Expo ~54, Expo Router, TypeScript |
| Данные | Локально: AsyncStorage (`lib/storage`); облако: Supabase `saves` (JSONB) + `cleanup_spots` (карта), sync `lib/supabase/cloudSave.ts` |
| Auth | Supabase email/password, `lib/auth/AuthContext.tsx`, экран `app/(auth)/login.tsx`, gate в `app/_layout.tsx` |
| Главный экран | `app/(app)/(tabs)/index.tsx` + `components/home/`, хуки `lib/home/` |
| Карта / гео | `react-native-maps`, `expo-location`, хук `features/location/useLocationState` |
| 3D / AR | `expo-three`, `@react-three/fiber`, маршрут `three-test`, прелоад `lib/home/preloadHomeModels` |
| i18n | `lib/i18n/`, несколько языков через `LanguageContext` |
| Секреты | `.env` в gitignore: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (anon — публичный, RLS обязателен) |

---

## Карта / cleanup_spots (общие метки мусора) — сделано

- [x] Таблица `cleanup_spots` + RLS (`supabase/migrations/002_cleanup_spots_rls.sql`).
- [x] `expires_at` — TTL 7 дней (`003_cleanup_spots_expires_at.sql`).
- [x] Клиент: `lib/supabase/cleanupSpots.ts`, `lib/home/useCleanupSpotsMap.ts`.
- [x] UI: маркеры на карте, placement (тап в радиусе ~80 м), sheet, лимит 3 active на пользователя.
- [x] «Убрал» чужую метку → `status = cleaned`; награда dobri/xp с множителем.
- [x] Epic/rare/normal: `features/cleanupSpots/cleanupReward.ts` (возраст + дистанция от центра города).
- [x] SQL-функции множителя (`004_cleanup_reward_multiplier.sql`) — дублируют формулу TS; применить в Supabase вручную.
- [x] Проверено: два аккаунта видят одни метки; смена аккаунта не смешивает сейв (P1).

## Карта / cleanup_spots — очередь

- [ ] **Регионы:** `game_regions` или конфиг городов вместо константы Berlin в `cleanupSpot.constants.ts` + SQL.
- [ ] **Фото при уборке:** Storage, камера-only — см. `validation_check.md` (фаза 2 roadmap).
- [ ] **Рейды:** статус `in_raid`, группировка меток, UI «событие уборки».
- [ ] **Серверная награда:** Edge Function при `mark cleaned` (античит множителя), пока награда только на клиенте.

---

## Supabase / Auth / Cloud save — сделано

- [x] SDK `@supabase/supabase-js`, клиент `lib/supabase/client.ts` (AsyncStorage-сессия).
- [x] Вход / регистрация / выход, ошибки на экране login, редирект без сессии.
- [x] Таблица `saves` + RLS (select/insert/update own row).
- [x] Pull при входе (`CloudSaveGate`, `reconcileCloudSave`), push при autosave.
- [x] Защита от затирания облака пустым локальным сейвом; pull при «local empty + cloud has progress».
- [x] Проверено: очистка хранилища → вход → прогресс из облака без онбординга.

---

## Supabase / Auth / Cloud save — очередь (по приоритету)

**P1 — сделать до широкого теста или общего устройства**

- [x] **Logout / смена аккаунта:** при `signOut` — `clearLocalGameSave` + `clearCloudSyncUserBinding`; при reconcile с другим `user_id` — сброс локали до merge. Автосейв home не пишет без `accessToken`.

**P2 — перед релизом / prod**

- [ ] **Confirm email** в Supabase Auth (сейчас удобно выключено для dev).
- [ ] **Отдельные проекты** Supabase: dev и prod, разные ключи в `.env`.
- [ ] **`.env.example`** — только имена переменных (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_MAPS_API_KEY`), без значений.
- [ ] Сверка **RLS** на `saves` после любых миграций (никаких policy «public read/write»).

**P3 — cleanup (не блокирует релиз)**

- [ ] Удалить мёртвый REST-auth: `lib/api/authLogin.ts`, `lib/api/client.ts`, `lib/auth/tokenStorage.ts` (заменены Supabase SDK).
- [ ] Убрать или сократить dev-логи `[cloudSave]` в production-сборке (оставить только `__DEV__` — уже так; при желании единый флаг).

**P4 — когда появятся рейтинги / мультиплеер**

- [ ] **Валидация сейва на сервере** (Edge Function или триггер): лимиты dobri/xp, схема `EarthitySave`, защита от подделки JSON с клиента.
- [ ] **Конфликт двух устройств offline:** осознанная стратегия (last-write-wins сейчас; позже merge или version counter в `saves`).

---

## Просто

- [x] Вынести из `index.tsx` мелкие самостоятельные хуки: кулдаун действий, бонус добриков за уровень, трекинг прогулки для дейликов, дыхание анимации для попапа существа, запрос разрешений на уведомления при монтировании, списки квестов (active / filtered / locked).  
  Файлы: `lib/home/useActionCooldown.ts`, `useLevelUpDobriBonus.ts`, `useDailyWalkTracking.ts`, `useHomeBreathAnimation.ts`, `useRequestNotificationsOnMount.ts`, `useHomeQuestLists.ts`.
- [x] `npm run i18n:check` (tsc) после рефакторинга главного экрана — ок.
- [x] `expo lint` прогнан: **0 errors**, работу не блокирует; список warning зафиксирован ниже в разделе «Предупреждения ESLint».
- [x] Экран выбора языка на Home — компонент `components/home/HomeLanguagePicker.tsx`; полоска ресурсов — `components/home/HomeResourceStrip.tsx`; синхронизация состояния при DEV-сбросе — `lib/home/syncHomeBootstrapFromEarthitySave.ts`.
- [ ] При необходимости — один общий barrel `lib/home/index.ts` (экспорт хуков), **только если** станет удобнее импортам; иначе не обязателен.

## Средне

- [x] Разгрузка `index.tsx`: колбэки начальной загрузки / фокуса и снимок для автосейва вынесены в `lib/home/useHomeScreenPersist.ts` (внутри по-прежнему `useHomeSaveSync`).
- [x] Обработчики квестов и UI деталки квеста (`complete`, выбор карточки, фразы, шаги) — `lib/home/useHomeQuestFlow.ts`.
- [x] Вынести `homeMapLayerProps` и связанный колбэк спавна в хук (`lib/home/useHomeMapLayerProps.ts`); действия попапа существа — `lib/home/useHomeCreatureCareActions.ts`.
- [ ] Если захотеть убрать «запасные» `LANGS.en` / `'en'` в хуках до выбора языка — понадобится либо разнести хуки по вложенным компонентам после гардов, либо отложенная инициализация (сложнее по правилам хуков).
- [ ] Статистика: экран `stats` скрыт из таббара; в профиле своя вкладка «статистика» — привести к одному сценарию навигации или общему компоненту.
- [ ] Плагин `expo-notifications` в `app.json` / конфиге — сверка с документацией SDK при подготовке релизной сборки.
- [ ] **GLB-ассеты** (`assets/models/*.glb`): решение по git (коммит / игнор / Git LFS) — **открытый вопрос**, ждёт решения.
- [ ] Карта: «спокойный» общий вид (стиль карты, полигоны, HUD) и лёгкие деревья поверх карты — **пошаговый план** в конце файла («Карта: спокойный общий вид + деревья»).

## Тяжело

- [ ] Группировка табов / «меню вместо Home» (радиальное меню и т.п.) — дизайн и навигация; затронет `app/(tabs)/_layout.tsx` и UX всех разделов.
- [ ] Разбиение гигантского состояния главного экрана на reducer + контекст (или feature-слайс) без регрессий автосейва.
- [ ] Минимальный набор тестов: `game-engine`, нормализация сейва, хуки спавнов/ресурсов.
- [x] EAS проект привязан (`app.json` → `extra.eas.projectId`, owner).
- [x] `eas.json` + `docs/DISTRIBUTION.md`.
- [ ] Секреты на EAS (Supabase + Maps) + первая успешная `eas build -p android --profile preview`.
- [ ] SHA-1 EAS keystore в Google Cloud (если карта пустая на APK).

## Высший уровень

- [x] ~~Бэкенд / аккаунты / синхронизация прогресса между устройствами.~~ **MVP готов** (Supabase Auth + `saves`); см. очередь P1–P4 выше.
- [ ] Анти-чит и валидация прогресса на сервере (если появится мультиплеер или рейтинги) → **P4** в разделе Supabase.
- [ ] Наблюдаемость: crash reporting, аналитика воронок без нарушения приватности.

---

## Фаза 0 — порядок в репо (см. ROADMAP)

- [ ] Коммит: epic reward + placement + i18n (если ещё не в `main` / `refactor/home-screen`).
- [x] `docs/SUPABASE.md`: какие миграции Run, какие таблицы, `.env`.
- [x] `.env.example` (имена переменных без значений).
- [ ] Скриншоты в `README.md` (5 кадров с телефона для питча)
- [ ] Удалить `lib/api/authLogin.ts`, `lib/api/client.ts`, `lib/auth/tokenStorage.ts` (дублирует Supabase).
- [ ] GLB: `assets/models/test_wolf*.glb` — в `.gitignore` или Git LFS + один production-ассет в репо.

## Игровые петли (фаза 3 roadmap — одна за раз)

| # | Петля | Файлы / заметки |
|---|--------|------------------|
| 1 | Стадии существ | `lib/shared/types.ts` `stages`, `creature.constants`, `MapARScene` |
| 2 | Daily / weekly | `features/dailyQuests/` |
| 3 | Крафт / апсайклинг | `features/crafting/`, `craft.tsx` |
| 4 | POI карты (не cleanup) | отдельная таблица или статические зоны |
| 5 | Пуши | `expo-notifications`, `lib/notifications.ts` |

Идеи: `frankintsugi.ini` — не дублировать сюда простынёй.

## Заметки

- Рефакторинг главного экрана идёт **инкрементально**: сначала утилитарные хуки с минимальными зависимостями, затем связка с сохранением и UI-оркестрация.
- Предупреждения lint **не мешают** продолжать разработку; большинство завязано на **3D / react-three-fiber** и разумно чистить при следующем заходе в AR-сцену (или точечно отключать правило для `*.tsx` с R3F).
- Центр epic для множителя: **52.52, 13.405** (Berlin default) — см. `CITY_CENTER_*` в `features/cleanupSpots/cleanupSpot.constants.ts`.

---

## Предупреждения ESLint (`npm run lint` / `expo lint`)

Снимок на момент последнего прогона: **38 warnings, 0 errors**. Exit code 0.

### Быстро правится (не 3D)

| Файл | Правило | Суть |
|------|---------|------|
| `app/(tabs)/_layout.tsx` | `@typescript-eslint/no-unused-vars` | Неиспользуемые импорты: `useKeepAwake`, `Stack`. |
| `components/home/HomeScreenDevTools.tsx` | `@typescript-eslint/no-unused-vars` | Неиспользуемый импорт `BIO_PICKUP_AMOUNT`. |

### 3D / AR — вернуться при доработке сцены

| Файл | Правило | Суть |
|------|---------|------|
| `components/map/MapARScene.tsx` | `import/first` | Импорты в середине модуля (стр. ~46–47) — перенести наверх. |
| `components/map/MapARScene.tsx` | `@typescript-eslint/no-unused-vars` | `DEBUG_PLAYER_AR_MODEL` объявлен, не используется. |
| `components/map/MapARScene.tsx` | `react/no-unknown-property` | Пропсы вроде `position`, `args`, `transparent`, `depthWrite`, `side`, `visible`, `intensity` на JSX от R3F — ESLint не знает три-примитивы. |
| `components/map/PlayerModelPreviewPanel.tsx` | `@typescript-eslint/no-require-imports`, `react/no-unknown-property` | `require()` для ассета; `rotation`, `intensity`, `position`. |
| `components/three/CubePlaceholder.tsx` | `react/no-unknown-property` | `args` у примитива. |
| `components/three/Model.tsx` | `react-hooks/exhaustive-deps` | Три `useEffect`: зависимости `idleClip` / `walkClip`; сложное выражение в массиве зависимостей. |
| `components/three/Model.tsx` | `react/no-unknown-property` | `object`. |
| `components/three/Scene3D.tsx` | `@typescript-eslint/no-require-imports`, `react/no-unknown-property` | Как у превью-панели. |

Часть предупреждений по R3F обычно закрывают **локальным eslint-disable** на файл/блок или **расширением конфига** под `@react-three/fiber`, когда займётесь сценой снова.

---

## Карта: спокойный общий вид + деревья «для атмосферы» (пошагово)

Цель следующих сессий: меньше визуального шума у базового слоя карты и лёгкие акценты окружения. Точки входа в код: `components/map/WorldMap.tsx` (`MapView`), `components/home/HomeScreenMapSection.tsx`, `components/map/MapARScene.tsx` (прозрачный R3F поверх карты).

### A — «Спокойный» общий вид

1. **Зафиксировать целевое состояние**  
   Выписать для себя приоритет: что главное читается всегда (игрок / активный объект), что вторично (остальные спавны, POI карты).

2. **Стилизовать тайловую карту (Google Maps)**  
   В `WorldMap` / `MapView` добавить свойство **`customMapStyle`** (JSON стилей Google Maps: приглушить POI, подписи, при желании дороги).

3. **Согласовать стиль с режимами**  
   Отдельно или общим пресетом: `standard` и `satellite` — решить, нужен ли мягкий оверлей (полупрозрачность не делают на самой карте, но можно тонировать через стиль там, где применимо).

4. **Полигоны «зелёных зон» (опционально, без 3D)**  
   Статический **GeoJSON** небольшой области или ручные `Polygon` в `HomeMapLayer` / рядом с маркерами: полупрозрачная зелёная заливка. Проверка FPS и отзыв карты при пан/zoom.

5. **Иерархия HUD поверх карты**  
   Проверить отступы: полоска ресурсов на карте, кнопки режима карты, нативный компас/кнопка локации — не пересекаются ли; при необходимости единый `top`/`right` резерв или лёгкий общий контейнер.

6. **Полировка только после прогона на Android**  
   Снимок экрана до/после, один релиз критичных регрессий (жесты карты, тап по маркеру).

### B — Деревья «для атмосферы» (лёгкие)

1. **Ограничить объём**  
   Константы: макс. число деревьев, радиус от пользователя или от центра экрана, пересборка только при изменении региона (не каждый кадр без нужды).

2. **Выбрать визуал**  
   Вариант **минимум:** примитивы three.js (конус + цилиндр) + один `MeshBasicMaterial`, без текстур.

3. **Вариант лучше качество/цене:** один маленький **GLB** «ёлка» + **инстансинг** (`@react-three/drei` Instanced или merged mesh), общий материал.

4. **Интеграция с `MapARScene`**  
   Либо отдельный тип объектов в списке `ARObject`/параллельный узел тем же пайплайном `pointForCoordinate`, либо дочерняя группа с тем же ortho и якорем по координатам точек генерации деревьев.

5. **Генерация точек деревьев**  
   Простое правило рядом с «зелёной зоной» или решёткой в bbox текущего `region`; избегать координат под UI-оверлеями (можно фильтром по уже известному `pixel` из `pointForCoordinate`).

6. **Отключатель и профилирование**  
   Переключатель в DEV или константа `ENABLE_MAP_DECOR_TREES`; замер FPS и нагрузка при `frameloop` Canvas.

После блока **A** уже заметнее «общий покой», блок **B** — отдельной итерацией, когда A стабильно.
