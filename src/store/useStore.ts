import { create } from 'zustand';
import {
  normalizeEntries,
  removeEntry,
  roundWeight,
  upsertEntry,
} from '@/domain';
import { loadState, saveState } from '@/data/storage';
import { SEED_ENTRIES } from '@/data/seed';
import {
  pushDeleteEntry,
  pushEntry,
  pushGoal,
  pushReplace,
} from '@/data/sync';
import type {
  Granularity,
  Overlay,
  PersistedState,
  RangeKey,
  SyncUser,
  Theme,
  WeightEntry,
} from '@/types';

interface AppState extends PersistedState {
  /** True once the initial async hydrate has completed. */
  hydrated: boolean;
  /** Signed-in user for cloud sync, or null. */
  user: SyncUser | null;
  /** Network connectivity (drives the sync indicator). */
  online: boolean;

  // ── lifecycle ─────────────────────────────────────────────
  hydrate: () => Promise<void>;

  // ── data mutations ────────────────────────────────────────
  addOrUpdate: (date: string, weight: number) => 'added' | 'updated';
  deleteEntry: (date: string) => void;
  replaceEntries: (entries: WeightEntry[]) => void;

  // ── settings ──────────────────────────────────────────────
  setGoal: (goal: number | null) => void;
  setOverlay: (overlay: Overlay) => void;
  setRange: (range: RangeKey) => void;
  setGranularity: (granularity: Granularity) => void;
  setTheme: (theme: Theme) => void;

  // ── sync (applied from the cloud; do NOT echo back) ───────
  setUser: (user: SyncUser | null) => void;
  setOnline: (online: boolean) => void;
  applyRemoteEntries: (entries: WeightEntry[]) => void;
  applyRemoteGoal: (goal: number | null) => void;
}

/** Default theme follows the OS preference on first run. */
function defaultTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }
  return 'dark';
}

/** Pull the persistable slice out of the full state. */
function snapshot(s: AppState): PersistedState {
  return {
    entries: s.entries,
    goalWeight: s.goalWeight,
    overlay: s.overlay,
    range: s.range,
    granularity: s.granularity,
    theme: s.theme,
    seeded: s.seeded,
  };
}

export const useStore = create<AppState>((set, get) => {
  /** Persist the current serialisable slice to the local cache. */
  const persist = () => void saveState(snapshot(get()));

  return {
    // defaults (overwritten by hydrate)
    entries: [],
    goalWeight: null,
    overlay: 'trend',
    range: 'all',
    granularity: 'weekly',
    theme: defaultTheme(),
    seeded: false,
    hydrated: false,
    user: null,
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,

    hydrate: async () => {
      const saved = await loadState();
      if (saved) {
        set({ ...saved, hydrated: true });
      } else {
        // First ever launch: seed from the bundled dataset.
        set({
          entries: normalizeEntries(SEED_ENTRIES),
          seeded: true,
          hydrated: true,
        });
        persist();
      }
    },

    addOrUpdate: (date, weight) => {
      const { entries, action } = upsertEntry(get().entries, date, weight);
      set({ entries });
      const uid = get().user?.uid;
      if (uid) {
        const saved = entries.find((e) => e.date === date)!;
        void pushEntry(uid, saved);
      }
      persist(); // keep the local cache warm for offline / pre-auth loads
      return action;
    },

    deleteEntry: (date) => {
      set({ entries: removeEntry(get().entries, date) });
      const uid = get().user?.uid;
      if (uid) void pushDeleteEntry(uid, date);
      persist();
    },

    replaceEntries: (entries) => {
      const next = normalizeEntries(entries);
      const uid = get().user?.uid;
      if (uid) {
        const nextDates = new Set(next.map((e) => e.date));
        const removed = get()
          .entries.filter((e) => !nextDates.has(e.date))
          .map((e) => e.date);
        void pushReplace(uid, next, removed);
      }
      set({ entries: next, seeded: true });
      persist();
    },

    setGoal: (goalWeight) => {
      set({ goalWeight });
      const uid = get().user?.uid;
      if (uid) void pushGoal(uid, goalWeight);
      persist();
    },

    setOverlay: (overlay) => {
      set({ overlay });
      persist();
    },

    setRange: (range) => {
      set({ range });
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

    // ── sync application (no write-back to the cloud) ─────────
    setUser: (user) => set({ user }),
    setOnline: (online) => set({ online }),

    applyRemoteEntries: (entries) => {
      set({ entries: normalizeEntries(entries) });
      persist();
    },

    applyRemoteGoal: (goal) => {
      set({ goalWeight: goal == null ? null : roundWeight(goal) });
      persist();
    },
  };
});
