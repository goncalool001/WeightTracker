import { get, set } from 'idb-keyval';
import { STORAGE_KEY } from '@/lib/constants';
import type { PersistedState } from '@/types';

/**
 * Durable local persistence via IndexedDB. The whole serialisable state slice
 * is stored under a single versioned key — simple, atomic, and easily migrated.
 */

/** Read the saved state. Throws when storage cannot be read at all. */
export async function loadState(): Promise<PersistedState | undefined> {
  return await get<PersistedState>(STORAGE_KEY);
}

export async function saveState(state: PersistedState): Promise<void> {
  try {
    await set(STORAGE_KEY, state);
  } catch {
    // Storage may be unavailable (private mode, quota). The app stays usable
    // in-memory; we simply don't persist.
  }
}
