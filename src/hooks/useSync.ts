import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { firebaseReady } from '@/data/firebase';
import {
  handleRedirectResult,
  mergeOnSignIn,
  onAuth,
  subscribeEntries,
  subscribeGoal,
} from '@/data/sync';
import { getT } from '@/i18n';
import { useStore } from '@/store/useStore';

/**
 * Drives cloud sync: resolves any pending redirect sign-in, tracks auth state,
 * performs a one-time merge on sign-in, then keeps the store live with realtime
 * Firestore subscriptions. No-ops when Firebase isn't configured.
 */
export function useSync(): void {
  const unsubsRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!firebaseReady) return;

    const store = useStore.getState;
    const clearDataSubs = () => {
      unsubsRef.current.forEach((fn) => fn());
      unsubsRef.current = [];
    };

    // Complete any in-flight redirect sign-in FIRST. getRedirectResult returns
    // a user ONLY immediately after a redirect flow completes (not on ordinary
    // reloads), so a truthy result means a fresh sign-in → confirm it in green.
    void handleRedirectResult()
      .then((u) => {
        if (u) {
          const t = getT(store().locale);
          toast.success(t.signedInAs(u.displayName ?? u.email ?? 'Google'));
        }
      })
      .catch((err) => {
        console.error('[useSync] redirect result error:', err);
      });

    const unsubAuth = onAuth(async (fbUser) => {
      clearDataSubs();

      if (!fbUser) {
        // Signed out (or never signed in): data is account-scoped, so clear the
        // local view. The cloud copy is untouched and returns on next sign-in.
        store().setUser(null);
        store().clearAccountData();
        return;
      }

      store().setUser({
        uid: fbUser.uid,
        name: fbUser.displayName,
        email: fbUser.email,
        photoURL: fbUser.photoURL,
      });

      try {
        await mergeOnSignIn(fbUser.uid, store().entries, store().goalWeight);
      } catch {
        toast.error(getT(store().locale).syncLocalFailed);
      }

      unsubsRef.current.push(
        subscribeEntries(fbUser.uid, (entries) =>
          store().applyRemoteEntries(entries),
        ),
        subscribeGoal(fbUser.uid, (goal) => store().applyRemoteGoal(goal)),
      );
      // No success toast here: this handler also fires on every reload when a
      // session is restored. The green confirmation is shown once, at the
      // moment of sign-in (popup → AuthControl, redirect → above).
    });

    return () => {
      unsubAuth();
      clearDataSubs();
    };
  }, []);

  // Track connectivity for the sync indicator.
  useEffect(() => {
    const setOnline = useStore.getState().setOnline;
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
}
