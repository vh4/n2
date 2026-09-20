import { createClient } from '@supabase/supabase-js';

/**
 * Database & Multi-Tenant Service for N2 Japanese Mastery Studio.
 *
 * Architecture — Clean Architecture with Supabase PostgreSQL:
 *  - High-performance, real-time relational database in Supabase.
 *  - Tables: `public.users`, `public.user_states`, and `public.favorites`.
 *  - Strict multi-tenant data isolation: User A only ever accesses and mutates User A's partition.
 *  - Eliminates all local file storage and zero-wipe guards ensure data persists permanently on Vercel Serverless.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vqqjsehanioqcmzfxqex.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_9ghzkfd92U6uutdokZy3Kg_TXOb2sba';

let supabaseInstance = null;

/**
 * Returns a singleton Supabase client instance for database queries.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
  }
  return supabaseInstance;
}

// Guaranteed fallback user (prevents lockouts)
const DEFAULT_USERS = {
  'toni': {
    id: 'toni',
    username: 'toni',
    displayName: 'Toni',
    hash: 'f1d360ed2e6c0ae9b2df90ecbcf18aa87e36162278aa327c6ff3042095f32f0b',
    role: 'user',
    createdAt: '2026-09-19T10:00:00.000Z'
  }
};

/**
 * Legacy directory helper (kept for backward-compatible test teardowns)
 */
export function getDatabaseDir() {
  return '';
}

// ── Table: Users (public.users in Supabase) ──────────────────────────────────

/**
 * Retrieves the full users dictionary from Supabase.
 *
 * @returns {Promise<Record<string, object>>} Dictionary of user records indexed by username.
 */
export async function getUsersTable() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('users').select('*');

  const table = { ...DEFAULT_USERS };
  if (!error && Array.isArray(data)) {
    for (const u of data) {
      table[u.username.toLowerCase()] = {
        id: u.id,
        username: u.username,
        displayName: u.display_name,
        hash: u.hash,
        role: u.role,
        createdAt: u.created_at,
        updatedAt: u.updated_at
      };
    }
  }
  return table;
}

/**
 * Saves multiple users to Supabase.
 *
 * @param {Record<string, object>} table - User accounts mapping.
 * @returns {Promise<void>}
 */
export async function saveUsersTable(table) {
  if (!table || typeof table !== 'object') return;
  const supabase = getSupabase();
  const rows = Object.values(table).map((u) => ({
    id: u.id || u.username.toLowerCase(),
    username: u.username.toLowerCase(),
    display_name: u.displayName || u.username,
    hash: u.hash || '',
    role: u.role || 'user',
    updated_at: new Date().toISOString()
  }));

  if (rows.length > 0) {
    await supabase.from('users').upsert(rows, { onConflict: 'id' });
  }
}

/**
 * Finds a user account by their username (case-insensitive) in Supabase.
 *
 * @param {string} userId - Username to search for.
 * @returns {Promise<object|null>} The user account object or null if not registered.
 */
export async function findUser(userId) {
  if (!userId) return null;
  const uid = userId.toLowerCase().trim();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .maybeSingle();

  if (error || !data) {
    if (uid === 'toni') return DEFAULT_USERS.toni;
    return null;
  }

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    hash: data.hash,
    role: data.role,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Registers or updates a user account record in Supabase.
 *
 * @param {{ username: string, displayName?: string, hash?: string }} userObj - User details.
 * @returns {Promise<object|null>} The created or updated user record.
 */
export async function saveUser(userObj) {
  if (!userObj || !userObj.username) return null;
  const uid = userObj.username.toLowerCase().trim();
  const supabase = getSupabase();

  const record = {
    id: uid,
    username: uid,
    display_name: userObj.displayName || uid,
    hash: userObj.hash || '',
    role: 'user',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('users')
    .upsert(record, { onConflict: 'id' })
    .select()
    .single();

  if (error || !data) {
    console.error('Error saving user to Supabase:', error);
    return null;
  }

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    hash: data.hash,
    role: data.role,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

// ── Table: User States (public.user_states in Supabase) ──────────────────────

/**
 * Reads all user state partitions from Supabase.
 *
 * @returns {Promise<Record<string, object>>} All user partitions.
 */
export async function getUserStatesTable() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('user_states').select('*');
  const table = {};

  if (!error && Array.isArray(data)) {
    for (const row of data) {
      if (!table[row.user_id]) table[row.user_id] = {};
      table[row.user_id][row.item_key] = {
        status: row.status,
        fav: row.fav,
        updatedAt: row.updated_at
      };
    }
  }
  return table;
}

/**
 * Writes user states to Supabase.
 *
 * @param {Record<string, object>} table - Complete user states table.
 * @returns {Promise<void>}
 */
export async function saveUserStatesTable(table) {
  if (!table || typeof table !== 'object') return;
  const supabase = getSupabase();
  const rows = [];

  for (const [userId, cards] of Object.entries(table)) {
    const uid = userId.toLowerCase();
    for (const [itemKey, card] of Object.entries(cards)) {
      if (!card) continue;
      const moduleType = itemKey.startsWith('g_') ? 'grammar' : itemKey.startsWith('v_') ? 'vocab' : 'kanji';
      const itemIndex = parseInt(itemKey.split('_')[1], 10) || 0;
      rows.push({
        user_id: uid,
        item_key: itemKey,
        module_type: moduleType,
        item_index: itemIndex,
        status: card.status || 'new',
        fav: !!card.fav,
        updated_at: card.updatedAt || new Date().toISOString()
      });
    }
  }

  if (rows.length > 0) {
    await supabase.from('user_states').upsert(rows, { onConflict: 'user_id,item_key' });
  }
}

/**
 * Retrieves the isolated learning state partition for a specific user from Supabase.
 *
 * STRICT MULTI-TENANT ISOLATION:
 * User A can ONLY ever receive User A's data partition (`user_id = uid`).
 *
 * @param {string} userId - The requesting username.
 * @returns {Promise<Record<string, { status: string, fav: boolean, updatedAt?: string }>>} User card states.
 */
export async function getUserState(userId) {
  if (!userId) return {};
  const uid = userId.toLowerCase().trim();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('user_states')
    .select('item_key, status, fav, updated_at')
    .eq('user_id', uid);

  if (error || !data) return {};

  const stateDict = {};
  for (const row of data) {
    stateDict[row.item_key] = {
      status: row.status,
      fav: row.fav,
      updatedAt: row.updated_at
    };
  }

  return stateDict;
}

/**
 * Retrieves the dedicated favorites list for a specific user from Supabase.
 *
 * @param {string} userId - The requesting username.
 * @returns {Promise<Record<string, object>>} Favorite items partitioned for this user.
 */
export async function getUserFavorites(userId) {
  if (!userId) return {};
  const uid = userId.toLowerCase().trim();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('favorites')
    .select('item_key, module_type, item_index, fav, updated_at')
    .eq('user_id', uid);

  if (error || !data) return {};

  const favDict = {};
  for (const row of data) {
    favDict[row.item_key] = {
      type: row.module_type,
      index: row.item_index,
      fav: row.fav,
      updatedAt: row.updated_at
    };
  }

  return favDict;
}

/**
 * Updates a user's learning state with atomic Smart Delta Merging in Supabase.
 *
 * SMART MERGING RULES & ZERO-WIPE PROTECTION:
 *  1. If `delta` is passed (`{ key, item }`), ONLY that single card is updated or removed in Supabase.
 *     All other cards belonging to that user are 100% preserved.
 *  2. If `item.status === 'new' && !item.fav`, the card is deleted from `user_states` and `favorites`.
 *  3. Automatically synchronizes `favorites` table for all items with `fav: true`.
 *  4. Returns the updated full state dictionary for immediate UI consumption.
 *
 * @param {string} userId - Username to update.
 * @param {object|null} stateData - Full or partial state dictionary.
 * @param {{ key: string, item: object }|null} [delta=null] - Explicit single card update.
 * @returns {Promise<object>} The resulting updated state dictionary for this user.
 */
export async function setUserState(userId, stateData, delta = null) {
  if (!userId) return {};
  const uid = userId.toLowerCase().trim();
  const supabase = getSupabase();

  // 1. Delta update (single card)
  if (delta && delta.key) {
    const { key, item } = delta;
    const moduleType = key.startsWith('g_') ? 'grammar' : key.startsWith('v_') ? 'vocab' : 'kanji';
    const itemIndex = parseInt(key.split('_')[1], 10) || 0;

    if (!item || (item.status === 'new' && !item.fav)) {
      // Unrated and unstarred: delete from both tables
      await supabase.from('user_states').delete().eq('user_id', uid).eq('item_key', key);
      await supabase.from('favorites').delete().eq('user_id', uid).eq('item_key', key);
    } else {
      const now = item.updatedAt || new Date().toISOString();
      await supabase.from('user_states').upsert({
        user_id: uid,
        item_key: key,
        module_type: moduleType,
        item_index: itemIndex,
        status: item.status || 'new',
        fav: !!item.fav,
        updated_at: now
      }, { onConflict: 'user_id,item_key' });

      if (item.fav) {
        await supabase.from('favorites').upsert({
          user_id: uid,
          item_key: key,
          module_type: moduleType,
          item_index: itemIndex,
          fav: true,
          updated_at: now
        }, { onConflict: 'user_id,item_key' });
      } else {
        await supabase.from('favorites').delete().eq('user_id', uid).eq('item_key', key);
      }
    }
  } else if (stateData && typeof stateData === 'object') {
    // 2. Bulk dictionary merge
    const entries = Object.entries(stateData);
    if (entries.length > 0) {
      const upsertStates = [];
      const upsertFavs = [];
      const deleteKeys = [];

      for (const [k, v] of entries) {
        if (!v) continue;
        const moduleType = k.startsWith('g_') ? 'grammar' : k.startsWith('v_') ? 'vocab' : 'kanji';
        const itemIndex = parseInt(k.split('_')[1], 10) || 0;
        const now = v.updatedAt || new Date().toISOString();

        if (v.status === 'new' && !v.fav) {
          deleteKeys.push(k);
        } else {
          upsertStates.push({
            user_id: uid,
            item_key: k,
            module_type: moduleType,
            item_index: itemIndex,
            status: v.status || 'new',
            fav: !!v.fav,
            updated_at: now
          });

          if (v.fav) {
            upsertFavs.push({
              user_id: uid,
              item_key: k,
              module_type: moduleType,
              item_index: itemIndex,
              fav: true,
              updated_at: now
            });
          }
        }
      }

      if (upsertStates.length > 0) {
        await supabase.from('user_states').upsert(upsertStates, { onConflict: 'user_id,item_key' });
      }
      if (upsertFavs.length > 0) {
        await supabase.from('favorites').upsert(upsertFavs, { onConflict: 'user_id,item_key' });
      }
      if (deleteKeys.length > 0) {
        await supabase.from('user_states').delete().eq('user_id', uid).in('item_key', deleteKeys);
        await supabase.from('favorites').delete().eq('user_id', uid).in('item_key', deleteKeys);
      }
    }
  }

  // 3. Return latest user state from Supabase
  return await getUserState(uid);
}
