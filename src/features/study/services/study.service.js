/**
 * Study State & Synchronization Service.
 *
 * Facilitates real-time persistence of card ratings (mastered, review/again)
 * and favorites across all 3 modules (Grammar Bunpou, Kosakata N2, Kanji N2).
 * Interacts with the Next.js `/api/users` backend endpoint.
 */

/**
 * Synchronizes a user's learning state to the database via `/api/users`.
 * Supports smart delta payload so single-card updates do not overwrite other cards.
 *
 * @param {string} uid - Username of the tenant.
 * @param {object} stateData - Full active state dictionary.
 * @param {{ key: string, item: object }|null} [delta=null] - Specific card update delta.
 * @returns {Promise<object|null>} The updated state returned by the database or null.
 */
export async function syncStateToCloud(uid, stateData, delta = null) {
  if (!uid) return null;
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_state',
        username: uid,
        stateData,
        delta
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data?.stateData || null;
    }
  } catch (err) {
    console.warn('Cloud state sync offline, operating in local cache mode.');
  }
  return null;
}

/**
 * Fetches the user's saved learning state from the database via `/api/users`.
 * Called upon login, page mount, or focus to ensure cross-device consistency.
 *
 * @param {string} uid - Username of the tenant.
 * @returns {Promise<Record<string, object>|null>} Saved card states or null.
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
