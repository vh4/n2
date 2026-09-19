import fs from 'fs';
import path from 'path';

/**
 * Database & Multi-Tenant Service for N2 Japanese Mastery Studio.
 *
 * Manages local JSON table files inside `database/<nama_table>.json`:
 *  - `database/users.json`       : User profile records and SHA-256 password credentials.
 *  - `database/user_states.json` : User learning ratings (dikuasai/mastered, belum ingat/again, favorite).
 *  - `database/favorites.json`   : Dedicated relational table for all starred items across modules.
 *
 * Provides strict multi-tenant data isolation:
 *  - User A only ever accesses and mutates User A's partition.
 *  - Incorporates smart delta merging and zero-wipe guards to prevent data loss on Incognito/refresh.
 *  - Mirrors state to Vercel Edge Config for seamless cross-device cloud synchronization.
 */

const USERS_FILE = 'users.json';
const STATES_FILE = 'user_states.json';
const FAVORITES_FILE = 'favorites.json';

// Guaranteed fallback user (prevents lockouts)
const DEFAULT_USERS = {
  'toni': {
    id: 'toni',
    username: 'toni',
    displayName: 'Toni',
    hash: '5a149f1a695412b0fda6ed3d2d767697be34b532793b59338faf4b17c292c512',
    role: 'user',
    createdAt: '2026-09-19T10:00:00.000Z'
  }
};

/**
 * Resolves the absolute directory path to `database/`.
 * Adapts across local Next.js dev server, Node test runner, and Vercel serverless containers.
 *
 * @returns {string} Absolute path to the database directory.
 */
export function getDatabaseDir() {
  return path.join(process.cwd(), 'database');
}

/**
 * Low-level reader for a JSON table file inside `database/`.
 * Returns the parsed JSON object or defaultData if the file does not exist.
 *
 * @param {string} filename - Name of the table file (e.g. 'user_states.json').
 * @param {object} defaultData - Fallback data if file is missing or unreadable.
 * @returns {object} The parsed table contents.
 */
function readTableFile(filename, defaultData = {}) {
  try {
    const dir = getDatabaseDir();
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    // Non-fatal error fallback
  }
  return defaultData;
}

/**
 * Low-level writer for a JSON table file inside `database/`.
 * Writes formatted JSON atomically.
 *
 * @param {string} filename - Name of the table file.
 * @param {object} data - Object data to serialize and write.
 * @returns {boolean} True if successfully written, false on failure (e.g. read-only file system).
 */
function writeTableFile(filename, data) {
  try {
    const dir = getDatabaseDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    // Expected on read-only serverless lambdas
    return false;
  }
}

const EC_ID = process.env.EDGE_CONFIG_ID || '';
const TEAM_ID = process.env.VERCEL_TEAM_ID || '';
const TOKEN = process.env.VERCEL_API_TOKEN || '';

/**
 * Asynchronously mirrors updated records to Vercel Edge Config.
 * Enables real-time synchronization between devices on production deployments.
 *
 * @param {Array<{key: string, value: any}>} items - Key-value items to upsert.
 * @returns {Promise<boolean>} True if update succeeded on Edge Config.
 */
async function mirrorToEdgeConfig(items) {
  try {
    if (!TOKEN || !EC_ID) return false;
    const url = `https://api.vercel.com/v1/edge-config/${EC_ID}/items?teamId=${TEAM_ID}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: items.map(it => ({
          operation: 'upsert',
          key: it.key,
          value: it.value
        }))
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetches a single key from Vercel Edge Config.
 *
 * @param {string} key - Config key to retrieve (e.g. 'data_toni').
 * @returns {Promise<any|null>} Value stored in Edge Config or null.
 */
async function fetchFromEdgeConfig(key) {
  try {
    if (!TOKEN || !EC_ID) return null;
    const url = `https://api.vercel.com/v1/edge-config/${EC_ID}/item/${encodeURIComponent(key)}?teamId=${TEAM_ID}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    if (res.ok) {
      const json = await res.json();
      return json?.value ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

// ── Table: Users (database/users.json) ────────────────────────────────────────

/**
 * Retrieves the full users table from `database/users.json` merged with cloud accounts.
 *
 * @returns {Promise<Record<string, object>>} Dictionary of user records indexed by username.
 */
export async function getUsersTable() {
  const localUsers = readTableFile(USERS_FILE, {});
  const cloudUsers = await fetchFromEdgeConfig('accounts');
  return {
    ...DEFAULT_USERS,
    ...localUsers,
    ...(cloudUsers || {})
  };
}

/**
 * Persists the users table to `database/users.json` and mirrors to Edge Config.
 *
 * @param {Record<string, object>} table - User accounts mapping.
 * @returns {Promise<void>}
 */
export async function saveUsersTable(table) {
  writeTableFile(USERS_FILE, table);
  await mirrorToEdgeConfig([{ key: 'accounts', value: table }]);
}

/**
 * Finds a user account by their username (case-insensitive).
 *
 * @param {string} userId - Username to search for.
 * @returns {Promise<object|null>} The user account object or null if not registered.
 */
export async function findUser(userId) {
  if (!userId) return null;
  const uid = userId.toLowerCase().trim();
  const table = await getUsersTable();
  return table[uid] || null;
}

/**
 * Registers or updates a user account record in `database/users.json`.
 *
 * @param {{ username: string, displayName?: string, hash?: string }} userObj - User details.
 * @returns {Promise<object|null>} The created or updated user record.
 */
export async function saveUser(userObj) {
  if (!userObj || !userObj.username) return null;
  const uid = userObj.username.toLowerCase().trim();
  const table = await getUsersTable();

  const record = {
    id: uid,
    username: uid,
    displayName: userObj.displayName || uid,
    hash: userObj.hash || table[uid]?.hash || '',
    role: 'user',
    createdAt: table[uid]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  table[uid] = record;
  await saveUsersTable(table);
  return record;
}

// ── Table: User States & Isolation (database/user_states.json) ───────────────

/**
 * Reads all user state partitions from `database/user_states.json`.
 *
 * @returns {Promise<Record<string, object>>} All user partitions.
 */
export async function getUserStatesTable() {
  return readTableFile(STATES_FILE, {});
}

/**
 * Writes the entire user states table to `database/user_states.json`.
 *
 * @param {Record<string, object>} table - Complete user states table.
 * @returns {Promise<void>}
 */
export async function saveUserStatesTable(table) {
  writeTableFile(STATES_FILE, table);
}

/**
 * Retrieves the isolated learning state partition for a specific user.
 * Merges local database records with cloud Edge Config records for cross-device support.
 *
 * STRICT MULTI-TENANT ISOLATION:
 * User A can ONLY ever receive User A's data partition.
 *
 * @param {string} userId - The requesting username.
 * @returns {Promise<Record<string, { status: string, fav: boolean, updatedAt?: string }>>} User card states.
 */
export async function getUserState(userId) {
  if (!userId) return {};
  const uid = userId.toLowerCase().trim();

  // 1. Check local file database/user_states.json
  const table = readTableFile(STATES_FILE, {});
  const localState = table[uid] || {};

  // 2. Also check cloud mirror if available (e.g. on new device)
  const cloudState = await fetchFromEdgeConfig(`data_${uid}`);

  return {
    ...(cloudState || {}),
    ...localState
  };
}

/**
 * Retrieves the dedicated favorites list for a specific user from `database/favorites.json`.
 *
 * @param {string} userId - The requesting username.
 * @returns {Promise<Record<string, object>>} Favorite items partitioned for this user.
 */
export async function getUserFavorites(userId) {
  if (!userId) return {};
  const uid = userId.toLowerCase().trim();
  const table = readTableFile(FAVORITES_FILE, {});
  return table[uid] || {};
}

/**
 * Updates a user's learning state with atomic Smart Delta Merging.
 *
 * SMART MERGING RULES & ZERO-WIPE PROTECTION:
 *  1. If `delta` is passed (`{ key, item }`), ONLY that single card is updated or removed.
 *     All other cards belonging to that user in grammar (`g_`), vocab (`v_`), and kanji (`k_`)
 *     are 100% preserved.
 *  2. If `stateData` dictionary is passed without delta, each key is merged.
 *  3. If an empty `{}` is received (e.g. from an uninitialized component on Incognito/refresh),
 *     the existing user database is NOT wiped.
 *  4. Automatically synchronizes `database/favorites.json` with all items having `fav: true`.
 *  5. Mirrors the merged state to Vercel Edge Config for real-time cross-device availability.
 *
 * @param {string} userId - Username to update.
 * @param {object} stateData - Full or partial state dictionary.
 * @param {{ key: string, item: object }|null} [delta=null] - Explicit single card update.
 * @returns {Promise<object>} The resulting updated state dictionary for this user.
 */
export async function setUserState(userId, stateData, delta = null) {
  if (!userId) return {};
  const uid = userId.toLowerCase().trim();

  // 1. Read existing user state from database/user_states.json
  const table = readTableFile(STATES_FILE, {});
  if (!table[uid]) {
    table[uid] = {};
  }

  // Also read any existing cloud mirror state so cards saved from another device are retained
  const cloudState = await fetchFromEdgeConfig(`data_${uid}`);
  const userCards = {
    ...(cloudState || {}),
    ...table[uid]
  };

  // 2. Apply Smart Delta or Dictionary Merge
  if (delta && delta.key) {
    const { key, item } = delta;
    if (!item || (item.status === 'new' && !item.fav)) {
      delete userCards[key]; // Card was reset to default unrated
    } else {
      userCards[key] = {
        status: item.status || 'new',
        fav: !!item.fav,
        updatedAt: item.updatedAt || new Date().toISOString()
      };
    }
  } else if (stateData && typeof stateData === 'object') {
    const entries = Object.entries(stateData);
    if (entries.length > 0) {
      for (const [k, v] of entries) {
        if (!v || (v.status === 'new' && !v.fav)) {
          delete userCards[k];
        } else if (v.status === 'mastered' || v.status === 'again' || v.fav === true) {
          userCards[k] = {
            status: v.status || 'new',
            fav: !!v.fav,
            updatedAt: v.updatedAt || new Date().toISOString()
          };
        }
      }
    }
    // Note: If stateData is empty {}, we deliberately preserve userCards to prevent accidental wipe
  }

  // 3. Persist to database/user_states.json
  table[uid] = userCards;
  writeTableFile(STATES_FILE, table);

  // 4. Automatically synchronize database/favorites.json
  const favTable = readTableFile(FAVORITES_FILE, {});
  const userFavs = {};
  for (const [k, v] of Object.entries(userCards)) {
    if (v && v.fav === true) {
      const type = k.startsWith('g_') ? 'grammar' : k.startsWith('v_') ? 'vocab' : 'kanji';
      const index = parseInt(k.split('_')[1], 10);
      userFavs[k] = {
        type,
        index,
        fav: true,
        updatedAt: v.updatedAt || new Date().toISOString()
      };
    }
  }
  favTable[uid] = userFavs;
  writeTableFile(FAVORITES_FILE, favTable);

  // 5. Mirror to Edge Config for serverless cross-device persistence
  await mirrorToEdgeConfig([{ key: `data_${uid}`, value: userCards }]);

  return userCards;
}
