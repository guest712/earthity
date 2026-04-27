import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, Platform, StyleSheet, View, type AppStateStatus } from 'react-native';

import NewDayBanner from '../../components/daily/NewDayBanner';
import { LANGS } from '../../lib/i18n/i18n';
import { useAppLanguage } from '../../lib/i18n/LanguageContext';
import { loadSave, updateSave } from '../../lib/storage/storage';
import {
  claimDailyQuestByKind,
  ensureDailyQuestsForToday,
  getLocalDayKey,
  incrementDailyQuestProgress,
} from '../../lib/shared/daily-engine';
import type { DailyQuestKind, DailyQuestsSave, LanguageCode } from '../../lib/shared/types';

const PEDOMETER_POLL_MS = 12_000;
const AVG_STEP_LENGTH_M = 0.78;
const MAX_WALK_DELTA_PER_TICK_M = 800;

type PedometerModule = {
  isAvailableAsync: () => Promise<boolean>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getStepCountAsync: (start: Date, end: Date) => Promise<{ steps: number }>;
};

/** Avoid static import: missing native ExponentPedometer can throw at module load. */
let pedometerLoad: Promise<PedometerModule | null> | null = null;
function loadPedometerModule(): Promise<PedometerModule | null> {
  if (!pedometerLoad) {
    pedometerLoad = (async () => {
      try {
        const m = await import('expo-sensors');
        return m.Pedometer;
      } catch {
        return null;
      }
    })();
  }
  return pedometerLoad;
}

type WalkTrackingKind = 'pending' | 'pedometer' | 'gps';

type ClaimResult = {
  ok: boolean;
  rewardDobri: number;
  rewardXp: number;
  kind: DailyQuestKind;
};

type DailyQuestsApi = {
  state: DailyQuestsSave;
  isHydrated: boolean;
  /** Pedometer when permitted; otherwise GPS deltas from the map screen. */
  walkTrackingKind: WalkTrackingKind;
  claimableCount: number;
  increment: (kind: DailyQuestKind, amount?: number) => void;
  claim: (kind: DailyQuestKind) => ClaimResult;
};

const DailyQuestsContext = createContext<DailyQuestsApi | undefined>(undefined);

export function DailyQuestsProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useAppLanguage();
  const tStrings = LANGS[(lang ?? 'en') as LanguageCode];

  const [state, setState] = useState<DailyQuestsSave>(() =>
    ensureDailyQuestsForToday(null)
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [walkTrackingKind, setWalkTrackingKind] =
    useState<WalkTrackingKind>('pending');

  const lastDateRef = useRef<string>(state.date);
  const lastPedometerMetersRef = useRef(0);
  const stateRef = useRef<DailyQuestsSave>(state);

  const persist = useCallback((next: DailyQuestsSave) => {
    void updateSave({ dailyQuests: next });
  }, []);

  const dismissBanner = useCallback(() => setBannerVisible(false), []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const increment = useCallback(
    (kind: DailyQuestKind, amount = 1) => {
      setState((prev) => {
        const next = incrementDailyQuestProgress(prev, kind, amount);
        if (next !== prev) {
          persist(next);
          stateRef.current = next;
        }
        return next;
      });
    },
    [persist]
  );

  const claim = useCallback(
    (kind: DailyQuestKind): ClaimResult => {
      const prev = stateRef.current;
      const { state: nextState, claimed: row } = claimDailyQuestByKind(prev, kind);
      if (!row) {
        return { ok: false, rewardDobri: 0, rewardXp: 0, kind };
      }
      stateRef.current = nextState;
      setState(nextState);
      persist(nextState);
      return {
        ok: true,
        rewardDobri: row.rewardDobri,
        rewardXp: row.rewardXp,
        kind,
      };
    },
    [persist]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const save = await loadSave();
        if (cancelled) return;
        const today = getLocalDayKey();
        const oldDate = save.dailyQuests?.date;
        const next = ensureDailyQuestsForToday(save.dailyQuests ?? null, today);
        stateRef.current = next;
        setState(next);
        lastDateRef.current = next.date;
        if (!save.dailyQuests || save.dailyQuests.date !== today) {
          persist(next);
        }
        if (oldDate && oldDate !== today) {
          setBannerVisible(true);
        }
      } catch (e) {
        console.warn('Daily quests load error', e);
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [persist]);

  useEffect(() => {
    lastPedometerMetersRef.current = 0;
  }, [state.date]);

  useEffect(() => {
    if (!isHydrated) return;
    let cancelled = false;
    (async () => {
      if (Platform.OS === 'web') {
        setWalkTrackingKind('gps');
        return;
      }
      try {
        const Pedometer = await loadPedometerModule();
        if (cancelled) return;
        if (!Pedometer) {
          setWalkTrackingKind('gps');
          return;
        }
        const avail = await Pedometer.isAvailableAsync();
        if (cancelled) return;
        if (!avail) {
          setWalkTrackingKind('gps');
          return;
        }
        const perm = await Pedometer.requestPermissionsAsync();
        if (cancelled) return;
        if (perm.status !== 'granted') {
          setWalkTrackingKind('gps');
          return;
        }
        setWalkTrackingKind('pedometer');
      } catch {
        if (!cancelled) setWalkTrackingKind('gps');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated || walkTrackingKind !== 'pedometer') return;
    let cancelled = false;
    const sync = async () => {
      try {
        const Pedometer = await loadPedometerModule();
        if (!Pedometer) return;
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const { steps } = await Pedometer.getStepCountAsync(start, now);
        if (cancelled) return;
        const meters = Math.round(steps * AVG_STEP_LENGTH_M);
        const delta = meters - lastPedometerMetersRef.current;
        if (delta < 0) {
          lastPedometerMetersRef.current = meters;
          return;
        }
        if (delta === 0) return;
        const applied = Math.min(delta, MAX_WALK_DELTA_PER_TICK_M);
        lastPedometerMetersRef.current = meters;
        increment('walk_meters', applied);
      } catch {
        /* single tick failure — next interval retries */
      }
    };
    void sync();
    const id = setInterval(sync, PEDOMETER_POLL_MS);
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') void sync();
    });
    return () => {
      cancelled = true;
      clearInterval(id);
      sub.remove();
    };
  }, [isHydrated, walkTrackingKind, increment, state.date]);

  const rotateIfNeeded = useCallback(() => {
    const today = getLocalDayKey();
    if (today === lastDateRef.current) return;
    setState((prev) => {
      const rotated = ensureDailyQuestsForToday(prev, today);
      if (rotated === prev) {
        lastDateRef.current = today;
        return prev;
      }
      persist(rotated);
      lastDateRef.current = today;
      stateRef.current = rotated;
      if (prev.date !== today) {
        queueMicrotask(() => setBannerVisible(true));
      }
      return rotated;
    });
  }, [persist]);

  useEffect(() => {
    rotateIfNeeded();
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') rotateIfNeeded();
    });
    const tick = setInterval(rotateIfNeeded, 60_000);
    return () => {
      sub.remove();
      clearInterval(tick);
    };
  }, [rotateIfNeeded]);

  const claimableCount = useMemo(
    () =>
      state.quests.filter((q) => q.progress >= q.target && !q.claimed).length,
    [state.quests]
  );

  const value = useMemo<DailyQuestsApi>(
    () => ({
      state,
      isHydrated,
      walkTrackingKind,
      claimableCount,
      increment,
      claim,
    }),
    [state, isHydrated, walkTrackingKind, claimableCount, increment, claim]
  );

  return (
    <DailyQuestsContext.Provider value={value}>
      <View style={styles.fill}>
        {children}
        <NewDayBanner
          visible={bannerVisible}
          title={tStrings.newQuests}
          body={tStrings.dailyNewDayBannerBody}
          onDismiss={dismissBanner}
        />
      </View>
    </DailyQuestsContext.Provider>
  );
}

export function useDailyQuests(): DailyQuestsApi {
  const ctx = useContext(DailyQuestsContext);
  if (!ctx) {
    throw new Error('useDailyQuests must be used inside DailyQuestsProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
