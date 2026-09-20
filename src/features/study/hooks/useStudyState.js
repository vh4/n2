import { useState, useEffect, useCallback, useRef } from 'react';
import { userKey } from '../../auth/services/auth.service';
import { syncStateToCloud, fetchStateFromCloud } from '../services/study.service';

/**
 * Custom React hook for managing user learning state with strict multi-tenant isolation
 * and real-time cross-device persistence.
 *
 * Architecture — Single Source of Truth:
 *  - Cloud database (`database/user_states.json`) is the authoritative source of truth.
 *  - localStorage is used ONLY as a UI cache for instant rendering before cloud data arrives.
 *  - Cloud data always wins on initial load and background refresh.
 *
 * Responsibilities:
 *  1. Manages card ratings (mastered, need review) and favorites across Grammar (`g_*`),
 *     Vocab (`v_*`), and Kanji (`k_*`).
 *  2. Persists changes optimistically to localStorage for zero-latency UI responsiveness.
 *  3. Syncs each update to the database via smart delta merging (single key at a time),
 *     preventing partial state or Incognito sessions from wiping existing cards.
 *  4. Tracks in-flight (pending) updates so background 15s polling never overwrites
 *     a local optimistic change that hasn't been confirmed by the server yet.
 *  5. Provides periodic background polling (every 15s) and tab focus/visibility sync
 *     so updates from another device appear seamlessly on page refresh or tab switch.
 *
 * @param {object|null} session - Active user session containing `session.uid`.
 * @returns {{ state: object, setItemState: Function, cloudSync: string, isLoaded: boolean }}
 */
export function useStudyState(session) {
  const uid = session?.uid || null;
  const stateKey = uid ? userKey(uid, 'state') : 'n2State_guest';

  // --- State ---

  /**
   * Local rendering state — starts with localStorage cache for instant display.
   * Will be overwritten by cloud data as soon as the initial fetch completes.
   */
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(stateKey) || '{}');
    } catch {
      return {};
    }
  });

  // Cloud sync status indicator: 'idle' | 'saving' | 'saved' | 'error'
  const [cloudSync, setCloudSync] = useState('idle');

  // True once the first cloud fetch completes — workspaces wait for this before rendering filters
  const [isLoaded, setIsLoaded] = useState(false);

  // Timer ref for auto-clearing cloudSync status badge
  const syncStatusTimer = useRef(null);

  /**
   * Set of card keys currently being saved to the cloud (in-flight).
   * Background sync must NOT overwrite these keys — they are optimistic local changes
   * that have not yet been confirmed by the server.
   *
   * Example: user clicks "Dikuasai" on g_5 → 'g_5' is added here.
   * When the server responds, 'g_5' is removed from this set.
   */
  const pendingKeys = useRef(new Set());

  // --- Initial Fetch: Cloud data wins over localStorage cache ---

  /**
   * On mount or session change:
   *  1. Immediately render the localStorage cache (already in useState init).
   *  2. Fetch authoritative cloud state.
   *  3. Cloud state completely replaces local state (cloud = source of truth).
   *  4. Result is written back to localStorage as the new cache.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!uid) {
      // Guest mode — reset to empty and mark as loaded
      setState({});
      setIsLoaded(true);
      return;
    }

    fetchStateFromCloud(uid).then((cloudState) => {
      if (cloudState && typeof cloudState === 'object' && !Array.isArray(cloudState)) {
        setState((prev) => {
          // Cloud data wins for all keys NOT currently pending (in-flight) local changes.
          // This ensures: cross-device sync works AND in-flight clicks are not reverted.
          const safeCloud = { ...cloudState };
          for (const key of pendingKeys.current) {
            // Preserve any local optimistic value for keys still being saved
            if (prev[key] !== undefined) {
              safeCloud[key] = prev[key];
            } else {
              delete safeCloud[key];
            }
          }
          try {
            localStorage.setItem(stateKey, JSON.stringify(safeCloud));
          } catch {}
          return safeCloud;
        });
      }
      setIsLoaded(true);
    }).catch(() => {
      // Network failure — fall back to localStorage cache
      setIsLoaded(true);
    });
  }, [stateKey, uid]);

  // --- State Mutator: Optimistic Update + Cloud Sync ---

  /**
   * Updates or deletes a single card's state (rating or favorite toggle).
   *
   * Flow:
   *  1. Apply optimistic update to local state immediately (instant UI).
   *  2. Add the card key to `pendingKeys` so background sync won't revert it.
   *  3. Sync the delta to the cloud database.
   *  4. On success: remove from `pendingKeys` (cloud now authoritative for this key).
   *  5. On failure: remove from `pendingKeys` and show error status.
   *
   * @param {'g'|'v'|'k'} type - Module identifier ('g'=Grammar, 'v'=Vocab, 'k'=Kanji).
   * @param {number} index - Zero-based index of the card within its dataset.
   * @param {{ status?: 'mastered'|'again'|'new', fav?: boolean }} update - Changes to apply.
   */
  const setItemState = useCallback((type, index, update) => {
    const key = `${type}_${index}`;

    setState((prev) => {
      const currentItem = prev[key] || { status: 'new', fav: false };
      const newItemState = { ...currentItem, ...update };

      let newFullState;
      if (newItemState.status === 'new' && !newItemState.fav) {
        // Card reset to default unrated + no favorite: remove from state entirely
        newFullState = { ...prev };
        delete newFullState[key];
      } else {
        newFullState = { ...prev, [key]: newItemState };
      }

      // 1. Write to localStorage cache immediately
      try {
        localStorage.setItem(stateKey, JSON.stringify(newFullState));
      } catch {}

      // 2. Mark this key as in-flight so background sync won't revert it
      pendingKeys.current.add(key);

      // 3. Sync only the delta to cloud (NOT the full state)
      if (uid) {
        if (syncStatusTimer.current) clearTimeout(syncStatusTimer.current);
        setCloudSync('saving');

        syncStateToCloud(uid, null, { key, item: newItemState })
          .then(() => {
            // 4. Cloud confirmed — remove from pending set
            pendingKeys.current.delete(key);
            setCloudSync('saved');
            syncStatusTimer.current = setTimeout(() => setCloudSync('idle'), 2500);
          })
          .catch(() => {
            // 5. Failed — remove from pending so next background sync can correct it
            pendingKeys.current.delete(key);
            setCloudSync('error');
            syncStatusTimer.current = setTimeout(() => setCloudSync('idle'), 3000);
          });
      }

      return newFullState;
    });
  }, [stateKey, uid]);

  // --- Background Synchronization: Periodic Polling + Focus/Visibility ---

  /**
   * Polls every 15 seconds and re-fetches on tab focus/visibility.
   *
   * Critical rule: NEVER overwrite keys in `pendingKeys` — these are optimistic
   * local changes not yet confirmed by the server. Overwriting them would cause
   * the UI to flash back to the previous status (the "revert bug").
   */
  useEffect(() => {
    if (!uid || typeof window === 'undefined') return;

    const syncFromCloud = async () => {
      try {
        const cloudState = await fetchStateFromCloud(uid);
        if (cloudState && typeof cloudState === 'object' && !Array.isArray(cloudState)) {
          setState((prev) => {
            // Merge cloud into current state, but PROTECT all pending keys
            const merged = { ...cloudState };
            for (const key of pendingKeys.current) {
              if (prev[key] !== undefined) {
                merged[key] = prev[key]; // Keep local optimistic value
              } else {
                delete merged[key]; // Preserve deletion intent
              }
            }

            // Skip re-render if nothing actually changed
            const hasChanged = JSON.stringify(prev) !== JSON.stringify(merged);
            if (!hasChanged) return prev;

            try {
              localStorage.setItem(stateKey, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch {
        // Network failure during background sync — silently ignore
      }
    };

    const interval = setInterval(syncFromCloud, 15000);
    const onFocus = () => syncFromCloud();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncFromCloud();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [uid, stateKey]);

  return {
    state,
    setItemState,
    cloudSync,
    isLoaded
  };
}
