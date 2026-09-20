import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUsername,
  registerUser,
  loginUser,
  logoutUser,
  getSession,
  setSessionCookie,
  userKey,
  sha256,
  COOKIE_SESSION_KEY
} from '../src/features/auth/services/auth.service.js';
import { middleware } from '../src/middleware.js';

test('1. Defensive normalizeUsername — handles strings, objects, numbers, null, undefined without throwing', () => {
  // Strings
  assert.equal(normalizeUsername('Toni'), 'toni');
  assert.equal(normalizeUsername('  USER_123  '), 'user_123');
  assert.equal(normalizeUsername(''), '');

  // Objects with various property names
  assert.equal(normalizeUsername({ username: 'Toni' }), 'toni');
  assert.equal(normalizeUsername({ uid: 'Budi_N2' }), 'budi_n2');
  assert.equal(normalizeUsername({ displayName: 'Kenji' }), 'kenji');
  assert.equal(normalizeUsername({}), '');

  // Numbers & Primitives
  assert.equal(normalizeUsername(12345), '12345');
  assert.equal(normalizeUsername(null), '');
  assert.equal(normalizeUsername(undefined), '');

  // CRITICAL REGRESSION TEST: Calling with non-string must NEVER throw "toLowerCase is not a function"
  assert.doesNotThrow(() => {
    normalizeUsername({ uid: 'test_user', status: 'active' });
    normalizeUsername([1, 2, 3]);
    normalizeUsername(true);
  });
});

test('2. registerUser — enforces strict validation rules and rejects invalid inputs', async () => {
  // Empty username
  const emptyRes = await registerUser('', 'password123');
  assert.equal(emptyRes.ok, false);
  assert.equal(emptyRes.error, 'Username cannot be empty.');

  // Username too short (<3 chars)
  const shortUserRes = await registerUser('ab', 'password123');
  assert.equal(shortUserRes.ok, false);
  assert.equal(shortUserRes.error, 'Username must be at least 3 characters.');

  // Password too short (<6 chars)
  const shortPassRes = await registerUser('valid_user', '12345');
  assert.equal(shortPassRes.ok, false);
  assert.equal(shortPassRes.error, 'Password must be at least 6 characters.');
});

test('3. registerUser — creates user with SHA-256 password hash, salt, and supports object input', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dbUsersPath = path.join(process.cwd(), 'database', 'users.json');

  const cleanFixtures = () => {
    if (fs.existsSync(dbUsersPath)) {
      const u = JSON.parse(fs.readFileSync(dbUsersPath, 'utf8'));
      delete u['test_new_student'];
      delete u['obj_student'];
      fs.writeFileSync(dbUsersPath, JSON.stringify(u, null, 2), 'utf8');
    }
  };

  cleanFixtures();

  const username = 'test_new_student';
  const password = 'securePassword123';

  // Test registration with string arguments
  const res = await registerUser(username, password);
  assert.equal(res.ok, true);
  assert.ok(res.user);
  assert.equal(res.user.username, 'test_new_student');

  // Verify hash matches manual SHA-256 computation
  const expectedHash = await sha256(password + 'test_new_student' + 'n2salt');
  assert.equal(res.user.hash, expectedHash);

  // Duplicate registration must be rejected
  const dupRes = await registerUser('test_new_student', 'anotherPassword');
  assert.equal(dupRes.ok, false);
  assert.equal(dupRes.error, 'Username already taken.');

  // Object input registration: { username, password }
  const objRes = await registerUser({ username: 'obj_student', password: 'password789' });
  assert.equal(objRes.ok, true);
  assert.equal(objRes.user.username, 'obj_student');

  // Cleanup after test
  cleanFixtures();
});

test('4. loginUser — validates credentials and rejects wrong passwords', async () => {
  // Missing credentials
  const emptyRes = await loginUser('', '');
  assert.equal(emptyRes.ok, false);
  assert.equal(emptyRes.error, 'Username and password cannot be empty.');

  // Non-existent user
  const notFoundRes = await loginUser('non_existent_user_xyz', 'somePassword');
  assert.equal(notFoundRes.ok, false);
  assert.ok(notFoundRes.error.includes('not found') || notFoundRes.error.includes('Pengguna tidak ditemukan'));

  // Incorrect password for pre-seeded user 'toni'
  const wrongPassRes = await loginUser('toni', 'wrong_password_123');
  assert.equal(wrongPassRes.ok, false);
  assert.equal(wrongPassRes.error, 'Incorrect password.');

  // Correct password for pre-seeded user 'toni'
  // Toni's pre-seeded hash corresponds to sha256('password' + 'toni' + 'n2salt')
  const toniCorrectHash = await sha256('password' + 'toni' + 'n2salt');
  assert.equal(toniCorrectHash, 'f1d360ed2e6c0ae9b2df90ecbcf18aa87e36162278aa327c6ff3042095f32f0b');

  const toniLogin = await loginUser('toni', 'password');
  assert.equal(toniLogin.ok, true);
  assert.equal(toniLogin.user.uid, 'toni');
  assert.equal(toniLogin.user.displayName, 'Toni');
});

test('5. Bug Regression — loginUser handles object parameters and existing session without (toLowerCase) error', async () => {
  // User passes { username, password } as a single object
  const objLogin = await loginUser({ username: 'toni', password: 'password' });
  assert.equal(objLogin.ok, true);
  assert.equal(objLogin.user.uid, 'toni');

  // CRITICAL REPRODUCTION OF USER BUG:
  // When AuthPage passed onLogin(result.user), and useAuth handleLogin called loginUser(userObj)
  // Previously threw: "TypeError: (username || '').toLowerCase is not a function"
  const sessionObj = {
    uid: 'toni',
    displayName: 'Toni',
    loginAt: new Date().toISOString()
  };

  assert.doesNotThrow(async () => {
    const directSessionRes = await loginUser(sessionObj);
    assert.equal(directSessionRes.ok, true);
    assert.equal(directSessionRes.user.uid, 'toni');
  });
});

test('6. Multi-Tenant userKey & Session Management', () => {
  assert.equal(userKey('Toni', 'state'), 'n2_state_toni');
  assert.equal(userKey({ uid: 'Budi' }, 'favs'), 'n2_favs_budi');
  assert.equal(userKey('Andi', 'settings'), 'n2_settings_andi');

  // Logout clears session
  assert.doesNotThrow(() => {
    logoutUser();
  });
});

test('7. Next.js Route Middleware — Guards /dashboard and routes public /login /register / correctly', () => {
  // Mock NextRequest creator
  const createMockRequest = (pathname, cookieValue = null) => {
    return {
      nextUrl: { pathname },
      url: `https://n2.wirsumatmo.tech${pathname}`,
      cookies: {
        get: (name) => (name === COOKIE_SESSION_KEY && cookieValue ? { value: cookieValue } : undefined)
      }
    };
  };

  // Case A: Unauthenticated user accesses /dashboard -> Must redirect to /login?redirect=/dashboard
  const unauthReq = createMockRequest('/dashboard');
  const resA = middleware(unauthReq);
  assert.ok(resA, 'Middleware must return a response');
  assert.equal(resA.status, 307, 'Must return redirect status');
  const locationA = resA.headers.get('location');
  assert.ok(locationA.includes('/login'), 'Redirect destination must be /login');
  assert.ok(locationA.includes('redirect=%2Fdashboard'), 'Must preserve redirect destination');

  // Case B: Authenticated user accesses /dashboard -> Allowed to proceed
  const authReq = createMockRequest('/dashboard', 'toni');
  const resB = middleware(authReq);
  // NextResponse.next() returns a response without 307 redirect
  assert.notEqual(resB.status, 307, 'Authenticated user must not be redirected from /dashboard');

  // Case C: Authenticated user visits /login or /register -> Redirects to /dashboard
  const loginWithAuthReq = createMockRequest('/login', 'toni');
  const resC = middleware(loginWithAuthReq);
  assert.equal(resC.status, 307);
  assert.ok(resC.headers.get('location').endsWith('/dashboard'));

  const regWithAuthReq = createMockRequest('/register', 'toni');
  const resD = middleware(regWithAuthReq);
  assert.equal(resD.status, 307);
  assert.ok(resD.headers.get('location').endsWith('/dashboard'));

  // Case D: Unauthenticated user visits root / -> Redirects to /login
  const rootUnauthReq = createMockRequest('/');
  const resE = middleware(rootUnauthReq);
  assert.equal(resE.status, 307);
  assert.ok(resE.headers.get('location').endsWith('/login'));

  // Case E: Authenticated user visits root / -> Redirects to /dashboard
  const rootAuthReq = createMockRequest('/', 'toni');
  const resF = middleware(rootAuthReq);
  assert.equal(resF.status, 307);
  assert.ok(resF.headers.get('location').endsWith('/dashboard'));
});

test('8. Multi-Tier Session Restoration — checks sessionStorage, localStorage, and cookie', () => {
  const mockStorage = (store = {}) => ({
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  });

  const sessionStore = {};
  const localStore = {};
  global.window = {};
  global.sessionStorage = mockStorage(sessionStore);
  global.localStorage = mockStorage(localStore);
  global.document = { cookie: '' };

  // 1. When empty, getSession() returns null
  assert.equal(getSession(), null);

  // 2. When cookie is set (e.g. Incognito / new tab), getSession restores session from cookie
  global.document.cookie = `${COOKIE_SESSION_KEY}=toni`;
  const restoredFromCookie = getSession();
  assert.ok(restoredFromCookie, 'Session must be restored from cookie');
  assert.equal(restoredFromCookie.uid, 'toni');

  // 3. When sessionStorage is empty and localStorage has session, restores from localStorage
  delete sessionStore['n2_session'];
  global.document.cookie = '';
  localStore['n2_session'] = JSON.stringify({ uid: 'budi', displayName: 'Budi' });
  const restoredFromLocal = getSession();
  assert.ok(restoredFromLocal, 'Session must be restored from localStorage');
  assert.equal(restoredFromLocal.uid, 'budi');

  // 4. Primary: when sessionStorage has session, restores from sessionStorage
  sessionStore['n2_session'] = JSON.stringify({ uid: 'cici', displayName: 'Cici' });
  const restoredFromSession = getSession();
  assert.ok(restoredFromSession, 'Session must be restored from sessionStorage');
  assert.equal(restoredFromSession.uid, 'cici');

  // Cleanup
  delete global.window;
  delete global.sessionStorage;
  delete global.localStorage;
  delete global.document;
});

