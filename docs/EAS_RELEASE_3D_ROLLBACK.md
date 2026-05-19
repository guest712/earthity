# EAS release bundle — лог изменений и откат

**Дата:** 2026-05-19  
**Ветка:** `refactor/home-screen`  
**Цель:** `npx expo export --platform android` и `eas build -p android --profile preview` без падения Hermes.

---

## Симптомы (до правок)

1. **Hermes / three:** `DOMParser`, тяжёлый three/drei в release-бандле → `hermesc` code 2.
2. **Metro `@/`:** `Unable to resolve module @/components/...` при export (1070 modules).
3. **Supabase ≥2.106:** `import("@opentelemetry/api")` в бандле → Hermes `Invalid expression encountered` (даже с `tracePropagation.enabled: false` — код не tree-shake’ится).
4. **Reanimated 4.1.6:** в логах иногда `ref.}` (патч/postinstall; зафиксирован **4.1.2**).

---

## Что изменено

| Файл | Изменение |
|------|-----------|
| `tsconfig.json` | `compilerOptions.baseUrl: "."` |
| `metro.config.js` | Явный `resolveRequest` для `@/` (цепочка с default) |
| `lib/supabase/client.ts` | `tracePropagation: { enabled: false }` (на будущее); **pin** `@supabase/supabase-js@2.105.4` |
| `package.json` | `react-native-reanimated@4.1.2`, `@supabase/supabase-js@2.105.4`, postinstall-патч reanimated |
| `scripts/patch-reanimated-hermes.js` | **Новый** — правка typo в fabricUtils (страховка) |
| `lib/flags/releaseBundle3d.ts` | **Новый** — флаг `INCLUDE_MAP_3D_IN_RELEASE_BUNDLE = __DEV__` |
| `components/map/mapAR.types.ts` | **Новый** — `ARObject` без three |
| `components/map/mapARSceneProps.ts` | **Новый** |
| `components/map/MapARSceneGate.tsx` | **Новый** — `require('./MapARScene')` только в `__DEV__` |
| `components/map/MapARScene.empty.tsx` | **Новый** — заглушка (запасная, gate возвращает `null`) |
| `components/map/MapARScene.tsx` | Типы вынесены |
| `components/home/HomeScreenMapSection.tsx` | `MapARSceneGate` |
| `app/(app)/(tabs)/index.tsx` | `mapAR.types`, wolf GLB только в `__DEV__` |
| `lib/home/preloadHomeModels.ts` | preload только в `__DEV__` |
| `app/(app)/(tabs)/three-test.tsx` | release → `Redirect` `/` |
| `app.json` | `reactCompiler: false`, `extra.eas.projectId` |
| `eas.json` | **Новый** — profile `preview` → APK |

**Не удаляли:** `MapARScene.tsx`, GLB, `Scene3D.tsx`.

---

## Поведение

| Режим | Map 3D / wolf | three-test | Supabase |
|-------|---------------|--------------|----------|
| `expo start` (`__DEV__`) | Как раньше | Работает | Полный клиент |
| export / EAS preview | Нет three в бандле (~5.4 MB JS) | Редирект home | 2.105.4, без OTel import |

---

## Проверка

```bash
npm ci
npx expo export --platform android --clear
# ожидание: Exported: dist, без hermesc errors

eas build -p android --profile preview
```

Release-бандл **не** должен содержать: `opentelemetry`, `DOMParser`, `@react-three`.

---

## Откат по шагам

### A. Полный откат EAS-фикса (git)

```bash
git log --oneline -10
git revert <commit>   # или restore файлов из таблицы выше
npm ci
```

### B. Только 3D в release (оставить metro/supabase/reanimated)

1. Удалить: `MapARSceneGate.tsx`, `mapAR.types.ts`, `mapARSceneProps.ts`, `MapARScene.empty.tsx`, `lib/flags/releaseBundle3d.ts`.
2. `HomeScreenMapSection` → снова `MapARScene`.
3. `index.tsx` — типы/preload/wolf как было.
4. `preloadHomeModels.ts`, `three-test.tsx` — без `__DEV__` gate.
5. Локально добиться зелёного `expo export` с three (узкие импорты drei, Metro blockList loaders).

### C. Отдельные фиксы

| Что откатить | Как |
|--------------|-----|
| `@/` в metro | Убрать `resolveRequest` блок в `metro.config.js` (оставить `baseUrl` в tsconfig) |
| Supabase OTel | Вернуть `@supabase/supabase-js@2.106.0` только после фикса upstream / shim без `import()` |
| Reanimated | `expo install react-native-reanimated` (версия из SDK) |
| reactCompiler | `app.json` → `"reactCompiler": true` |

---

## Заметки

- `package-lock.json` должен быть в репо; после правок — `npm ci` на CI/EAS.
- Env для preview: `EXPO_PUBLIC_SUPABASE_*`, `GOOGLE_MAPS_API_KEY` (Expo dashboard).
- При апгрейде supabase >2.105.4 — снова проверить `expo export` с Hermes.
