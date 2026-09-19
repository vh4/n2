/**
 * Authentication Service for N2 Japanese Mastery Studio.
 *
 * Implements:
 *  - Client-side SHA-256 password hashing with user salt via Web Crypto API.
 *  - Session storage management for active user login state.
 *  - Remote cloud synchronization with `/api/users` for multi-tenant accounts.
 *  - Multi-tenant data namespace isolation keys.
 */

const USERS_KEY = 'n2_users';
const SESSION_KEY = 'n2_session';

// Pre-seeded fallback user (Toni) available out-of-the-box
const DEFAULT_USERS = {
  'toni': {
    username: 'toni',
    displayName: 'Toni',
    hash: '5a149f1a695412b0fda6ed3d2d767697be34b532793b59338faf4b17c292c512',
    createdAt: '2026-09-19T10:00:00.000Z'
  }
};

/**
 * Computes a secure SHA-256 hash of a string using the native Web Crypto API.
 *
 * @param {string} text - Raw string to hash (password + username + salt).
 * @returns {Promise<string>} Hexadecimal digest string.
 */
export async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieves locally cached user accounts from localStorage.
 *
 * @returns {Record<string, object>} User accounts dictionary.
 */
export function getLocalUsers() {
  if (typeof window === 'undefined') return { ...DEFAULT_USERS };
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    return { ...DEFAULT_USERS, ...stored };
  } catch {
    return { ...DEFAULT_USERS };
  }
}

/**
 * Persists user accounts dictionary to browser localStorage.
 *
 * @param {Record<string, object>} users - Dictionary of accounts.
 * @returns {void}
 */
export function saveLocalUsers(users) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // Storage quota or private mode fallback
  }
}

/**
 * Queries the `/api/users` endpoint to find a user account stored on the server database.
 * Used when a user logs in on a new device where local localStorage does not yet have their credentials.
 *
 * @param {string} uid - Normalized username.
 * @returns {Promise<object|null>} The user account object or null if not found.
 */
export async function fetchUserFromCloud(uid) {
  try {
    const res = await fetch(`/api/users?username=${encodeURIComponent(uid)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.ok && data.user) {
      return data.user;
    }
  } catch (err) {
    console.warn('Could not reach cloud API for user account:', err);
  }
  return null;
}

/**
 * Sends a newly registered user account to the server API to be saved in `database/users.json`.
 *
 * @param {object} userObj - User account details { username, displayName, hash }.
 * @returns {Promise<void>}
 */
export async function syncUserToCloud(userObj) {
  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_user',
        username: userObj.username,
        displayName: userObj.displayName,
        hash: userObj.hash
      })
    });
  } catch (err) {
    console.warn('Cloud user sync offline, using local storage cache.');
  }
}

/**
 * Registers a new user account with client-side validation and hashing.
 * Checks both local storage and cloud database to prevent duplicate usernames.
 *
 * @param {string} username - Chosen username.
 * @param {string} password - Chosen password (must be at least 6 characters).
 * @returns {Promise<{ ok: boolean, user?: object, error?: string }>} Registration result.
 */
export async function registerUser(username, password) {
  const users = getLocalUsers();
  const uid = (username || '').toLowerCase().trim();
  const cleanPassword = (password || '').trim();

  if (!uid) return { ok: false, error: 'Username cannot be empty.' };
  if (uid.length < 3) return { ok: false, error: 'Username must be at least 3 characters.' };
  if (cleanPassword.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

  // Check local cache
  if (users[uid]) return { ok: false, error: 'Username already taken.' };

  // Check server database to prevent cross-device duplicate usernames
  const cloudUser = await fetchUserFromCloud(uid);
  if (cloudUser) return { ok: false, error: 'Username already taken on another device.' };

  const hash = await sha256(cleanPassword + uid + 'n2salt');
  const newUser = {
    username: uid,
    displayName: username.trim(),
    hash,
    createdAt: new Date().toISOString()
  };

  // Cache locally
  users[uid] = newUser;
  saveLocalUsers(users);

  // Sync to database asynchronously
  syncUserToCloud(newUser);

  return { ok: true, user: newUser };
}

/**
 * Authenticates a user by validating their password hash.
 * If user is not found locally, seamlessly checks the server database.
 *
 * @param {string} username - Input username.
 * @param {string} password - Input password.
 * @returns {Promise<{ ok: boolean, user?: object, error?: string }>} Login result with session.
 */
export async function loginUser(username, password) {
  const users = getLocalUsers();
  const uid = (username || '').toLowerCase().trim();
  const cleanPassword = (password || '').trim();

  let userRecord = users[uid];

  // If not found in local browser cache, check server database (e.g. Incognito / new device)
  if (!userRecord) {
    const cloudUser = await fetchUserFromCloud(uid);
    if (cloudUser) {
      userRecord = cloudUser;
      users[uid] = cloudUser;
      saveLocalUsers(users);
    }
  }

  if (!userRecord) {
    return { ok: false, error: 'User not found. Check username or register on this device.' };
  }

  const hash = await sha256(cleanPassword + uid + 'n2salt');
  if (hash !== userRecord.hash) {
    return { ok: false, error: 'Incorrect password.' };
  }

  const session = {
    uid,
    displayName: userRecord.displayName || uid,
    loginAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  return { ok: true, user: session };
}

/**
 * Logs out the active user by clearing the session token from sessionStorage.
 *
 * @returns {void}
 */
export function logoutUser() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Retrieves the currently active user session from browser sessionStorage.
 *
 * @returns {object|null} Active session object or null if not logged in.
 */
export function getSession() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

/**
 * Generates an isolated multi-tenant key for localStorage namespacing.
 *
 * @param {string} uid - User identifier.
 * @param {string} suffix - Sub-key type (e.g. 'state', 'settings').
 * @returns {string} Namespaced key string (e.g. 'n2_state_toni').
 */
export function userKey(uid, suffix) {
  return `n2_${suffix}_${uid}`;
}
