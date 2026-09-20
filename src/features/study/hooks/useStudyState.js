import { useState, useEffect, useCallback, useRef } from 'react';
import { syncStateToCloud, fetchStateFromCloud } from '../services/study.service';

/**
 * Custom React hook for managing user learning state with strict multi-tenant isolation
 * and direct Supabase database persistence.
 *
 * Architecture — Pure Cloud Single Source of Truth:
 *  - Supabase database (`public.user_states`) is the SOLE authoritative store.
 *  - ZERO reliance on localStorage for learning cards (dikuasai, belum ingat, favorit).
 *  - Optimistic in-memory state for instant UI responsiveness without storage lag.
 *
 * Responsibilities:
 *  1. Manages card ratings (mastered, need review) and favorites across Grammar (`g_*`),
 *     Vocab (`v_*`), and Kanji (`k_*`).
 *  2. Syncs each update immediately to Supabase via smart delta merging (`{ key, item }`).
 *  3. Tracks in-flight (`pendingKeys`) updates so background 15s polling never overwrites
 *     an active optimistic change before the server confirms it.
 *  4. Provides periodic background polling (every 15s) and tab focus/visibility synchronization
 *     so changes made on another device appear seamlessly.
 *
 * @param {object|null} session - Active user session containing `session.uid`.
 * @returns {{ state: object, setItemState: Function, cloudSync: string, isLoaded: boolean }}
 */
export function useStudyState(session) {
  const uid = session?.uid || null;

  // Pure in-memory state — authoritative source of truth is Supabase
  const [state, setState] = useState({});

  // Cloud sync status indicator: 'idle' | 'saving' | 'saved' | 'error'
  const [cloudSync, setCloudSync] = useState('idle');

  // True once the initial Supabase state fetch completes
  const [isLoaded, setIsLoaded] = useState(false);

  // Timer ref for resetting the sync status badge
  const syncStatusTimer = useRef(null);

  /**
   * Set of card keys currently in-flight to Supabase.
   * Protects active optimistic updates from being reverted by background polling.
   */
  const pendingKeys = useRef(new Set());

  // --- Initial Fetch from Supabase ---

  useEffect(() => {
    if (!uid) {
      setState({});
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);

    fetchStateFromCloud(uid)
      .then((cloudState) => {
        if (cloudState && typeof cloudState === 'object' && !Array.isArray(cloudState)) {
          setState((prev) => {
            // Apply cloud state, preserving any local in-flight keys
            const merged = { ...cloudState };
            for (const key of pendingKeys.current) {
              if (prev[key] !== undefined) {
                merged[key] = prev[key];
              } else {
                delete merged[key];
              }
            }
            return merged;
          });
        }
        setIsLoaded(true);
      })
      .catch((err) => {
        console.warn('Initial Supabase fetch error:', err);
        setIsLoaded(true);
      });
  }, [uid]);

  // --- State Mutator: Optimistic Update + Supabase Delta Sync ---

  /**
   * Updates or deletes a card's state (rating or favorite) directly in Supabase.
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
        newFullState = { ...prev };
        delete newFullState[key];
      } else {
        newFullState = { ...prev, [key]: newItemState };
      }

      // Mark key as in-flight
      pendingKeys.current.add(key);

      // Sync delta directly to Supabase via API
      if (uid) {
        if (syncStatusTimer.current) clearTimeout(syncStatusTimer.current);
        setCloudSync('saving');

        syncStateToCloud(uid, null, { key, item: newItemState })
          .then(() => {
            pendingKeys.current.delete(key);
            setCloudSync('saved');
            syncStatusTimer.current = setTimeout(() => setCloudSync('idle'), 2500);
          })
          .catch((err) => {
            console.error('Supabase sync error for card:', key, err);
            pendingKeys.current.delete(key);
            setCloudSync('error');
            syncStatusTimer.current = setTimeout(() => setCloudSync('idle'), 3000);
          });
      }

      return newFullState;
    });
  }, [uid]);

  // --- Background Sync with Supabase (Polling + Window Focus) ---

  useEffect(() => {
    if (!uid || typeof window === 'undefined') return;

    const syncFromSupabase = async () => {
      try {
        const cloudState = await fetchStateFromCloud(uid);
        if (cloudState && typeof cloudState === 'object' && !Array.isArray(cloudState)) {
          setState((prev) => {
            const merged = { ...cloudState };
            for (const key of pendingKeys.current) {
              if (prev[key] !== undefined) {
                merged[key] = prev[key];
              } else {
                delete merged[key];
              }
            }

            // Avoid unnecessary re-renders if state hasn't changed
            const hasChanged = JSON.stringify(prev) !== JSON.stringify(merged);
            if (!hasChanged) return prev;

            return merged;
          });
        }
      } catch {
        // Silently ignore network hiccup during background polling
      }
    };

    const interval = setInterval(syncFromSupabase, 15000);
    const onFocus = () => syncFromSupabase();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncFromSupabase();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [uid]);

  return {
    state,
    setItemState,
    cloudSync,
    isLoaded
  };
}
