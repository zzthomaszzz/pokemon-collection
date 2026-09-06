import bcrypt from 'bcrypt';

import { pool } from '../config/db.js';

const BCRYPT_ROUNDS = 10;

//Postgres error code for a UNIQUE constraint violation
const UNIQUE_VIOLATION = '23505';

//Returns the user's id when the password matches, otherwise null.
//Null covers both "no such user" and "wrong password" on purpose — telling those two
//apart would let someone probe which names exist.
export async function checkCredentials(name, password) {
    const result = await pool.query(
        'SELECT id, password_hash FROM users WHERE name = $1',
        [name]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    return isMatch ? user.id : null;
}

//Returns the new user's id, or null when the name is already taken.
//
//No "does this name exist?" query first: between that check and the insert, another
//request could take the name. The UNIQUE constraint is the real guard, so we attempt
//the insert and read the error code instead.
export async function registerUser(name, password) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    try {
        const result = await pool.query(
            'INSERT INTO users (name, password_hash) VALUES ($1, $2) RETURNING id',
            [name, passwordHash]
        );

        return result.rows[0].id;
    } catch (error) {
        if (error.code === UNIQUE_VIOLATION) {
            return null;
        }

        throw error;
    }
}

export async function findUserById(userId) {
    const result = await pool.query(
        'SELECT id, name, created_at FROM users WHERE id = $1',
        [userId]
    );

    return result.rows[0] ?? null;
}
