# Authentication implementation

Decision recorded: 2026-10-13. This document refines the V1 database/API baseline for the first authentication slice; it does not expand product scope.

## Implemented scope

Email/password registration, login, logout, current-user lookup, and a protected dashboard are implemented. The existing pages use the REST API. Google sign-in, email verification, password recovery, and profile editing are still pending. Google configuration is validated separately so missing Google credentials do not prevent email/password login.

The dashboard displays saved wedding details for accounts with a wedding and a setup form for accounts without one. Bride/Groom is a wedding membership role selected during wedding creation, not an account privilege accepted during registration. Partner invitations and joining remain pending; the public website still uses sample data.

## Sessions

The REST authentication module uses opaque database sessions with Node cryptography, Mongoose, and Argon2. The installed `next-auth` package is not active. Choose a maintained OAuth/OIDC integration for the Google step; do not implement Google's protocol by hand or automatically link accounts solely because their email addresses match.

Each successful authentication creates a random 32-byte session token. The browser receives only that token in a host-only, HTTP-only, SameSite=Lax cookie. Production uses `__Host-mmm_session` with Secure and Path=/; HTTP local development uses `mmm_session`. Only an HMAC-SHA256 token digest is stored in MongoDB, using `AUTH_SECRET`. Rotating this secret invalidates all existing sessions and rate-limit keys.

Ordinary sessions expire after 24 hours and use a browser-session cookie. Remember me creates a 30-day database session and persistent cookie. Browser session restoration may retain session cookies, so the database deadline is always authoritative. There is no sliding renewal. Login/registration replaces and revokes the incoming session in the same transaction; other devices' sessions remain valid. Logout deletes the current database session and expires the cookie, and is idempotent.

Every protected read checks the token digest, `expiresAt > now`, and an ACTIVE, non-deleted user. TTL indexes only clean up expired records; they do not decide whether a session is valid. Dashboard authorization runs in the page through the service, not only in a layout or browser state. Future protected APIs must use the same verification and additionally check wedding membership.

This follows the separation of opaque browser identifiers from server-side session data in [OWASP's session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html). The installed Next.js authentication, Route Handler, and asynchronous cookies guides were consulted.

## Identity rules

- Email is trimmed, lowercased, capped at 254 characters, and globally unique. Soft-deleted/suspended accounts retain their email. This is an explicit identity exception to active-only uniqueness for mutable wedding records; registration cannot take over a previous identity. Recovery/reactivation policy must be completed before account deletion is exposed.
- `googleSubject` is omitted when absent, not stored as null. Its sparse unique index therefore permits multiple password accounts. Google linking requires a verified provider identity and an explicit safe linking flow in the future OAuth implementation.
- Passwords are 12–128 characters, without silent trimming or normalization. Argon2id uses the installed library's salted defaults. Neither password hashes nor provider identities are returned in user DTOs; those fields are also excluded by default in Mongoose reads.
- Registration accepts only first name, optional last name, email, password and locale. Unknown fields (including status or role) are rejected. The UI also checks password confirmation.

## Collections and indexes

The 12 V1 domain collections remain the product baseline. This slice implements `users` and adds two operational collections needed by authentication:

| Collection | Fields | Indexes |
| --- | --- | --- |
| `users` | Identity/profile fields in DB_API_DESIGN.md | Unique normalized email; sparse unique Google subject |
| `auth_sessions` | userId, tokenHash, expiresAt, createdAt, updatedAt | Unique tokenHash; userId; TTL expiresAt |
| `auth_rate_limits` | HMAC key as _id, attempts, expiresAt | Unique _id; TTL expiresAt |

Operational sessions/counters are hard-deleted on revocation/expiry, rather than using business-record soft deletion. Password reset/verification tokens are not implemented and will require their own hashed, expiring, single-use storage.

`npm run db:setup` explicitly creates the three collections and adds their declared indexes. It preserves documents and existing indexes and is safe to rerun. It does not seed accounts. MongoDB automatic collection/index creation remains disabled. The repository checks the required indexes before authentication database operations; a deployment missing these indexes fails closed. Registration atomically creates the user and session using a MongoDB transaction, which requires a replica set locally as well as in Atlas.

## HTTP protections

| Method | Endpoint | Result |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | 201, safe user DTO, session cookie |
| POST | `/api/v1/auth/login` | 200, safe user DTO, session cookie |
| POST | `/api/v1/auth/logout` | 200, null data, expired cookie |
| GET | `/api/v1/auth/me` | 200 with safe user DTO, or 401 |

All use the documented success/error envelope and `Cache-Control: no-store, private`. Mutations require an Origin exactly matching the configured `NEXT_PUBLIC_APP_URL` origin, reject cross-site Fetch Metadata, and never trust a client Host header to determine the trusted origin. This browser API therefore requires an Origin header in command-line clients too. Registration/login require JSON, stream-limit the request body to 8 KiB, and validate strict Zod schemas. Login failures use the same message for unknown accounts, wrong passwords, and inactive accounts, with password work also performed for unknown accounts.

MongoDB counters provide fixed-window limits across application instances: registration 5/email/15 minutes and 20 total/minute; login 10/email/15 minutes and 100 total/minute. Limits count successful and failed requests. Counter keys are HMAC digests rather than raw email addresses. 429 responses include Retry-After. These conservative global caps suit development; they can affect unrelated users and must be tuned with trusted per-IP edge limits/abuse controls before public launch. Database/validation internals are not returned or logged by authentication handlers. Unexpected server failures emit only fixed action, stage, and category labels for diagnosis; raw errors, credentials, and request data are never logged or returned.

## Local setup and checks

1. Use Node.js 22.17 or newer (database scripts use Node's TypeScript stripping).
2. Set MONGODB_URI, AUTH_SECRET (at least 32 random characters), and the exact NEXT_PUBLIC_APP_URL origin in the Git-ignored `.env.local` file. The current workstation's secret was generated locally without printing it.
3. For local development, run `npm run db:local:start` and put `MONGODB_URI=mongodb://127.0.0.1:27018/makemymarriage_dev?replicaSet=mmm_local&directConnection=true` in Git-ignored `.env.development.local`. The app keeps its secret and origin settings in `.env.local`. For Atlas, allow the workstation's current IP and use database-scoped readWrite access.
4. Run `npm run db:setup`, then `npm run dev`.
5. Open `/register`, create an account, sign out, and sign back in. A successful account appears in the connected database's `users` collection.

`npm test` covers validation, password verification, request-origin/body checks, DTO isolation, token handling and rate-limit behavior. `npm run test:auth:integration` tests the running local app against `makemymarriage_dev` in local MongoDB or Atlas, creates uniquely named temporary accounts, and removes only those accounts and their sessions in a finally block. Temporary rate counters expire automatically. The script refuses non-local app hosts or other database names. Set AUTH_TEST_BASE_URL only if the local app uses another port (the server's configured origin must also match). Never run this verification against production.

Before public launch, complete Google sign-in, email verification/recovery decisions, trusted per-IP abuse controls, auth monitoring that redacts secrets, HTTPS deployment configuration and production database backup/retention decisions.
