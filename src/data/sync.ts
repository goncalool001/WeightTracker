import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
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
import type { WeightEntry } from '@/types';

/**
 * Cloud-sync layer over Firebase Auth + Firestore.
 *
 * Data model (per signed-in user):
 *   users/{uid}/entries/{YYYY-MM-DD}  → { date, weight, updatedAt }
 *   users/{uid}/meta/settings         → { goalWeight, updatedAt }
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
  } catch (err: any) {
    // auth/credential-already-in-use, auth/cancelled-popup-request, etc.
    // onAuthStateChanged will still fire with the current user if one is
    // already signed in, so we only need to surface unexpected errors.
    const code: string = err?.code ?? '';
    if (
      code !== 'auth/credential-already-in-use' &&
      code !== 'auth/cancelled-popup-request' &&
      code !== 'auth/popup-closed-by-user'
    ) {
      console.error('[Auth] getRedirectResult error:', code, err?.message);
    }
    return null;
  }
}

/**
 * Sign in with Google via a full-page redirect (works on all browsers,
 * including desktop Chrome with third-party cookies disabled and all
 * mobile browsers). The sign-in completes on the return page load when
 * handleRedirectResult() is called.
 *
 * Rejects (before navigating) on configuration problems such as an
 * unauthorized domain or a disabled provider — the caller surfaces the cause
 * via `authErrorMessage`.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!auth) throw new Error('auth/not-initialized');
  const provider = new GoogleAuthProvider();
  // Ensure the account chooser always appears so the user can switch accounts.
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithRedirect(auth, provider);
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
      if (date && !Number.isNaN(weight)) entries.push({ date, weight });
    });
    cb(entries);
  });
}

/** Subscribe to the user's goal weight. */
export function subscribeGoal(
  uid: string,
  cb: (goal: number | null) => void,
): () => void {
  if (!db) return noop;
  return onSnapshot(settingsDoc(uid), (snap) => {
    const value = snap.exists() ? snap.get('goalWeight') : null;
    cb(value == null ? null : Number(value));
  });
}

// ── Writes ──────────────────────────────────────────────────────────────────

export async function pushEntry(uid: string, entry: WeightEntry): Promise<void> {
  if (!db) return;
  await setDoc(entryDoc(uid, entry.date), {
    date: entry.date,
    weight: entry.weight,
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
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function pushGoal(
  uid: string,
  goal: number | null,
): Promise<void> {
  if (!db) return;
  await setDoc(
    settingsDoc(uid),
    { goalWeight: goal, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * One-time reconciliation when a device signs in: upload any local entries that
 * aren't in the cloud yet (e.g. the seeded history on first link), and seed the
 * goal if the cloud has none. The cloud value wins on per-date conflicts; the
 * realtime subscription then delivers the merged dataset.
 */
export async function mergeOnSignIn(
  uid: string,
  localEntries: WeightEntry[],
  localGoal: number | null,
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
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }

  const settings = await getDoc(settingsDoc(uid));
  if (!settings.exists() && localGoal != null) {
    await pushGoal(uid, localGoal);
  }
}
