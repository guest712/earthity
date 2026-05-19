# EAS release bundle — лог изменений и откат

**Дата:** 2026-05-19  
**Ветка:** `refactor/home-screen` (коммит `2618556` и далее)  
**Цель:** `npx expo export --platform android` и `eas build -p android --profile preview` без падения Hermes.

**Статус пилота (май 2026):** preview APK собирается и ставится; карта (после SHA-1 upload keystore в Google Cloud); логин/сейв; cleanup двумя аккаунтами после миграции **005** RLS.

---

## Симптомы (до правок)

1. **Hermes / three:** `DOMParser`, тяжёлый three/drei в release-бандле → `hermesc` code 2.
2. **Metro `@/`:** `Unable to resolve module @/components/...` при export (1070 modules).
3. **Supabase ≥2.106:** `import("@opentelemetry/api")` в бандле → Hermes `Invalid expression encountered`.
4. **Reanimated 4.1.6:** typo в fabricUtils; зафиксирован **4.1.2** + postinstall-патч.

---

## Что изменено (код)

| Файл | Изменение |
|------|-----------|
| `tsconfig.json` | `compilerOptions.baseUrl: "."` |
| `metro.config.js` | Явный `resolveRequest` для `@/` |
| `lib/supabase/client.ts` | `tracePropagation: { enabled: false }`; pin `@supabase/supabase-js@2.105.4` |
| `package.json` | `react-native-reanimated@4.1.2`, `@supabase/supabase-js@2.105.4` |
| `scripts/patch-reanimated-hermes.js` | postinstall-патч reanimated |
| `MapARSceneGate`, `mapAR.types`, … | 3D только в `__DEV__` |
| `app.json` | `reactCompiler: false`, `extra.eas.projectId` |
| `eas.json` | profile `preview` → APK |

**Не удаляли:** `MapARScene.tsx`, GLB, `Scene3D.tsx`.

---

## Поведение

| Режим | Map 3D / wolf | three-test | Supabase |
|-------|---------------|--------------|----------|
| `expo start` (`__DEV__`) | Как раньше | Работает | Полный клиент |
| export / EAS preview | Нет three в бандле (~5.4 MB JS) | Редирект home | 2.105.4 |

---

## Инфра (не в git-коде)

| Проблема | Решение |
|----------|---------|
| Серая карта + Google logo | SHA-1 **upload keystore** (EAS Credentials) в Google Cloud → package `com.anonymous.earthity` |
| 403 / «Could not save marker» при уборке чужой метки | Политики `mark_cleaned` + миграция **005** (`cleaned_by` в SELECT) — см. `docs/SUPABASE.md` |

---

## Проверка

```bash
npm ci
npx expo export --platform android --clear
eas build -p android --profile preview
```

Release-бандл **не** должен содержать: `opentelemetry`, `DOMParser`, `@react-three`.

---

## Откат

См. прежние секции A/B/C в истории коммита; при откате EAS не забыть env на expo.dev.

---

## Заметки

- `package-lock.json` в репо обязателен для EAS.
- Env preview: `EXPO_PUBLIC_SUPABASE_*`, `GOOGLE_MAPS_API_KEY`.
- При апгрейде `@supabase/supabase-js` > 2.105.4 — снова `expo export` с Hermes.
