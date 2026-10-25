import { create } from 'zustand';
import {
  currentGoal,
  defaultCustomRange,
  isTargetGoal,
  migrateGoals,
  normalizeEntries,
  removeEntry,
  replaceGoal,
  todayISO,
  upsertEntry,
  type EntryExtras,
} from '@/domain';
import { loadState, saveState } from '@/data/storage';
import { DEV_SEED } from '@/data/devSeed';
import {
  pushDeleteEntry,
  pushEntry,
  pushGoals,
  pushReplace,
  type RemoteSettings,
} from '@/data/sync';
import type {
  CustomRange,
  Goal,
  Granularity,
  Locale,
  Overlay,
  PersistedState,
  RangeKey,
  SyncUser,
  Theme,
  WeightEntry,
} from '@/types';

interface AppState extends Omit<PersistedState, 'goals'> {
  /** Goal history, oldest first (always in the current lose/gain/maintain form). */
  goals: Goal[];
  /** True once the initial async hydrate has completed. */
  hydrated: boolean;
  /** Set when the local store could not be read. */
  loadError: boolean;
  /** Dev seed session: nothing is persisted or synced. */
  ephemeral: boolean;
  /** Signed-in user for cloud sync, or null. */
  user: SyncUser | null;
  /** Network connectivity (drives the sync indicator). */
  online: boolean;

  // ── lifecycle ─────────────────────────────────────────────
  hydrate: () => Promise<void>;

  // ── data mutations (each returns what undo needs) ─────────
  /** `extras`: per field, undefined keeps what the day has, a value replaces it, null removes it. */
  addOrUpdate: (
    date: string,
    weight: number,
    extras?: EntryExtras,
  ) => { action: 'added' | 'updated'; previous: WeightEntry | null };
  deleteEntry: (date: string) => WeightEntry | null;
  replaceEntries: (entries: WeightEntry[]) => WeightEntry[];

  // ── goals ─────────────────────────────────────────────────
  /** Replace the current goal (null removes it); returns the previous history. */
  setGoal: (goal: Goal | null) => Goal[];
  /** Put a whole goal history back (undo). */
  restoreGoals: (goals: Goal[]) => void;

  // ── settings ──────────────────────────────────────────────
  setOverlay: (overlay: Overlay) => void;
  setRange: (range: RangeKey) => void;
  setCustomRange: (range: CustomRange) => void;
  setGranularity: (granularity: Granularity) => void;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;

  // ── sync (applied from the cloud; do NOT echo back) ───────
  setUser: (user: SyncUser | null) => void;
  setOnline: (online: boolean) => void;
  applyRemoteEntries: (entries: WeightEntry[]) => void;
  applyRemoteSettings: (settings: RemoteSettings) => void;
  /** Drop the local view of account data on sign-out (cloud is untouched). */
  clearAccountData: () => void;
}

/** Default theme follows the OS preference on first run. */
function defaultTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/** Default language follows the browser. */
function defaultLocale(): Locale {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pt')) {
    return 'pt';
  }
  return 'en';
}

/** Pull the persistable slice out of the full state. */
function snapshot(s: AppState): PersistedState {
  return {
    entries: s.entries,
    goals: s.goals,
    overlay: s.overlay,
    range: s.range,
    customRange: s.customRange ?? null,
    granularity: s.granularity,
    theme: s.theme,
    locale: s.locale,
    seeded: s.seeded,
  };
}

export const useStore = create<AppState>((set, get) => {
  /** Persist the current serialisable slice to the local cache. */
  const persist = () => {
    if (!get().ephemeral) void saveState(snapshot(get()));
  };
  const uid = () => (get().ephemeral ? undefined : get().user?.uid);

  return {
    // defaults (overwritten by hydrate)
    entries: [],
    goals: [],
    overlay: 'ma',
    range: '90d',
    customRange: null,
    granularity: 'weekly',
    theme: defaultTheme(),
    locale: defaultLocale(),
    seeded: false,
    hydrated: false,
    loadError: false,
    ephemeral: false,
    user: null,
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,

    hydrate: async () => {
      // `import.meta.env.DEV` is the literal false in production, so this
      // branch and the seed chunk are dropped from the build.
      if (import.meta.env.DEV && DEV_SEED) {
        const seed = await import('@/data/seed');
        set({
          entries: new URLSearchParams(window.location.search).has('tags')
            ? seed.withDemoTags(seed.SEED_ENTRIES)
            : seed.SEED_ENTRIES,
          goals:
            DEV_SEED === 'lose'
              ? seed.SEED_GOALS_LOSE
              : DEV_SEED === 'gain'
                ? seed.SEED_GOALS_GAIN
                : seed.SEED_GOALS_MAINTAIN,
          ephemeral: true,
          hydrated: true,
          loadError: false,
        });
        return;
      }
      try {
        const saved = await loadState();
        if (saved) {
          // Defaults for fields added after the first release, and the move
          // from a single goalWeight to a goal history.
          const entries = normalizeEntries(saved.entries ?? []);
          set({
            ...saved,
            entries,
            goals: migrateGoals(saved.goals, saved.goalWeight, entries),
            locale: saved.locale ?? defaultLocale(),
            overlay: saved.overlay ?? 'ma',
            hydrated: true,
            loadError: false,
          });
        } else {
          // Start empty. Entries belong to the signed-in account and arrive
          // via cloud sync after sign-in.
          set({ hydrated: true, loadError: false });
        }
      } catch {
        set({ hydrated: true, loadError: true });
      }
    },

    addOrUpdate: (date, weight, extras) => {
      const previous = get().entries.find((e) => e.date === date) ?? null;
      const { entries, action } = upsertEntry(get().entries, date, weight, extras);
      set({ entries });
      const id = uid();
      if (id) void pushEntry(id, entries.find((e) => e.date === date)!);
      persist(); // keep the local cache warm for offline / pre-auth loads
      return { action, previous };
    },

    deleteEntry: (date) => {
      const removed = get().entries.find((e) => e.date === date) ?? null;
      set({ entries: removeEntry(get().entries, date) });
      const id = uid();
      if (id) void pushDeleteEntry(id, date);
      persist();
      return removed;
    },

    replaceEntries: (entries) => {
      const before = get().entries;
      const next = normalizeEntries(entries);
      const id = uid();
      if (id) {
        const nextDates = new Set(next.map((e) => e.date));
        const removed = before.filter((e) => !nextDates.has(e.date)).map((e) => e.date);
        void pushReplace(id, next, removed);
      }
      set({ entries: next, seeded: true });
      persist();
      return before;
    },

    setGoal: (goal) => {
      const before = get().goals;
      const goals = replaceGoal(before, goal, todayISO());
      set({ goals });
      const id = uid();
      if (id) void pushGoals(id, goals);
      persist();
      return before;
    },

    restoreGoals: (goals) => {
      set({ goals });
      const id = uid();
      if (id) void pushGoals(id, goals);
      persist();
    },

    setOverlay: (overlay) => {
      set({ overlay });
      persist();
    },

    setRange: (range) => {
      // The first time Dates is picked, start from the last 30 days.
      const customRange =
        range === 'custom' && !get().customRange ? defaultCustomRange(get().entries) : get().customRange;
      set({ range, customRange });
      persist();
    },

    setCustomRange: (customRange) => {
      set({ customRange, range: 'custom' });
      persist();
    },

    setGranularity: (granularity) => {
      set({ granularity });
      persist();
    },

    setTheme: (theme) => {
      set({ theme });
      persist();
    },

    setLocale: (locale) => {
      set({ locale });
      persist();
    },

    // ── sync application (no write-back to the cloud) ─────────
    setUser: (user) => set({ user }),
    setOnline: (online) => set({ online }),

    applyRemoteEntries: (entries) => {
      set({ entries: normalizeEntries(entries) });
      persist();
    },

    applyRemoteSettings: ({ goals, goalWeight }) => {
      if (goals) {
        set({ goals: migrateGoals(goals, null, get().entries) });
      } else {
        // Older cloud data: keep the local history when it already agrees.
        const local = currentGoal(get().goals);
        const same = isTargetGoal(local) && local.target === goalWeight;
        if (!same) set({ goals: migrateGoals(undefined, goalWeight, get().entries) });
      }
      persist();
    },

    clearAccountData: () => {
      // Local-only reset (sign-out): the cloud copy stays intact so the data
      // returns on the next sign-in. No cloud writes are issued.
      set({ entries: [], goals: [] });
      persist();
    },
  };
});
