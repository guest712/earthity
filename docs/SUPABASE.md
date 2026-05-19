# Supabase — Earthity

Настройка бэкенда для разработки и prod. Клиент: `lib/supabase/client.ts`.

---

## Переменные окружения

Скопировать `.env.example` → `.env` в корне проекта:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
GOOGLE_MAPS_API_KEY=...
```

- **Anon key** публичный в приложении — безопасность только через **RLS**.
- Для prod рекомендуется **отдельный проект** Supabase (см. бэклог P2).

---

## Миграции (порядок Run)

Выполнять в **SQL Editor** Supabase Dashboard по порядку (или `supabase db push` при linked CLI):

| # | Файл | Назначение |
|---|------|------------|
| 001 | `supabase/migrations/001_saves_rls.sql` | Таблица `saves`, RLS own row |
| 002 | `supabase/migrations/002_cleanup_spots_rls.sql` | Таблица `cleanup_spots`, политики read/create/update |
| 003 | `supabase/migrations/003_cleanup_spots_expires_at.sql` | Колонка `expires_at`, TTL |
| 004 | `supabase/migrations/004_cleanup_reward_multiplier.sql` | SQL-функции множителя (дубль TS) |
| 005 | `supabase/migrations/005_cleanup_spots_select_cleaned_by.sql` | SELECT для игрока, отметившего `cleaned` (фикс ложной ошибки клиента) |

После каждой миграции: проверить **Table Editor** и **Authentication → Policies**.

---

## Таблицы

### `public.saves`

| Колонка | Тип | Описание |
|---------|-----|----------|
| `user_id` | uuid PK | = `auth.users.id` |
| `data` | jsonb | `EarthitySave` с клиента |
| `save_version` | int | Версия схемы |
| `updated_at` | timestamptz | Авто touch |

**RLS:** authenticated — select/insert/update только `auth.uid() = user_id`.

**Клиент:** `lib/supabase/cloudSave.ts` — `reconcileCloudSave`, push на autosave.

### `public.cleanup_spots`

Shared метки на карте.

| Колонка | Описание |
|---------|----------|
| `id` | uuid |
| `latitude`, `longitude` | координаты |
| `status` | `open` \| `in_raid` \| `cleaned` |
| `user_id` | uuid автора метки |
| `cleaned_by` | uuid того, кто отметил уборку |
| `created_at` | timestamptz |
| `expires_at` | timestamptz (7 дней по умолчанию) |

**Клиент:** `lib/supabase/cleanupSpots.ts`, `lib/home/useCleanupSpotsMap.ts`.

**Лимиты на клиенте:** макс. 3 active на user; placement ≤ 80 m от GPS.

---

## Auth

- Email + password (confirm email может быть выключен в dev).
- Сессия в AsyncStorage через Supabase client.
- `signOut`: очистка локального сейва — `lib/auth/AuthContext.tsx`.

---

## Типичные ошибки

| Ошибка | Решение |
|--------|---------|
| `column cleanup_spots.expires_at does not exist` | Run migration **003** |
| Пустая карта меток | RLS 002; статус `open`; не истёк `expires_at` |
| **403** на PATCH `cleanup_spots` | Политика **`cleanup_spots_mark_cleaned`**: `user_id <> auth.uid()`, `status = open` |
| **Could not save marker** при **200** API | Run **005**; UPDATE прошёл, SELECT на строку — нет |
| Убрать может только автор | Для своей метки — **Delete**; для чужой — **Mark cleaned** (не наоборот) |
| Сейв не тянется | Run 001; пользователь logged in; проверить `saves` row |
| Чужой сейв после смены аккаунта | signOut/signIn (P1) |

---

## Dev checklist

- [ ] Миграции 001–**005** применены
- [ ] RLS включён на обеих таблицах
- [ ] `.env` с URL и anon key
- [ ] Два тестовых аккаунта: метка видна обоим
- [ ] Confirm email: решение для prod (бэклог P2)

---

## Дальше (не в MVP)

- Supabase **Storage** + `proof_url` (фаза 2)
- Edge Function: серверная выдача награды при clean
- Таблица `game_regions` для центров городов

См. [validation_check.md](../.E_plans_tasks/validation_check.md), [ROADMAP.md](../ROADMAP.md).
