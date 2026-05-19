# Earthity

Мобильная игра (React Native / Expo), где реальные экологические действия связаны с прогрессом на карте: отметить мусор, помочь убрать, растить существо, выполнять квесты. **Non-violence** — без PvP и агрессии.

## Документация

| Документ | Описание |
|----------|----------|
| [docs/README.md](docs/README.md) | Навигатор по всем материалам |
| [docs/PRODUCT.md](docs/PRODUCT.md) | Продукт: что есть и что в планах |
| [docs/PITCH.md](docs/PITCH.md) | Текст для презентации (слайды) |
| [docs/BUSINESS.md](docs/BUSINESS.md) | Бизнес-план (черновик) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Архитектура для разработчиков |
| [docs/SUPABASE.md](docs/SUPABASE.md) | Бэкенд, миграции, `.env` |
| [docs/DISTRIBUTION.md](docs/DISTRIBUTION.md) | Сборка APK для тестеров (EAS) |
| [ROADMAP.md](ROADMAP.md) | Фазы разработки |
| [EARTHTY-BACKLOG.md](EARTHTY-BACKLOG.md) | Задачи и техдолг |

## Что уже работает

- **Аккаунты** — Supabase Auth (email/password), облачный сейв прогресса
- **Карта** — геолокация, AR-слой существ, ресурсные точки
- **Общие метки мусора** — все игроки видят метки; placement в ~80 м; лимит 3 active; TTL 7 дней
- **Награды** — dobri / XP с множителем (normal / rare / epic до ×3)
- **Игра** — квесты, daily, инвентарь, крафт, дневник ухода, 5 языков (ru, en, de, uk, ar)

## Tech stack

- React Native + **Expo ~54** + TypeScript + Expo Router
- **Supabase** — Auth, `saves` (JSONB), `cleanup_spots`
- AsyncStorage — локальный кэш сейва
- `react-native-maps`, `expo-location`, Three.js / R3F

## Run locally

```bash
npm install
cp .env.example .env   # заполнить Supabase + Maps
npx expo start
```

Android (нативная карта): `npx expo run:android` после prebuild при необходимости.

Подробнее: [docs/SUPABASE.md](docs/SUPABASE.md).

## Status

Активная разработка. Пилот: один город, закрытый тест. Store / EAS — в roadmap.

## Screenshots

_Добавить: карта с меткой, epic-баннер, login, существо, профиль._

## Author

Независимый проект (learning + product). См. [docs/BUSINESS.md](docs/BUSINESS.md) для партнёрств и пилота.
