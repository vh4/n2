import {
  findUser,
  saveUser,
  getUserState,
  setUserState,
  getUserFavorites
} from '../src/services/database/db.service.js';

/**
 * Serverless / Express / Node HTTP API Handler for `/api/users`.
 * Mirrors the Next.js App Router route handler for maximum compatibility.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  }
  const query = req.query || {};
  const action = body.action || query.action || '';
  const username = body.username || query.username || '';
  const hash = body.hash || '';
  const displayName = body.displayName || '';
  const stateData = body.stateData || null;
  const delta = body.delta || null;

  const uid = (username || '').toLowerCase().trim();

  // ── GET or get_state / get_user / get_favorites ──
  if (req.method === 'GET' || action === 'get_user' || action === 'get_state' || action === 'get_favorites') {
    if (!uid) {
      return res.status(200).json({ ok: true, message: 'N2 Database API Ready' });
    }

    const user = await findUser(uid);
    if (!user) {
      return res.status(200).json({ ok: false, error: 'User not found in database' });
    }

    if (action === 'get_favorites') {
      const favorites = await getUserFavorites(uid);
      return res.status(200).json({ ok: true, username: uid, favorites });
    }

    const userState = await getUserState(uid);

    return res.status(200).json({
      ok: true,
      user: {
        username: user.username,
        displayName: user.displayName,
        hash: user.hash
      },
      stateData: userState
    });
  }

  // ── POST ──
  if (req.method === 'POST') {
    if (!uid) {
      return res.status(400).json({ ok: false, error: 'Username required' });
    }

    if (action === 'save_user') {
      const userRecord = await saveUser({
        username: uid,
        displayName,
        hash
      });

      return res.status(200).json({
        ok: true,
        user: {
          username: userRecord.username,
          displayName: userRecord.displayName,
          hash: userRecord.hash
        },
        stateData: {}
      });
    }

    if (action === 'save_state') {
      const savedState = await setUserState(uid, stateData, delta);

      return res.status(200).json({
        ok: true,
        count: Object.keys(savedState).length,
        stateData: savedState
      });
    }

    return res.status(200).json({ ok: true, message: 'Ready' });
  }

  return res.status(200).json({ ok: true, message: 'N2 Accounts & Data API Ready' });
}
