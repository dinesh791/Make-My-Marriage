# Tests

Place focused unit tests in `tests/unit` and API/database integration tests in `tests/integration`. Add end-to-end tests under `tests/e2e` when UI flows exist.

Run `npm test` for the isolated unit suite. It does not connect to Atlas; the `server-only` alias is a test-only stub and production builds retain the import guard.

The initial HTTP/Atlas authentication integration check is `scripts/verify-auth.mjs`, run with `npm run test:auth:integration` while the local development server is running. It requires the configured `makemymarriage_dev` database and a localhost/127.0.0.1 app URL, after `npm run db:setup`. It creates randomly named `auth-check-...@example.invalid` users and cleans up only those users and sessions in a finally block. Rate counters expire automatically. It never prints passwords, session cookies, or database credentials. An interrupted process may require cleanup of its temporary accounts.

Coverage includes real registration, sequential/concurrent duplicate emails, multiple accounts without Google identities, wrong/correct passwords, ordinary/persistent cookies, session rotation, logout revocation, expiry before TTL cleanup, suspension/deletion, protected dashboard access, JSON validation, origin checks and distributed login limits. These are development checks, not production load or security certification.
