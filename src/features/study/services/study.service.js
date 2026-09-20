/**
 * Study State & Synchronization Service.
 *
 * Facilitates real-time persistence of card ratings (mastered, review/again)
 * and favorites across all 3 modules (Grammar Bunpou, Kosakata N2, Kanji N2).
 * Interacts with the Next.js `/api/users` backend endpoint.
 *
 * Architecture:
 *  - Cloud database (`database/user_states.json`) is always the source of truth.
 *  - All writes use smart delta merging: only the changed card key is transmitted.
 *  - Reads return the full user partition for the requesting tenant only.
 */

/**
 * Synchronizes a single card's state to the database via delta update.
 * When `delta` is provided, the full `stateData` is intentionally omitted
 * to prevent any stale client-side state from accidentally overwriting server data.
 *
 * @param {string} uid - Username of the tenant.
 * @param {object|null} stateData - Full state dict — only used when no delta is provided (legacy/bulk).
 * @param {{ key: string, item: object }|null} [delta=null] - Single card update delta (preferred).
 * @returns {Promise<object|null>} The updated state returned by the database or null.
 */
export async function syncStateToCloud(uid, stateData, delta = null) {
  if (!uid) return null;
  try {
    // When a delta is provided, send ONLY the delta — never the full state.
    // This prevents stale localStorage data from overwriting the authoritative server state.
    const payload = delta
      ? { action: 'save_state', username: uid, delta }
      : { action: 'save_state', username: uid, stateData };

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      return data?.stateData || null;
    }
  } catch {
    console.warn('Cloud state sync offline, operating in local cache mode.');
  }
  return null;
}

/**
 * Fetches the user's saved learning state from the database via `/api/users`.
 * Called upon login, page mount, or focus to ensure cross-device consistency.
 * The returned data is the authoritative server state and should take precedence
 * over any cached localStorage data.
 *
 * @param {string} uid - Username of the tenant.
 * @returns {Promise<Record<string, object>|null>} Saved card states or null on failure.
 */
export async function fetchStateFromCloud(uid) {
  if (!uid) return null;
  try {
    const res = await fetch(`/api/users?username=${encodeURIComponent(uid)}&action=get_state`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.ok && data.stateData) {
      return data.stateData;
    }
  } catch (err) {
    console.warn('Could not fetch state from database API:', err);
  }
  return null;
}

/**
 * Fetches the user's dedicated favorites list from the database via `/api/users`.
 *
 * @param {string} uid - Username of the tenant.
 * @returns {Promise<Record<string, object>|null>} Favorite items or null.
 */
export async function fetchFavoritesFromCloud(uid) {
  if (!uid) return null;
  try {
    const res = await fetch(`/api/users?username=${encodeURIComponent(uid)}&action=get_favorites`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.ok && data.favorites) {
      return data.favorites;
    }
  } catch (err) {
    console.warn('Could not fetch favorites from database API:', err);
  }
  return null;
}
