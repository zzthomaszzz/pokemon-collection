import crypto from 'crypto';

import { pool } from '../config/db.js';

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24; //24 hours
const TOKEN_BYTES = 32;

//The token goes to the browser raw; only its hash is ever stored.
//sha256 with no salt on purpose: unlike a password, the token is already 32 bytes of
//randomness, so there is nothing to brute-force and we need the lookup to be a fast
//exact match.
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId) {
    const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await pool.query(
        'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
        [hashToken(token), userId, expiresAt]
    );

    return token;
}

//Returns { userId } for a live session, or null. Expired rows are deleted on sight.
export async function findValidSession(token) {
    const result = await pool.query(
        'SELECT user_id, expires_at FROM sessions WHERE token_hash = $1',
        [hashToken(token)]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const session = result.rows[0];

    if (session.expires_at.getTime() <= Date.now()) {
        await deleteSession(token);
        return null;
    }

    return { userId: session.user_id };
}

export async function deleteSession(token) {
    await pool.query(
        'DELETE FROM sessions WHERE token_hash = $1',
        [hashToken(token)]
    );
}
