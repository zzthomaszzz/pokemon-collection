-- Sessions. Run after 001_users.sql.
--
-- token_hash, not token: we store sha256(token), never the token itself. If someone
-- reads this table they get hashes, which are useless as tickets. Same reasoning as
-- password_hash. The raw token exists only in the user's browser.

DROP TABLE IF EXISTS sessions;

CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- "log this user out everywhere" and expiry cleanup both scan by these
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
