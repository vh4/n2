import { NextResponse } from 'next/server';
import {
  findUser,
  saveUser,
  getUserState,
  setUserState,
  getUserFavorites
} from '../../../services/database/db.service';

/**
 * Next.js App Router API Route Handler for `/api/users`.
 *
 * Enforces 100% strict multi-tenant isolation per user account.
 * Handles:
 *  - User retrieval and session verification.
 *  - Multi-tenant state queries and Smart Delta persistence.
 *  - Relational favorites queries from `database/favorites.json`.
 */

// Helper to construct standard CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Handles HTTP OPTIONS requests for CORS pre-flight checks.
 *
 * @returns {NextResponse}
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders()
  });
}

/**
 * Handles HTTP GET requests to `/api/users`.
 * Supported query parameters:
 *  - `username`: The target tenant username.
 *  - `action`: 'get_state' | 'get_favorites' | 'get_user'.
 *
 * @param {Request} request - The incoming HTTP Request object.
 * @returns {Promise<NextResponse>} JSON response with user or state data.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') || '';
  const action = searchParams.get('action') || '';
  const uid = username.toLowerCase().trim();

  if (!uid) {
    return NextResponse.json(
      { ok: true, message: 'N2 Database API Ready (Next.js App Router)' },
      { headers: corsHeaders() }
    );
  }

  // 1. Fetch user account record
  const user = await findUser(uid);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'User not found in database' },
      { status: 200, headers: corsHeaders() }
    );
  }

  // 2. Action: get_favorites
  if (action === 'get_favorites') {
    const favorites = await getUserFavorites(uid);
    return NextResponse.json(
      { ok: true, username: uid, favorites },
      { headers: corsHeaders() }
    );
  }

  // 3. Strict Multi-Tenant Isolation: Fetch ONLY this user's state partition
  const userState = await getUserState(uid);

  return NextResponse.json(
    {
      ok: true,
      user: {
        username: user.username,
        displayName: user.displayName,
        hash: user.hash
      },
      stateData: userState
    },
    { headers: corsHeaders() }
  );
}

/**
 * Handles HTTP POST requests to `/api/users`.
 * Supported actions:
 *  - `action: 'save_user'`: Registers / updates a user in `database/users.json`.
 *  - `action: 'save_state'`: Persists card states into `database/user_states.json`
 *    and synchronizes `database/favorites.json` using Smart Delta Merging.
 *
 * @param {Request} request - The incoming HTTP Request object.
 * @returns {Promise<NextResponse>} JSON confirmation of save operation.
 */
export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400, headers: corsHeaders() }
    );
  }

  const { action, username, displayName, hash, stateData, delta } = body;
  const uid = (username || '').toLowerCase().trim();

  if (!uid) {
    return NextResponse.json(
      { ok: false, error: 'Username is required' },
      { status: 400, headers: corsHeaders() }
    );
  }

  // 1. Action: save_user (Registration & Credential Sync)
  if (action === 'save_user') {
    const userRecord = await saveUser({
      username: uid,
      displayName,
      hash
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          username: userRecord.username,
          displayName: userRecord.displayName,
          hash: userRecord.hash
        },
        stateData: {}
      },
      { headers: corsHeaders() }
    );
  }

  // 2. Action: save_state (Multi-Tenant Learning State & Favorites)
  if (action === 'save_state') {
    const savedState = await setUserState(uid, stateData, delta);

    return NextResponse.json(
      {
        ok: true,
        count: Object.keys(savedState).length,
        stateData: savedState
      },
      { headers: corsHeaders() }
    );
  }

  return NextResponse.json(
    { ok: true, message: 'Ready' },
    { headers: corsHeaders() }
  );
}
