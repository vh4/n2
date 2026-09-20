/**
 * Authentication Service for N2 Japanese Mastery Studio.
 *
 * Implements:
 *  - Defensive username normalization preventing "toLowerCase is not a function" exceptions.
 *  - Client-side SHA-256 password hashing with user salt via Web Crypto API.
 *  - Session storage and cookie management for active user login state.
 *  - Remote cloud synchronization with `/api/users` for multi-tenant accounts.
 *  - Multi-tenant data namespace isolation keys.
 */

const USERS_KEY = 'n2_users';
const SESSION_KEY = 'n2_session';
export const COOKIE_SESSION_KEY = 'n2_session_user';

// In-memory fallback cache when running outside browser window (e.g. Node tests)
let memoryUsers = {};

// Pre-seeded fallback user (Toni) available out-of-the-box (password: "password")
const DEFAULT_USERS = {
  'toni': {
    username: 'toni',
    displayName: 'Toni',
    hash: 'f1d360ed2e6c0ae9b2df90ecbcf18aa87e36162278aa327c6ff3042095f32f0b',
    createdAt: '2026-09-19T10:00:00.000Z'
  }
};

/**
 * Safely normalizes and extracts a lowercase trimmed username string from any input type.
 * Handles strings, user objects ({ username, uid, displayName }), numbers, null, or undefined.
 * Prevents "toLowerCase is not a function" exceptions.
 *
 * @param {any} input - Input value to normalize.
 * @returns {string} Clean, trimmed lowercase username.
 */
export function normalizeUsername(input) {
  if (!input) return '';
  if (typeof input === 'string') return input.trim().toLowerCase();
  if (typeof input === 'object') {
    const raw = input.username || input.uid || input.displayName || '';
    return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  }
  return String(input).trim().toLowerCase();
}

/**
 * Sets the session cookie for Next.js middleware and server-side route guards.
 *
 * @param {string} uid - Username / user identifier.
 */
export function setSessionCookie(uid) {
  if (typeof document === 'undefined') return;
  const cleanUid = normalizeUsername(uid);
  if (!cleanUid) return;
  document.cookie = `${COOKIE_SESSION_KEY}=${encodeURIComponent(cleanUid)}; path=/; max-age=2592000; SameSite=Lax`;
}

/**
 * Extracts the session user ID from document cookies if present.
 *
 * @returns {string} Username or empty string if not found.
 */
export function getSessionCookie() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_SESSION_KEY}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Clears the session cookie on logout.
 */
export function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_SESSION_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Computes a secure SHA-256 hash of a string using native Web Crypto API.
 * Compatible with modern browsers, Edge runtime, and Node 20+.
 *
 * @param {string} text - Raw string to hash (password + username + salt).
 * @returns {Promise<string>} Hexadecimal digest string.
 */
export async function sha256(text) {
  const subtle = typeof crypto !== 'undefined' && crypto.subtle ? crypto.subtle : globalThis?.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API subtle is not supported in this runtime.');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieves cached user accounts dictionary.
 *
 * @returns {Record<string, object>} User accounts dictionary.
 */
export function getLocalUsers() {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_USERS, ...memoryUsers };
  }
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    return { ...DEFAULT_USERS, ...stored };
  } catch {
    return { ...DEFAULT_USERS };
  }
}

/**
 * Persists user accounts dictionary to storage cache.
 *
 * @param {Record<string, object>} users - Dictionary of accounts.
 * @returns {void}
 */
export function saveLocalUsers(users) {
  if (typeof window === 'undefined') {
    memoryUsers = { ...users };
    return;
  }
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // Storage quota or private mode fallback
  }
}

/**
 * Queries the user account from the cloud API.
 * Used on new devices / incognito windows where local storage is clean.
 *
 * @param {string} uid - Normalized username.
 * @returns {Promise<object|null>} The user account object or null if not found.
 */
export async function fetchUserFromCloud(uid) {
  if (typeof window === 'undefined') {
    return null;
  }

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
 * Sends a newly registered user account to be saved in server database.
 *
 * @param {object} userObj - User account details { username, displayName, hash }.
 * @returns {Promise<void>}
 */
export async function syncUserToCloud(userObj) {
  if (typeof window === 'undefined') {
    return;
  }

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
 * @param {string|object} username - Chosen username or credentials object.
 * @param {string} [password] - Chosen password (must be at least 6 characters).
 * @returns {Promise<{ ok: boolean, user?: object, error?: string }>} Registration result.
 */
export async function registerUser(username, password) {
  let cleanUsername = username;
  let cleanPassword = password;

  if (typeof username === 'object' && username !== null) {
    cleanUsername = username.username || username.uid;
    cleanPassword = password || username.password;
  }

  const uid = normalizeUsername(cleanUsername);
  const pass = typeof cleanPassword === 'string' ? cleanPassword.trim() : String(cleanPassword || '').trim();

  if (!uid) return { ok: false, error: 'Username cannot be empty.' };
  if (uid.length < 3) return { ok: false, error: 'Username must be at least 3 characters.' };
  if (pass.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

  const users = getLocalUsers();

  // Check local cache
  if (users[uid]) return { ok: false, error: 'Username already taken.' };

  // Check server database to prevent cross-device duplicate usernames
  const cloudUser = await fetchUserFromCloud(uid);
  if (cloudUser) return { ok: false, error: 'Username already taken on another device.' };

  const hash = await sha256(pass + uid + 'n2salt');
  const newUser = {
    username: uid,
    displayName: typeof cleanUsername === 'string' && cleanUsername.trim() ? cleanUsername.trim() : uid,
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
 * Supports direct session adoption if an existing session object is passed.
 *
 * @param {string|object} username - Input username, credentials object, or existing session object.
 * @param {string} [password] - Input password.
 * @returns {Promise<{ ok: boolean, user?: object, error?: string }>} Login result with session.
 */
export async function loginUser(username, password) {
  // If already a valid session object with uid and no password provided, adopt it directly
  if (typeof username === 'object' && username !== null && (username.uid || username.username) && !password && !username.password) {
    const sessionUid = normalizeUsername(username);
    if (sessionUid) {
      const session = {
        uid: sessionUid,
        displayName: username.displayName || sessionUid,
        loginAt: username.loginAt || new Date().toISOString()
      };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
      setSessionCookie(sessionUid);
      return { ok: true, user: session };
    }
  }

  let cleanUsername = username;
  let cleanPassword = password;

  if (typeof username === 'object' && username !== null) {
    cleanUsername = username.username || username.uid;
    cleanPassword = password || username.password;
  }

  const users = getLocalUsers();
  const uid = normalizeUsername(cleanUsername);
  const pass = typeof cleanPassword === 'string' ? cleanPassword.trim() : String(cleanPassword || '').trim();

  if (!uid || !pass) {
    return { ok: false, error: 'Username and password cannot be empty.' };
  }

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

  const hash = await sha256(pass + uid + 'n2salt');
  if (hash !== userRecord.hash) {
    return { ok: false, error: 'Incorrect password.' };
  }

  const session = {
    uid,
    displayName: userRecord.displayName || uid,
    loginAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
  }
  setSessionCookie(uid);

  return { ok: true, user: session };
}

/**
 * Logs out the active user by clearing the session token from sessionStorage, localStorage, and cookie.
 *
 * @returns {void}
 */
export function logoutUser() {
  if (typeof window !== 'undefined') {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  }
  clearSessionCookie();
}

/**
 * Retrieves the currently active user session from browser storage or active session cookie.
 * Robust fallback checks sessionStorage -> localStorage -> cookie session identifier.
 *
 * @returns {object|null} Active session object or null if not logged in.
 */
export function getSession() {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check primary sessionStorage (active tab session)
    const fromSession = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (fromSession && fromSession.uid) {
      setSessionCookie(fromSession.uid);
      return fromSession;
    }

    // 2. Fallback to localStorage (survives tab close, window navigation, and refresh)
    const fromLocal = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (fromLocal && fromLocal.uid) {
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(fromLocal)); } catch {}
      setSessionCookie(fromLocal.uid);
      return fromLocal;
    }

    // 3. Fallback to cookie session (matches server-side route middleware)
    const cookieUid = getSessionCookie();
    if (cookieUid) {
      const users = getLocalUsers();
      const user = users[cookieUid] || { username: cookieUid, displayName: cookieUid };
      const restored = {
        uid: cookieUid,
        displayName: user.displayName || cookieUid,
        loginAt: new Date().toISOString()
      };
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(restored)); } catch {}
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(restored)); } catch {}
      return restored;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Generates an isolated multi-tenant key for localStorage namespacing.
 *
 * @param {string} uid - User identifier.
 * @param {string} suffix - Sub-key type (e.g. 'state', 'settings').
 * @returns {string} Namespaced key string (e.g. 'n2_state_toni').
 */
export function userKey(uid, suffix) {
  return `n2_${suffix}_${normalizeUsername(uid)}`;
}
