/**
 * Development seed switch. Only the dev server reads it: `?seed` (or
 * `?seed=maintain`) loads the 133 weigh-ins with a maintain goal,
 * `?seed=lose` with a 75 kg goal still ahead, and `?seed=gain` with a goal
 * to gain back to 78 kg.
 *
 * In a production build `import.meta.env.DEV` is the literal `false`, so this
 * is always null there, the seed module is never imported, and sync and the
 * signed-out clearing behave exactly as before.
 */
export type DevSeed = 'maintain' | 'lose' | 'gain' | null;

function read(): DevSeed {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.has('seed')) return null;
  const v = params.get('seed');
  return v === 'lose' || v === 'reach' ? 'lose' : v === 'gain' ? 'gain' : 'maintain';
}

export const DEV_SEED: DevSeed = read();
