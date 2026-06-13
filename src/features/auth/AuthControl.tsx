import { useState } from 'react';
import { Cloud, CloudOff, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { firebaseReady } from '@/data/firebase';
import { authErrorMessage, signInWithGoogle, signOutUser } from '@/data/sync';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';

/** Header control for cloud sync: sign in/out + a live sync indicator. */
export function AuthControl() {
  const t = useT();
  const user = useStore((s) => s.user);
  const online = useStore((s) => s.online);
  const [busy, setBusy] = useState(false);

  if (!firebaseReady) return null;

  async function handleSignIn() {
    setBusy(true);
    try {
      // signInWithGoogle navigates away on success; setBusy(false) only on error.
      await signInWithGoogle();
    } catch (err) {
      // Surface the real Firebase cause (also logged to the console).
      toast.error(authErrorMessage(err));
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <Button variant="secondary" size="sm" onClick={handleSignIn} disabled={busy}>
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">{t.signIn}</span>
      </Button>
    );
  }

  const initial = (user.name ?? user.email ?? '?').charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <span
        title={online ? t.syncedMsg : t.offlineMsg}
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
        aria-label={t.signOut}
        title={t.signOut}
        className="h-9 w-9 px-0"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
