import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/users.js';
import {
  getSupabase,
  getUsersTable,
  getUserStatesTable,
  getUserState,
  setUserState,
  getUserFavorites,
  findUser,
  saveUser
} from '../src/services/database/db.service.js';

// Helper to simulate request/response through the API handler
async function callApi({ method, query = {}, body = {} }) {
  let statusCode = 200;
  let responseData = null;

  const req = {
    method,
    query,
    body
  };

  const res = {
    setHeader: () => {},
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => { responseData = data; },
        end: () => {}
      };
    }
  };

  await handler(req, res);
  return { status: statusCode, data: responseData };
}

// Helper to clean test tenant from Supabase
async function cleanupTenant(username) {
  const supabase = getSupabase();
  const uid = username.toLowerCase().trim();
  await supabase.from('user_states').delete().eq('user_id', uid);
  await supabase.from('favorites').delete().eq('user_id', uid);
  await supabase.from('users').delete().eq('id', uid);
}

test('1. Supabase Database Integrity — users, user_states, and favorites tables exist and are active', async () => {
  const supabase = getSupabase();
  assert.ok(supabase, 'Supabase client must be initialized');

  // Verify users table
  const { data: users, error: usersErr } = await supabase.from('users').select('*').limit(10);
  assert.equal(usersErr, null, 'Querying public.users must succeed without error');
  assert.ok(Array.isArray(users), 'users must be an array');

  // Verify toni exists in Supabase
  const toni = users.find(u => u.username === 'toni');
  assert.ok(toni, 'User toni must exist in Supabase users table');
  assert.equal(toni.username, 'toni');
  assert.ok(toni.hash, 'toni must have password hash in Supabase');

  // Verify user_states table
  const { data: states, error: statesErr } = await supabase.from('user_states').select('*').limit(10);
  assert.equal(statesErr, null, 'Querying public.user_states must succeed without error');
  assert.ok(Array.isArray(states), 'user_states must be an array');

  // Verify favorites table
  const { data: favs, error: favsErr } = await supabase.from('favorites').select('*').limit(10);
  assert.equal(favsErr, null, 'Querying public.favorites must succeed without error');
  assert.ok(Array.isArray(favs), 'favorites must be an array');
});

test('2. Multi-Tenant Isolation — User A data is NEVER leaked to User B in Supabase', async () => {
  const userA = 'test_user_alpha';
  const userB = 'test_user_beta';

  try {
    // 1. User A saves progress
    await setUserState(userA, {
      'g_0': { status: 'mastered', fav: true },
      'g_1': { status: 'mastered', fav: false }
    });

    // 2. User B requests state -> MUST be empty
    const stateB = await getUserState(userB);
    assert.deepEqual(stateB, {}, 'User B must not see any cards from User A');
    assert.equal(stateB.g_0, undefined, 'User B must not have access to g_0');

    // 3. User B saves own progress
    await setUserState(userB, {
      'v_5': { status: 'again', fav: true }
    });

    // 4. User A requests state -> MUST only see User A cards, NOT User B cards
    const stateA = await getUserState(userA);
    assert.equal(stateA.g_0?.status, 'mastered');
    assert.equal(stateA.g_0?.fav, true);
    assert.equal(stateA.v_5, undefined, 'User A must not have access to v_5 from User B');

    // 5. User B requests state -> MUST only see User B cards
    const finalStateB = await getUserState(userB);
    assert.equal(finalStateB.v_5?.status, 'again');
    assert.equal(finalStateB.v_5?.fav, true);
    assert.equal(finalStateB.g_0, undefined, 'User B must still not see g_0');
  } finally {
    await cleanupTenant(userA);
    await cleanupTenant(userB);
  }
});

test('3. API Gateway Multi-Tenant Isolation — GET and POST endpoints enforce tenant boundaries', async () => {
  const tenant1 = 'tenant_andi';
  const tenant2 = 'tenant_budi';

  try {
    // Register both tenants
    await callApi({
      method: 'POST',
      body: { action: 'save_user', username: tenant1, displayName: 'Andi', hash: 'hash123' }
    });

    await callApi({
      method: 'POST',
      body: { action: 'save_user', username: tenant2, displayName: 'Budi', hash: 'hash456' }
    });

    // Tenant 1 saves state via API
    const saveRes = await callApi({
      method: 'POST',
      body: {
        action: 'save_state',
        username: tenant1,
        stateData: {
          'k_1': { status: 'mastered', fav: true },
          'k_2': { status: 'again', fav: false }
        }
      }
    });
    assert.equal(saveRes.status, 200);
    assert.equal(saveRes.data.ok, true);
    assert.equal(saveRes.data.count, 2);

    // Tenant 2 queries state via API
    const getRes2 = await callApi({
      method: 'GET',
      query: { username: tenant2, action: 'get_state' }
    });
    assert.equal(getRes2.status, 200);
    assert.equal(getRes2.data.ok, true);
    assert.deepEqual(getRes2.data.stateData, {}, 'Tenant 2 must receive empty state, not Tenant 1 state');

    // Tenant 1 queries state via API
    const getRes1 = await callApi({
      method: 'GET',
      query: { username: tenant1, action: 'get_state' }
    });
    assert.equal(getRes1.status, 200);
    assert.equal(getRes1.data.ok, true);
    assert.equal(getRes1.data.stateData.k_1?.status, 'mastered');
    assert.equal(getRes1.data.stateData.k_1?.fav, true);
  } finally {
    await cleanupTenant(tenant1);
    await cleanupTenant(tenant2);
  }
});

test('4. Cross-Device Sync Simulation — Device 1 mutates in Supabase, Device 2 refreshes and receives updates', async () => {
  const user = 'toni';

  // Device 1 marks new cards in Supabase: Vocab 99 mastered & fav, Kanji 77 again
  await callApi({
    method: 'POST',
    body: {
      action: 'save_state',
      username: user,
      stateData: {
        'v_99': { status: 'mastered', fav: true },
        'k_77': { status: 'again', fav: false }
      }
    }
  });

  // Device 2 simulates a page refresh / new fetch from Supabase
  const device2Res = await callApi({
    method: 'GET',
    query: { username: user, action: 'get_state' }
  });

  assert.equal(device2Res.status, 200);
  assert.equal(device2Res.data.ok, true);
  assert.ok(device2Res.data.stateData.v_99, 'Device 2 must have v_99 from Supabase');
  assert.equal(device2Res.data.stateData.v_99.status, 'mastered');
  assert.equal(device2Res.data.stateData.v_99.fav, true);
  assert.equal(device2Res.data.stateData.k_77.status, 'again');

  // Clean up v_99 and k_77
  await setUserState(user, null, { key: 'v_99', item: { status: 'new', fav: false } });
  await setUserState(user, null, { key: 'k_77', item: { status: 'new', fav: false } });
});

test('5. Smart Delta Merging & Zero-Wipe Protection — Single card updates do NOT wipe existing cards in Supabase', async () => {
  const user = 'test_delta_user';

  try {
    // Setup 3 cards in different modules
    await setUserState(user, {
      'g_10': { status: 'mastered', fav: false },
      'v_20': { status: 'again', fav: true },
      'k_30': { status: 'mastered', fav: true }
    });

    // 1. Device sends delta update for ONLY 'g_10'
    await callApi({
      method: 'POST',
      body: {
        action: 'save_state',
        username: user,
        delta: {
          key: 'g_10',
          item: { status: 'mastered', fav: true }
        }
      }
    });

    // Verify 'v_20' and 'k_30' are STILL PRESERVED!
    const stateAfterDelta = await getUserState(user);
    assert.equal(stateAfterDelta.g_10?.fav, true, 'g_10 should be updated to fav: true');
    assert.equal(stateAfterDelta.v_20?.status, 'again', 'v_20 must remain preserved in Supabase');
    assert.equal(stateAfterDelta.k_30?.status, 'mastered', 'k_30 must remain preserved in Supabase');

    // 2. Client sends uninitialized empty state {}
    await callApi({
      method: 'POST',
      body: {
        action: 'save_state',
        username: user,
        stateData: {}
      }
    });

    // Verify database was NOT wiped out by empty payload!
    const stateAfterEmpty = await getUserState(user);
    assert.ok(stateAfterEmpty.g_10, 'g_10 must survive empty state payload');
    assert.ok(stateAfterEmpty.v_20, 'v_20 must survive empty state payload');
    assert.ok(stateAfterEmpty.k_30, 'k_30 must survive empty state payload');
  } finally {
    await cleanupTenant(user);
  }
});

test('6. Favorites Table Synchronization — public.favorites mirrors all starred cards across modules in Supabase', async () => {
  const user = 'test_fav_sync_user';

  try {
    // Save 3 cards, 2 are favorited
    await setUserState(user, {
      'g_5': { status: 'mastered', fav: true },
      'v_15': { status: 'again', fav: false },
      'k_25': { status: 'mastered', fav: true }
    });

    const favorites = await getUserFavorites(user);
    assert.ok(favorites.g_5, 'g_5 must be present in favorites table');
    assert.equal(favorites.g_5.type, 'grammar');
    assert.equal(favorites.g_5.index, 5);
    assert.equal(favorites.g_5.fav, true);

    assert.equal(favorites.v_15, undefined, 'v_15 (not favorited) must NOT be in favorites table');

    assert.ok(favorites.k_25, 'k_25 must be present in favorites table');
    assert.equal(favorites.k_25.type, 'kanji');
    assert.equal(favorites.k_25.index, 25);
  } finally {
    await cleanupTenant(user);
  }
});

test('7. Status Filter Combinations — Semua/Dikuasai/Belum Ingat/Favorite return correct item counts from Supabase', async () => {
  const user = 'test_filter_combos';

  try {
    // Setup: 5 cards with different state combinations
    await setUserState(user, {
      'g_1': { status: 'mastered', fav: false }, // Dikuasai, not Fav
      'g_2': { status: 'mastered', fav: true },  // Dikuasai + Fav
      'g_3': { status: 'again', fav: true },     // Belum Ingat + Fav
      'g_4': { status: 'again', fav: false },    // Belum Ingat, not Fav
      'g_5': { status: 'mastered', fav: true }   // Dikuasai + Fav
    });

    const fullState = await getUserState(user);

    // Count items per filter
    const allItems = Object.keys(fullState);
    const mastered = Object.entries(fullState).filter(([, v]) => v.status === 'mastered');
    const again = Object.entries(fullState).filter(([, v]) => v.status === 'again');
    const favorites = Object.entries(fullState).filter(([, v]) => v.fav === true);

    assert.equal(allItems.length, 5, 'Semua: must have 5 rated items stored');
    assert.equal(mastered.length, 3, 'Dikuasai: must have 3 mastered items (g_1, g_2, g_5)');
    assert.equal(again.length, 2, 'Belum Ingat: must have 2 again items (g_3, g_4)');
    assert.equal(favorites.length, 3, 'Favorite: must have 3 fav items (g_2, g_3, g_5)');

    // Verify exact status logic
    assert.equal(fullState['g_2']?.status, 'mastered', 'g_2 must be mastered');
    assert.equal(fullState['g_2']?.fav, true, 'g_2 must be favorite (mastered + fav combo)');
    assert.equal(fullState['g_3']?.status, 'again', 'g_3 must be again');
    assert.equal(fullState['g_3']?.fav, true, 'g_3 must be favorite (again + fav combo)');
  } finally {
    await cleanupTenant(user);
  }
});

test('8. Delta-Only Sync — Server preserves all cards when only delta is sent to Supabase', async () => {
  const user = 'test_delta_only';

  try {
    // Setup: 3 existing cards across 3 modules
    await setUserState(user, {
      'g_10': { status: 'mastered', fav: false },
      'v_20': { status: 'again', fav: true },
      'k_30': { status: 'mastered', fav: true }
    });

    // Send ONLY delta
    const deltaRes = await callApi({
      method: 'POST',
      body: {
        action: 'save_state',
        username: user,
        delta: { key: 'k_5', item: { status: 'mastered', fav: false } }
      }
    });

    assert.equal(deltaRes.data.ok, true);
    assert.equal(deltaRes.data.count, 4, 'Supabase should have 4 cards: 3 existing + 1 new delta');

    const stateAfterDelta = await getUserState(user);
    assert.equal(stateAfterDelta['g_10']?.status, 'mastered', 'g_10 must survive delta-only update');
    assert.equal(stateAfterDelta['v_20']?.status, 'again', 'v_20 must survive delta-only update');
    assert.equal(stateAfterDelta['k_30']?.fav, true, 'k_30 fav must survive delta-only update');
    assert.equal(stateAfterDelta['k_5']?.status, 'mastered', 'k_5 delta update must be saved');
  } finally {
    await cleanupTenant(user);
  }
});

test('9. Cross-Device Fresh Login — Cloud state is fetched directly from Supabase with ZERO localStorage dependency', async () => {
  const user = 'test_fresh_device';

  try {
    // Device A saves state to Supabase
    await setUserState(user, {
      'g_50': { status: 'mastered', fav: true },
      'v_75': { status: 'again', fav: false },
      'k_12': { status: 'mastered', fav: true }
    });

    // Device B simulates fresh load directly from Supabase
    const freshState = await getUserState(user);

    assert.equal(Object.keys(freshState).length, 3, 'Fresh device must fetch all 3 cards from Supabase');
    assert.equal(freshState['g_50']?.status, 'mastered', 'g_50 must be restored to fresh device');
    assert.equal(freshState['g_50']?.fav, true, 'g_50 fav must be restored to fresh device');
    assert.equal(freshState['v_75']?.status, 'again', 'v_75 must be restored to fresh device');
    assert.equal(freshState['k_12']?.fav, true, 'k_12 fav must be restored to fresh device');

    const favs = await getUserFavorites(user);
    assert.ok(favs['g_50'], 'g_50 must appear in favorites table on fresh device');
    assert.ok(favs['k_12'], 'k_12 must appear in favorites table on fresh device');
    assert.equal(favs['v_75'], undefined, 'v_75 (fav:false) must NOT be in favorites table');
  } finally {
    await cleanupTenant(user);
  }
});
