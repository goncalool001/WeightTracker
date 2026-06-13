import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { firebaseReady } from '@/data/firebase';
import {
  mergeOnSignIn,
  onAuth,
  subscribeEntries,
  subscribeGoal,
} from '@/data/sync';
import { useStore } from '@/store/useStore';

/**
 * Drives cloud sync: tracks auth state, performs a one-time merge on sign-in,
 * then keeps the store live with realtime Firestore subscriptions. No-ops when
 * Firebase isn't configured (the app stays fully local).
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

    const unsubAuth = onAuth(async (fbUser) => {
      clearDataSubs();

      if (!fbUser) {
        store().setUser(null);
        return;
      }

      store().setUser({
        uid: fbUser.uid,
        name: fbUser.displayName,
        email: fbUser.email,
        photoURL: fbUser.photoURL,
      });

      try {
        // Upload any local-only history before going live.
        await mergeOnSignIn(fbUser.uid, store().entries, store().goalWeight);
      } catch {
        toast.error('Could not sync local data to the cloud.');
      }

      unsubsRef.current.push(
        subscribeEntries(fbUser.uid, (entries) =>
          store().applyRemoteEntries(entries),
        ),
        subscribeGoal(fbUser.uid, (goal) => store().applyRemoteGoal(goal)),
      );

      toast.success(`Synced as ${fbUser.displayName ?? fbUser.email ?? 'you'}`);
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
