import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { currentGoal, legacyGoalWeight } from '@/domain/goals';
import { cleanNote } from '@/domain/entries';
import { cleanTags } from '@/domain/categories';
import type { Goal, StoredGoal, WeightEntry } from '@/types';

/**
 * Cloud-sync layer over Firebase Auth + Firestore.
 *
 * Data model (per signed-in user):
 *   users/{uid}/entries/{YYYY-MM-DD}  → { date, weight, note, tags, updatedAt }
 *   users/{uid}/meta/settings         → { goals, goalWeight, updatedAt }
 *
 * `goals` is the goal history; `goalWeight` (the current target, or a band's
 * ceiling) is still written so older clients keep showing a goal line.
 *
 * This module is store-agnostic: it takes plain data and `uid`s, and exposes
 * subscriptions whose callbacks the UI layer wires into the store.
 */

const noop = () => {};

function entriesCol(uid: string) {
  return collection(db!, 'users', uid, 'entries');
}
function entryDoc(uid: string, date: string) {
  return doc(db!, 'users', uid, 'entries', date);
}
function settingsDoc(uid: string) {
  return doc(db!, 'users', uid, 'meta', 'settings');
}

// ── Auth ──────────────────────────────────────────────────────────────────

/** Subscribe to auth state; returns an unsubscribe function. */
export function onAuth(cb: (user: User | null) => void): () => void {
  if (!auth) return noop;
  return onAuthStateChanged(auth, cb);
}

/**
 * Complete any pending redirect sign-in from a previous page navigation.
 * Must be called once on app startup — before or alongside onAuthStateChanged.
 * Returns the signed-in user if a redirect just completed, or null otherwise.
 */
export async function handleRedirectResult(): Promise<User | null> {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (err) {
    // auth/credential-already-in-use, auth/cancelled-popup-request, etc.
    // onAuthStateChanged will still fire with the current user if one is
    // already signed in, so we only need to surface unexpected errors.
    const code: string = (err as { code?: string })?.code ?? '';
    if (
      code !== 'auth/credential-already-in-use' &&
      code !== 'auth/cancelled-popup-request' &&
      code !== 'auth/popup-closed-by-user'
    ) {
      console.error('[Auth] getRedirectResult error:', code, (err as Error)?.message);
    }
    return null;
  }
}

/**
 * Sign in with Google.
 *
 * Uses a **popup** by default: the credential is returned to the opener via
 * postMessage, so it works even when the app domain differs from the Firebase
 * `authDomain` and the browser blocks third-party storage (which breaks the
 * redirect flow's result relay). Resolves with the signed-in `User`.
 *
 * Falls back to a **full-page redirect** when the popup can't be used (blocked
 * by the browser, or unsupported in-app webviews — typical on mobile); in that
 * case it navigates away and resolves with `null` (the sign-in completes on the
 * return load via `handleRedirectResult`).
 *
 * Rejects on a deliberate cancellation or a configuration problem (unauthorized
 * domain, disabled provider) — the caller surfaces the cause via
 * `authErrorMessage`.
 */
export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) throw new Error('auth/not-initialized');
  const provider = new GoogleAuthProvider();
  // Ensure the account chooser always appears so the user can switch accounts.
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  } catch (err) {
    const code = (err as { code?: string })?.code ?? '';
    // The popup couldn't open — fall back to a redirect.
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, provider);
      return null; // navigating away
    }
    // auth/popup-closed-by-user, auth/cancelled-popup-request (user action) and
    // real config errors propagate to the caller.
    throw err;
  }
}

/**
 * Map a Firebase Auth error to a human-readable, actionable message and log the
 * raw code to the console for diagnostics. Covers the configuration mistakes
 * that fail identically on desktop and mobile (unauthorized domain, provider
 * not enabled) plus network/cancellation cases.
 */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const message = (err as { message?: string })?.message ?? String(err);
  console.error('[Auth] sign-in error:', code || '(no code)', message);

  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized. Add it in Firebase → Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Turn it on in Firebase → Authentication → Sign-in method → Google.';
    case 'auth/configuration-not-found':
      return 'Firebase Auth is not set up. Enable Google sign-in and verify your config values.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'The Firebase API key is invalid. Check your VITE_FIREBASE_* values.';
    case 'auth/network-request-failed':
      return 'Network error reaching Firebase. Check your connection and try again.';
    case 'auth/popup-blocked':
      return 'The browser blocked the sign-in window.';
    case 'auth/cancelled-popup-request':
    case 'auth/popup-closed-by-user':
    case 'auth/user-cancelled':
      return 'Sign-in was cancelled.';
    case 'auth/not-initialized':
      return 'Cloud sync is not configured for this build.';
    default:
      return code
        ? `Sign-in failed (${code}).`
        : 'Sign-in failed. Please try again.';
  }
}

export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

// ── Realtime subscriptions ─────────────────────────────────────────────────

/** Subscribe to the user's entries; callback receives the full list. */
export function subscribeEntries(
  uid: string,
  cb: (entries: WeightEntry[]) => void,
): () => void {
  if (!db) return noop;
  return onSnapshot(entriesCol(uid), (snap) => {
    const entries: WeightEntry[] = [];
    snap.forEach((d) => {
      const weight = Number(d.get('weight'));
      const date = (d.get('date') as string) ?? d.id;
      const note = cleanNote(d.get('note'));
      const tags = cleanTags(d.get('tags'));
      if (date && !Number.isNaN(weight)) {
        const e: WeightEntry = { date, weight };
        if (note) e.note = note;
        if (tags) e.tags = tags;
        entries.push(e);
      }
    });
    cb(entries);
  });
}

/** Cloud goal settings: the history when present, else the legacy weight. */
export interface RemoteSettings {
  goals: StoredGoal[] | null;
  goalWeight: number | null;
}

function isGoal(g: unknown): g is StoredGoal {
  const x = g as StoredGoal;
  return (
    !!x &&
    ['reach', 'lose', 'gain', 'maintain'].includes(x.mode) &&
    typeof x.target === 'number' &&
    typeof x.low === 'number' &&
    typeof x.high === 'number' &&
    typeof x.setOn === 'string'
  );
}

/** Subscribe to the user's goal settings. */
export function subscribeSettings(
  uid: string,
  cb: (settings: RemoteSettings) => void,
): () => void {
  if (!db) return noop;
  return onSnapshot(settingsDoc(uid), (snap) => {
    const raw = snap.exists() ? snap.get('goals') : null;
    const goals = Array.isArray(raw)
      ? raw.filter(isGoal).map((g) => ({ ...g, endedOn: g.endedOn ?? null }))
      : null;
    const w = snap.exists() ? snap.get('goalWeight') : null;
    cb({ goals, goalWeight: w == null ? null : Number(w) });
  });
}

// ── Writes ──────────────────────────────────────────────────────────────────

export async function pushEntry(uid: string, entry: WeightEntry): Promise<void> {
  if (!db) return;
  await setDoc(entryDoc(uid, entry.date), {
    date: entry.date,
    weight: entry.weight,
    note: entry.note ?? null,
    tags: entry.tags ?? [],
    updatedAt: serverTimestamp(),
  });
}

export async function pushDeleteEntry(
  uid: string,
  date: string,
): Promise<void> {
  if (!db) return;
  await deleteDoc(entryDoc(uid, date));
}

/** Replace the cloud dataset: write all `entries`, delete `removedDates`. */
export async function pushReplace(
  uid: string,
  entries: WeightEntry[],
  removedDates: string[],
): Promise<void> {
  if (!db) return;
  const batch = writeBatch(db);
  for (const date of removedDates) batch.delete(entryDoc(uid, date));
  for (const e of entries) {
    batch.set(entryDoc(uid, e.date), {
      date: e.date,
      weight: e.weight,
      note: e.note ?? null,
      tags: e.tags ?? [],
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function pushGoals(uid: string, goals: Goal[]): Promise<void> {
  if (!db) return;
  await setDoc(
    settingsDoc(uid),
    {
      goals,
      goalWeight: legacyGoalWeight(currentGoal(goals)),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * One-time reconciliation when a device signs in: upload any local entries that
 * aren't in the cloud yet, and upload the goal history if the cloud has none. The cloud value wins on per-date conflicts; the
 * realtime subscription then delivers the merged dataset.
 */
export async function mergeOnSignIn(
  uid: string,
  localEntries: WeightEntry[],
  localGoals: Goal[],
): Promise<void> {
  if (!db) return;
  const remote = await getDocs(entriesCol(uid));
  const remoteDates = new Set<string>();
  remote.forEach((d) => remoteDates.add(d.id));

  const localOnly = localEntries.filter((e) => !remoteDates.has(e.date));
  if (localOnly.length > 0) {
    const batch = writeBatch(db);
    for (const e of localOnly) {
      batch.set(entryDoc(uid, e.date), {
        date: e.date,
        weight: e.weight,
        note: e.note ?? null,
        tags: e.tags ?? [],
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }

  const settings = await getDoc(settingsDoc(uid));
  if (!settings.exists() && localGoals.length > 0) {
    await pushGoals(uid, localGoals);
  }
}
