// ── Auth utilities ────────────────────────────────────────────────────────────
// Uses Web Crypto API (SHA-256) for password hashing.
// LocalStorage caching + Cloud Serverless API fallback for multi-tenant isolation & sync.

const USERS_KEY = 'n2_users';
const SESSION_KEY = 'n2_session';

// Pre-seeded global accounts guaranteed across all devices
const DEFAULT_USERS = {
  'toni': {
    username: 'toni',
    displayName: 'Toni',
    hash: '5a149f1a695412b0fda6ed3d2d767697be34b532793b59338faf4b17c292c512',
    createdAt: '2026-09-19T10:00:00.000Z'
  }
};

async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    return { ...DEFAULT_USERS, ...stored };
  } catch {
    return { ...DEFAULT_USERS };
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Sync user account credentials to cloud
async function syncUserToCloud(userObj) {
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
    console.warn('Cloud sync offline, using local storage cache.');
  }
}

// Sync user isolated state (favorites, progress) to cloud
export async function syncStateToCloud(uid, stateData) {
  if (!uid) return;
  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_state',
        username: uid,
        stateData
      })
    });
  } catch (err) {
    console.warn('Cloud state sync offline.');
  }
}

// Fetch user isolated state (favorites, progress) from cloud
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
    console.warn('Could not fetch state from cloud:', err);
  }
  return null;
}

// Fetch user account from cloud serverless endpoint if not in localStorage
async function fetchUserFromCloud(uid) {
  try {
    const res = await fetch(`/api/users?username=${encodeURIComponent(uid)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.ok && data.user) {
      return data.user;
    }
  } catch (err) {
    console.warn('Could not reach cloud API:', err);
  }
  return null;
}

export async function registerUser(username, password) {
  const users = getUsers();
  const uid = (username || '').toLowerCase().trim();
  const cleanPassword = (password || '').trim();

  if (!uid) return { ok: false, error: 'Username cannot be empty.' };
  if (uid.length < 3) return { ok: false, error: 'Username must be at least 3 characters.' };
  
  // Check local first
  if (users[uid]) return { ok: false, error: 'Username already taken.' };
  
  // Check cloud to prevent duplicate usernames across devices
  const cloudUser = await fetchUserFromCloud(uid);
  if (cloudUser) return { ok: false, error: 'Username already taken on another device.' };

  if (cleanPassword.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
  
  const hash = await sha256(cleanPassword + uid + 'n2salt');
  const newUser = { username: uid, displayName: username.trim(), hash, createdAt: new Date().toISOString() };
  
  // Save locally
  users[uid] = newUser;
  saveUsers(users);
  
  // Sync to cloud asynchronously
  syncUserToCloud(newUser);
  
  return { ok: true, user: newUser };
}

export async function loginUser(username, password) {
  let users = getUsers();
  const uid = (username || '').toLowerCase().trim();
  const cleanPassword = (password || '').trim();
  
  let userRecord = users[uid];
  
  // If user not found in local localStorage, search cloud API
  if (!userRecord) {
    const cloudUser = await fetchUserFromCloud(uid);
    if (cloudUser) {
      userRecord = cloudUser;
      // Cache user locally on this device
      users[uid] = cloudUser;
      saveUsers(users);
    }
  }

  if (!userRecord) return { ok: false, error: 'User not found. Check username or register on this device.' };
  
  const hash = await sha256(cleanPassword + uid + 'n2salt');
  if (hash !== userRecord.hash) return { ok: false, error: 'Incorrect password.' };
  
  const session = { uid, displayName: userRecord.displayName || uid, loginAt: new Date().toISOString() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, user: session };
}

export function logoutUser() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}

// Per-user data keys (isolated tenant namespaces)
export const userKey = (uid, suffix) => `n2_${suffix}_${uid}`;
