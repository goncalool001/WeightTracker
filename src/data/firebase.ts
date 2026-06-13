import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

/**
 * Firebase initialisation. Configuration comes from `VITE_FIREBASE_*` env vars
 * (safe to ship in the frontend — access is enforced by Firestore security
 * rules). When the config is absent the app runs fully local, with cloud sync
 * simply disabled.
 */

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** True when enough config is present to enable cloud sync. */
export const firebaseReady = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

if (firebaseReady) {
  app = initializeApp(config);
  authInstance = getAuth(app);
  try {
    // Offline-capable, multi-tab persistent cache.
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Persistence unsupported (e.g. private mode) — fall back to memory cache.
    dbInstance = initializeFirestore(app, {});
  }
}

export const auth = authInstance;
export const db = dbInstance;
