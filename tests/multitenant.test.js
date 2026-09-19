import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import handler from '../api/users.js';
import {
  getUsersTable,
  getUserStatesTable,
  getUserState,
  setUserState,
  getUserFavorites,
  findUser,
  saveUser,
  getDatabaseDir
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

test('1. Database Tables Integrity — users.json, user_states.json, and favorites.json exist and are valid', async () => {
  const dbDir = getDatabaseDir();
  assert.ok(fs.existsSync(dbDir), 'database directory must exist');

  const usersPath = path.join(dbDir, 'users.json');
  const statesPath = path.join(dbDir, 'user_states.json');
  const favsPath = path.join(dbDir, 'favorites.json');

  assert.ok(fs.existsSync(usersPath), 'database/users.json must exist');
  assert.ok(fs.existsSync(statesPath), 'database/user_states.json must exist');
  assert.ok(fs.existsSync(favsPath), 'database/favorites.json must exist');

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const states = JSON.parse(fs.readFileSync(statesPath, 'utf8'));
  const favs = JSON.parse(fs.readFileSync(favsPath, 'utf8'));

  assert.equal(typeof users, 'object', 'users table must be an object');
  assert.equal(typeof states, 'object', 'user_states table must be an object');
  assert.equal(typeof favs, 'object', 'favorites table must be an object');

  // Verify toni exists
  assert.ok(users.toni, 'user toni must exist in users table');
  assert.equal(users.toni.username, 'toni');
  assert.ok(users.toni.hash, 'toni must have password hash');
});

test('2. Multi-Tenant Isolation — User A data is NEVER leaked to User B', async () => {
  const userA = 'test_user_alpha';
  const userB = 'test_user_beta';

  // 1. User A saves progress (Grammar card 0 mastered & favorite)
  await setUserState(userA, {
    'g_0': { status: 'mastered', fav: true },
    'g_1': { status: 'mastered', fav: false }
  });

  // 2. User B requests state -> MUST be empty, User A data must NOT be present
  const stateB = await getUserState(userB);
  assert.deepEqual(stateB, {}, 'User B must not see any cards from User A');
  assert.equal(stateB.g_0, undefined, 'User B must not have access to g_0');

  // 3. User B saves own progress (Vocab card 5 needs review)
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
});

test('3. API Gateway Multi-Tenant Isolation — GET and POST endpoints enforce tenant boundaries', async () => {
  const tenant1 = 'tenant_andi';
  const tenant2 = 'tenant_budi';

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
});

test('4. Cross-Device Sync Simulation — Device 1 mutates, Device 2 refreshes and receives updates', async () => {
  const user = 'toni';

  // Device 1 marks new cards: Vocab 99 mastered & fav, Kanji 77 again
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

  // Device 2 simulates a page refresh / new fetch
  const device2Res = await callApi({
    method: 'GET',
    query: { username: user, action: 'get_state' }
  });

  assert.equal(device2Res.status, 200);
  assert.equal(device2Res.data.ok, true);
  assert.ok(device2Res.data.stateData.v_99, 'Device 2 must have v_99');
  assert.equal(device2Res.data.stateData.v_99.status, 'mastered');
  assert.equal(device2Res.data.stateData.v_99.fav, true);
  assert.equal(device2Res.data.stateData.k_77.status, 'again');
});

test('5. Smart Delta Merging & Zero-Wipe Protection — Single card updates and empty payloads do NOT wipe data', async () => {
  const user = 'test_delta_user';

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
  assert.equal(stateAfterDelta.v_20?.status, 'again', 'v_20 must remain preserved');
  assert.equal(stateAfterDelta.k_30?.status, 'mastered', 'k_30 must remain preserved');

  // 2. Client sends uninitialized empty state {} during rapid refresh / Incognito
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
});

test('6. Favorites Table Synchronization — database/favorites.json mirrors all starred cards across modules', async () => {
  const user = 'test_fav_sync_user';

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

  // Teardown: Clean up test fixtures to keep database clean
  const dbDir = getDatabaseDir();
  const usersPath = path.join(dbDir, 'users.json');
  const statesPath = path.join(dbDir, 'user_states.json');
  const favsPath = path.join(dbDir, 'favorites.json');

  if (fs.existsSync(usersPath)) {
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    delete users['tenant_andi'];
    delete users['tenant_budi'];
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf8');
  }

  if (fs.existsSync(statesPath)) {
    const states = JSON.parse(fs.readFileSync(statesPath, 'utf8'));
    delete states['test_user_alpha'];
    delete states['test_user_beta'];
    delete states['tenant_andi'];
    delete states['test_delta_user'];
    delete states['test_fav_sync_user'];
    // Restore toni's production cards
    states['toni'] = {
      'g_0': { status: 'mastered', fav: true },
      'g_1': { status: 'mastered', fav: false },
      'v_5': { status: 'again', fav: true },
      'v_12': { status: 'mastered', fav: true },
      'k_2': { status: 'mastered', fav: false },
      'k_8': { status: 'again', fav: true }
    };
    fs.writeFileSync(statesPath, JSON.stringify(states, null, 2), 'utf8');
  }

  if (fs.existsSync(favsPath)) {
    const favs = JSON.parse(fs.readFileSync(favsPath, 'utf8'));
    delete favs['test_user_alpha'];
    delete favs['test_user_beta'];
    delete favs['tenant_andi'];
    delete favs['test_delta_user'];
    delete favs['test_fav_sync_user'];
    favs['toni'] = {
      'g_0': { type: 'grammar', index: 0, fav: true },
      'v_5': { type: 'vocab', index: 5, fav: true },
      'v_12': { type: 'vocab', index: 12, fav: true },
      'k_8': { type: 'kanji', index: 8, fav: true }
    };
    fs.writeFileSync(favsPath, JSON.stringify(favs, null, 2), 'utf8');
  }
});
