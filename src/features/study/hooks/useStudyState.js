import { useState, useEffect, useCallback, useRef } from 'react';
import { userKey } from '../../auth/services/auth.service';
import { syncStateToCloud, fetchStateFromCloud } from '../services/study.service';

/**
 * Custom React hook for managing user learning state with strict multi-tenant isolation
 * and real-time cross-device persistence.
 *
 * Responsibilities:
 *  1. Manages card ratings (mastered, need review) and favorites across Grammar (`g_*`),
 *     Vocab (`v_*`), and Kanji (`k_*`).
 *  2. Persists changes immediately to localStorage for zero-latency UI responsiveness.
 *  3. Syncs updates to the database via smart delta merging (`{ key, item }`), preventing
 *     partial state or Incognito sessions from accidentally wiping existing cards.
 *  4. Provides periodic background polling (every 15s) and tab focus/visibility synchronization
 *     so that updates from another device appear seamlessly on page refresh or tab switch.
 *
 * @param {object|null} session - Active user session containing `session.uid`.
 * @returns {object} { state, setItemState, cloudSync, isLoaded }
 */
export function useStudyState(session) {
  const uid = session?.uid || null;
  const stateKey = uid ? userKey(uid, 'state') : 'n2State_guest';

  // Local storage state initialization (instant, SSR-safe)
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(stateKey) || '{}');
    } catch {
      return {};
    }
  });

  // Cloud sync indicator: 'idle' | 'saving' | 'saved' | 'error'
  const [cloudSync, setCloudSync] = useState('idle');
  const [isLoaded, setIsLoaded] = useState(false);
  const syncStatusTimer = useRef(null);

  /**
   * Fetches the latest database state when user logs in or stateKey changes.
   * Merges server cards into local state without ever wiping existing records.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const cached = JSON.parse(localStorage.getItem(stateKey) || '{}');
      setState(cached);
    } catch {
      setState({});
    }

    if (uid) {
      fetchStateFromCloud(uid).then((cloudState) => {
        if (cloudState && typeof cloudState === 'object' && !Array.isArray(cloudState)) {
          setState((prev) => {
            const merged = { ...prev, ...cloudState };
            try {
              localStorage.setItem(stateKey, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
        setIsLoaded(true);
      });
    } else {
      setIsLoaded(true);
    }
  }, [stateKey, uid]);

  /**
   * Updates or deletes a single card's state (rating or favorite).
   *
   * @param {'g'|'v'|'k'} type - Module identifier ('g' for Grammar, 'v' for Vocab, 'k' for Kanji).
   * @param {number} index - Zero-based index of the card within its dataset.
   * @param {{ status?: 'mastered'|'again'|'new', fav?: boolean }} update - Changes to apply.
   */
  const setItemState = useCallback((type, index, update) => {
    setState((prev) => {
      const key = `${type}_${index}`;
      const newItemState = { ...(prev[key] || { status: 'new', fav: false }), ...update };

      let newFullState;
      if (newItemState.status === 'new' && !newItemState.fav) {
        newFullState = { ...prev };
        delete newFullState[key];
      } else {
        newFullState = { ...prev, [key]: newItemState };
      }

      // 1. Persist immediately to localStorage
      try {
        localStorage.setItem(stateKey, JSON.stringify(newFullState));
      } catch {}

      // 2. Sync to cloud database with explicit delta
      if (uid) {
        if (syncStatusTimer.current) clearTimeout(syncStatusTimer.current);
        setCloudSync('saving');

        syncStateToCloud(uid, newFullState, { key, item: newItemState })
          .then(() => {
            setCloudSync('saved');
            syncStatusTimer.current = setTimeout(() => setCloudSync('idle'), 2500);
          })
          .catch(() => {
            setCloudSync('error');
            syncStatusTimer.current = setTimeout(() => setCloudSync('idle'), 3000);
          });
      }

      return newFullState;
    });
  }, [stateKey, uid]);

  /**
   * Background Synchronization:
   * Polls every 15 seconds and re-fetches whenever the user refocuses the browser window
   * or changes tab visibility back to active.
   */
  useEffect(() => {
    if (!uid || typeof window === 'undefined') return;

    const syncFromCloud = async () => {
      try {
        const cloudState = await fetchStateFromCloud(uid);
        if (cloudState && typeof cloudState === 'object' && !Array.isArray(cloudState)) {
          setState((prev) => {
            const hasDiff = JSON.stringify(prev) !== JSON.stringify(cloudState);
            if (!hasDiff) return prev;
            try {
              localStorage.setItem(stateKey, JSON.stringify(cloudState));
            } catch {}
            return cloudState;
          });
        }
      } catch {}
    };

    const interval = setInterval(syncFromCloud, 15000);
    const onFocus = () => { syncFromCloud(); };
    window.addEventListener('focus', onFocus);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncFromCloud();
    };
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
