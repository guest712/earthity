import type {
  ActiveDailyQuest,
  DailyQuestKind,
  DailyQuestsSave,
} from './types';
import {
  DAILY_QUESTS_PER_DAY,
  DAILY_QUEST_TEMPLATES,
  type DailyQuestTemplate,
} from '../../features/dailyQuests/dailyQuest.constants';

/** Day key stable within local TZ, used both as quest seed and rotation trigger. */
export function getLocalDayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return h >>> 0;
}

/** mulberry32 — small fast deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickN<T>(items: T[], n: number, rand: () => number): T[] {
  const pool = [...items];
  const out: T[] = [];
  const take = Math.min(n, pool.length);
  for (let i = 0; i < take; i++) {
    const idx = Math.floor(rand() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function generateDailyQuests(
  date: string = getLocalDayKey()
): DailyQuestsSave {
  const rand = mulberry32(djb2(date));
  const picked = pickN<DailyQuestTemplate>(
    DAILY_QUEST_TEMPLATES,
    DAILY_QUESTS_PER_DAY,
    rand
  );
  const quests: ActiveDailyQuest[] = picked.map((tpl) => ({
    kind: tpl.kind,
    target: tpl.target,
    progress: 0,
    rewardDobri: tpl.rewardDobri,
    rewardXp: tpl.rewardXp,
    claimed: false,
  }));
  return { date, quests };
}

/** Rotate or initialise. Returns new state if it changed, otherwise the same ref. */
export function ensureDailyQuestsForToday(
  state: DailyQuestsSave | null,
  today: string = getLocalDayKey()
): DailyQuestsSave {
  if (state && state.date === today) return state;
  return generateDailyQuests(today);
}

export function incrementDailyQuestProgress(
  state: DailyQuestsSave,
  kind: DailyQuestKind,
  amount: number
): DailyQuestsSave {
  if (amount <= 0) return state;
  let touched = false;
  const quests = state.quests.map((q) => {
    if (q.kind !== kind) return q;
    if (q.progress >= q.target) return q;
    touched = true;
    return {
      ...q,
      progress: Math.min(q.target, q.progress + amount),
    };
  });
  return touched ? { ...state, quests } : state;
}

export function claimDailyQuestByKind(
  state: DailyQuestsSave,
  kind: DailyQuestKind
): { state: DailyQuestsSave; claimed: ActiveDailyQuest | null } {
  let claimed: ActiveDailyQuest | null = null;
  const quests = state.quests.map((q) => {
    if (q.kind !== kind) return q;
    if (q.claimed) return q;
    if (q.progress < q.target) return q;
    claimed = { ...q, claimed: true };
    return claimed;
  });
  return { state: { ...state, quests }, claimed };
}

export function getDailyQuestTemplate(
  kind: DailyQuestKind
): DailyQuestTemplate | undefined {
  return DAILY_QUEST_TEMPLATES.find((t) => t.kind === kind);
}
