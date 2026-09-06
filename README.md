# Pokémon Collection

A PERN learning project — the point of it is the auth system, not the Pokémon.

Session-token authentication built from scratch (no Passport, no Auth0), a React
frontend on shadcn/ui, and a Three.js lab page.

## Stack

| | |
|---|---|
| Backend | Node + Express 5, ESM |
| Database | PostgreSQL (`pg`, raw SQL — no ORM) |
| Frontend | React 19, Vite, Tailwind v4, shadcn/ui |
| Auth | Server-side session tokens, bcrypt, Joi validation |

## How the auth works

Tokens rather than JWTs, deliberately — one server, and being able to revoke a
session instantly is worth more than skipping a database lookup.

1. `POST /users/login` verifies the password with bcrypt and returns 32 random
   bytes as a hex token.
2. Only `sha256(token)` is stored in the `sessions` table. The raw token exists
   only in the browser, so reading the database gives you nothing usable.
3. Later requests send `Authorization: Bearer <token>`. The `requireAuth`
   middleware hashes it, looks it up, checks expiry, and hangs `req.userId` on
   the request.
4. `POST /users/logout` deletes the row, so the token stops working immediately.

The token lives in React state only — no `localStorage`. Refreshing signs you
out, which is the tradeoff for a token no injected script can read.

### Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/users/register` | public | create account, returns a token |
| POST | `/users/login` | public | returns a token |
| POST | `/users/logout` | required | revokes the current session |
| GET | `/users/me` | required | current user |

## Setup

Needs PostgreSQL running locally.

```bash
# 1. database
createdb pokemon_app

# 2. schema — order matters, sessions references users
psql -d pokemon_app -f backend/src/models/001_users.sql
psql -d pokemon_app -f backend/src/models/002_sessions.sql

# 3. config
cp backend/.env.example backend/.env    # then fill in your password

# 4. install + run (two terminals)
cd backend  && npm install && npm run dev    # :3000
cd frontend && npm install && npm run dev    # :5173
```

## Lab

`#/donut` — a Three.js torus rendered as ASCII text via `AsciiEffect`, using the
character ramp from Andy Sloane's original `donut.c`. Code-split with
`lazy()` so the 500kB of Three.js only loads if you open that page.

## Known gaps

Honest list, since this is a learning project and none of it is deployed:

- **No rate limiting.** `/users/login` will accept unlimited password guesses.
- **No tests.**
- **No HTTPS.** Over plain HTTP the token is readable in transit, which makes
  the session system decorative. Fine on localhost, not fine anywhere else.
- **No session cleanup.** Expired rows are only deleted when someone tries to
  use them.
- `DROP TABLE IF EXISTS` in the schema files is right for development and would
  delete every real user in production. Real migrations before deploying.
