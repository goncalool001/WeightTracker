import { useState } from 'react';
import { CloudOff, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { firebaseReady } from '@/data/firebase';
import { authErrorMessage, signInWithGoogle, signOutUser } from '@/data/sync';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';

/**
 * Account row for the sidebar and the phone menu: sign in when signed out;
 * avatar, name, sync state and sign out when signed in. Renders a quiet
 * "this device only" line when the build has no cloud sync.
 */
export function AuthControl() {
  const t = useT();
  const user = useStore((s) => s.user);
  const online = useStore((s) => s.online);
  const [busy, setBusy] = useState(false);

  if (!firebaseReady) {
    return <p className="text-[13px] text-muted">{t.localOnly}</p>;
  }

  async function handleSignIn() {
    setBusy(true);
    try {
      // Popup path resolves with the user; the redirect path returns null
      // (navigates away) and confirms on the return load (see useSync).
      const signedIn = await signInWithGoogle();
      if (signedIn) toast.success(t.signedInAs(signedIn.displayName ?? signedIn.email ?? 'Google'));
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <Button size="sm" onClick={handleSignIn} disabled={busy} className="w-full justify-start">
        <LogIn className="h-4 w-4" aria-hidden="true" />
        {t.signIn}
      </Button>
    );
  }

  const who = user.name ?? user.email ?? 'Google';
  return (
    <div className="flex min-w-0 items-center gap-3">
      {user.photoURL ? (
        <img src={user.photoURL} alt="" className="h-8 w-8 shrink-0 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-active text-sm font-medium text-text">
          {who.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-text">{who}</p>
        <p className="flex items-center gap-1 text-[13px] text-muted">
          {!online && <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />}
          {online ? t.syncedMsg : t.offlineMsg}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void signOutUser()}
        aria-label={t.signOut}
        title={t.signOut}
        className="w-11 px-0 lg:w-9"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
