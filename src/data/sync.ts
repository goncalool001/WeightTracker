import {
  GoogleAuthProvider,
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

/** Sign in with Google — popup on desktop, redirect fallback on mobile. */
export async function signInWithGoogle(): Promise<void> {
  if (!auth) return;
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch {
    // Popups are often blocked on mobile browsers — fall back to redirect.
    await signInWithRedirect(auth, provider);
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
