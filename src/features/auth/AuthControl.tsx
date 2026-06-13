import { useState } from 'react';
import { Cloud, CloudOff, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { firebaseReady } from '@/data/firebase';
import { signInWithGoogle, signOutUser } from '@/data/sync';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';

/** Header control for cloud sync: sign in/out + a live sync indicator. */
export function AuthControl() {
  const user = useStore((s) => s.user);
  const online = useStore((s) => s.online);
  const [busy, setBusy] = useState(false);

  // Cloud sync not configured for this deployment — stay silent (local-only).
  if (!firebaseReady) return null;

  async function handleSignIn() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      toast.error('Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <Button variant="secondary" size="sm" onClick={handleSignIn} disabled={busy}>
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Sign in</span>
      </Button>
    );
  }

  const initial = (user.name ?? user.email ?? '?').charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <span
        title={online ? 'Synced' : 'Offline — changes will sync when back online'}
        className={online ? 'text-good' : 'text-muted'}
      >
        {online ? (
          <Cloud className="h-4 w-4" />
        ) : (
          <CloudOff className="h-4 w-4" />
        )}
      </span>

      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          className="h-7 w-7 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
          {initial}
        </span>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => void signOutUser()}
        aria-label="Sign out"
        title="Sign out"
        className="h-9 w-9 px-0"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
