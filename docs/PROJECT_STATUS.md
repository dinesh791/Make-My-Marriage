# Make My Marriage — Project Status

Last reviewed: 2026-10-14

This is the living progress tracker for the project. `AGENTS.md` contains persistent project and implementation guidance. The confirmed V1 requirements and design are in `PRD.md`, `SYSTEM_DESIGN.md`, and `DB_API_DESIGN.md` in this folder.

## Current Status

- The marketing landing page has been removed by product decision. `/` directly renders the Dinesh & Usha sample wedding without changing the URL; the same public wedding is available at `/w/dinesh-usha`. Its Login link opens `/login`, where sign-up is available.
- Stitch's exported Tamil wedding website design is implemented as the sample public wedding presentation. Login/sign-up are connected to email/password authentication; the dashboard requires a valid session.
- Wedding creation and membership persistence are implemented in source. A signed-in user can save one wedding with a Bride/Groom role and see the saved date/venue on their dashboard. Partner invitations, wedding editing, and data-backed public wedding pages are not implemented.
- Treat sample events, checklist counts, and wedding details in these screens as illustrative rather than live product data.
- A local MongoDB replica set now runs on `127.0.0.1:27018` for development. All five current auth and wedding collections/indexes were provisioned there, and real auth and wedding flows were verified against it. Atlas auth persistence was previously verified; creation of the new wedding collections/indexes in Atlas remains unverified after its latest connection failure.

## Completed and Verified

- Started a project-only, loopback MongoDB replica set using the installed MongoDB Server, with data under Git-ignored `.local/mongodb/data`. Git-ignored `.env.development.local` selects it for development while preserving Atlas settings in `.env.local`. `npm run db:setup` completed for `users`, `auth_sessions`, `auth_rate_limits`, `weddings`, and `wedding_members`.
- Restarted Next.js with the local development environment. `npm run test:auth:integration` passed registration, login, cookies, session rotation/revocation/expiry, dashboard protection, account status, request validation, and rate limits. `npm run test:wedding:integration` passed wedding create/read, membership, access control, and the one-active-wedding rule. Both scripts removed their own temporary account data; rate counters expire by TTL.
- The integration checks now confirm the running app reads the same configured database before creating test accounts. The local MongoDB starter checks the running server's data directory before it initializes or accepts the replica set. Both auth and wedding integration checks passed after these safeguards were added.
- Manual browser testing on 2026-10-14 confirmed both auth-page “Back to website” links, local sign-in, wedding creation, saved details after reload and a second sign-in, sign-out, and dashboard redirection after sign-out. The temporary local account, wedding, membership, and session were removed; no browser warnings or errors appeared. Auth and wedding integration checks, 15 unit tests, typecheck, lint, formatting, and `git diff --check` passed.
- A subsequent local login failure on 2026-10-14 was traced to the project MongoDB process being stopped while Next.js remained running. `npm run db:local:start` restored the replica set and the login endpoint returned the expected invalid-credentials response for a diagnostic request instead of service unavailable. Start the database again after a reboot; local and Atlas accounts do not synchronize.
- Atlas development connection check passed on 2026-10-13 after the current public IP was added to the access list. The expected database-scoped `readWrite` role was confirmed. Subsequent provisioning and real authentication integration checks exercised account/session writes successfully.
- Implemented the User model with normalized unique email, omitted optional Google identity with sparse uniqueness, Argon2id password hashes, and safe profile DTOs. Identity identifiers remain reserved after soft deletion as documented in `AUTH_DESIGN.md`.
- Implemented registration, login, logout, and current-user REST endpoints, connected forms with error/pending states, revocable HMAC-digested database sessions, Remember me, server-side dashboard protection, and functional sign-out. Auth mutations validate the configured origin; login/registration validate bounded JSON and use shared database rate counters.
- Added `weddings` and `wedding_members` models, UTC wedding-date storage with the Asia/Kolkata display timezone, safe DTOs, and explicit indexes including the active one-wedding-per-user rule. Added authenticated create/list/member-get endpoints and an onboarding form; the dashboard now reads the real saved wedding instead of sample data for accounts that have one.
- Added unit coverage for wedding request validation, safe HTTP/HTTPS map links, and declared uniqueness constraints. `npm run typecheck`, `npm test` (3 files, 15 tests), and `npm run build` pass. The latest Atlas provisioning attempt did not reach the cluster; runtime persistence and the new collections therefore remain unverified against Atlas.
- `npm run db:setup` created the three authentication collections and declared indexes without seeding accounts. A private AUTH_SECRET was generated in Git-ignored `.env.local` without printing it. Google credentials are no longer required for email/password login.
- `npm run typecheck`, `npm test` (2 test files, 13 tests), and `npm run build` passed during authentication implementation. The opt-in local HTTP/Atlas integration check passed registration, duplicate-email handling, multiple password-only users, login, session rotation/revocation/expiry, protected dashboard access, suspended/deleted users, validation and rate limits; temporary accounts and sessions were removed afterward. Production runtime dependency audit reported zero vulnerabilities.
- The registration page was inspected in the in-app browser at desktop width; its fields and existing visual layout render correctly. This is not a full mobile or browser automation regression suite.
- `/` and `/w/dinesh-usha` render the same public wedding presentation; `/` stays at the root URL. The shared page component supports both routes, and its Login link opens `/login`. No marketing landing page is present.
- Stitch-inspired login and registration layouts, the full public wedding presentation at `/w/[slug]`, and a responsive couple dashboard are implemented. Wedding content remains illustrative sample data.
- The public wedding preview follows the provided Stitch export's section order and sample identity: Dinesh & Usha, Sivan Mahal, Salem. It includes a live countdown and marks gallery upload/livestream setup as unavailable until those workflows exist.
- The public wedding header brand mark matches the Stitch export: a burgundy rounded-square tile with the intertwined gold-circle wedding emblem and serif wordmark.
- Login and registration share the same top-right “Back to website” link through `AuthShell`, returning to `/` with the existing hover and keyboard-focus styling. Both links were verified in the browser.
- Stitch gallery, map, and broadcast artwork is referenced directly from its public Google-hosted export path (without server-side optimization, because this environment blocks outbound CDN requests); wedding-owned media should move to R2 when the gallery workflow is connected.
- Public wedding section links remain available on mobile in a horizontally scrollable navigation row.
- The couple image previously stored under `public/images/landing/` is now under `public/images/wedding/` and reused by the product screens.
- `PRD.md` and `SYSTEM_DESIGN.md` describe the root sample-wedding route and `/w/[slug]`; `DB_API_DESIGN.md` uses public-wedding terminology for the endpoint.
- `/api/v1/health` returns the documented success response envelope. Shared success/error response helpers and a focused unit test exist.
- Mongoose connection reuse, environment validation, password hashing and session cookies are connected to authentication. Cloudflare R2 and Resend client helpers remain unwired to product workflows.
- Next.js route locations exist for login, registration, password recovery, partner invite, dashboard, and `/w/[slug]`.
- The Stitch-derived couple image is retained under `public/images/wedding/` for product UI reuse.

## Current Implementation Reality

- REST endpoints exist for health and auth registration/login/logout/current-user lookup.
- Email/password login and registration are functional. Google sign-in is visibly unavailable; forgot-password, reset-password, and partner-invite remain placeholders. Email verification, profile APIs and Google account linking are not implemented.
- The dashboard reads saved wedding details from MongoDB, but event/checklist cards and the public wedding website are still not data-backed. Partner invite creation/acceptance and wedding edit/archive APIs are pending.
- Product screens are English-only at present. Tamil product-page localization remains pending.
- `src/models/` contains User, AuthSession, AuthRateLimit, Wedding, and WeddingMember schemas. Auth and wedding modules each follow controller/service/repository/validator/DTO layers. General UI primitives remain pending.
- Unit tests cover HTTP envelopes, auth, and wedding schema boundaries. `scripts/verify-auth.mjs` provides an opt-in local HTTP/Atlas authentication integration check with temporary account cleanup; wedding Atlas integration verification is pending. Automated full-browser coverage is still pending.
- Email/password authentication uses opaque database sessions, not the installed but unused `next-auth` package. The current scope and remaining Google/recovery requirements are explicit in `AUTH_DESIGN.md`.
- Atlas settings are stored in Git-ignored `.env.local`, targeting `makemymarriage_dev`. Git-ignored `.env.development.local` overrides only the URI for local development; Compass can connect to the local replica set on port 27018. Credentials were not printed. The latest Atlas setup attempt failed while connecting, before wedding collection setup began; verify current IP allow-list, URI/database name, and database user credentials before retrying. The user-provided screenshot exposed a database password; rotate it in Atlas and update only the local ignored `.env.local` value.
- The Mongoose helper keeps `autoCreate` and `autoIndex` disabled. Run the explicit additive `db:setup` command before authentication/wedding features; repositories verify required indexes. The health endpoint still does not check database connectivity.
- Production-server smoke check confirmed `/` returns `200` directly (no redirect), `/w/dinesh-usha` returns `200`, and `/login` returns `200`. Both wedding routes contain Dinesh & Usha and a Login link to `/login`.
- Full `npm run lint` and `npm run format:check` pass. Two previously unformatted source files were formatted during the 2026-10-14 QA pass.
- A full browser screenshot comparison of the running app against the exported Stitch screenshot has not yet been completed.

## Pending Development

Follow the implementation order in `DB_API_DESIGN.md` and update this section as work is completed:

1. Finish authentication: configure Google OAuth and Resend, implement safe Google account linking and password recovery, decide/implement email verification, add profile APIs, and complete deployment abuse controls/monitoring. Email/password accounts, sessions and dashboard protection are complete.
2. Finish the wedding domain: retry Atlas setup, verify create/read against Atlas, add wedding edit/archive and expiring one-time partner invite create/accept, and seed default invitation/checklist data when those modules are added.
3. Implement event management for Engagement, Nalangu, Muhurtham, and Reception.
4. Implement invitation configuration/templates, preview and publishing, copy-link/WhatsApp sharing, email invitations, and data-backed public wedding APIs/pages at `/w/[slug]`.
5. Implement the shopping checklist and catering details.
6. Implement gallery albums/photos and guest upload through validated Cloudflare R2 upload flows.
7. Implement external livestream configuration and simple private access.
8. Complete authorization, request validation, rate limiting, API consistency, integration/end-to-end tests, observability, and deployment configuration.

## Decisions and Follow-up Items

- Keep the modular monolith and Wedding-centered data model. Route handlers/controllers handle HTTP concerns, services own business rules, repositories own database access, and models live in `src/models/`.
- Guests remain account-free in V1. Public responses must expose only safe wedding data; bride/groom membership controls administrative access.
- Store media objects in R2 and media metadata/object keys in MongoDB. Keep credentials server-side. Store timestamps in UTC and use `Asia/Kolkata` for wedding display.
- Follow `AUTH_DESIGN.md` for the implemented session/identity rules. Google OAuth must use a maintained provider integration and avoid implicit email-only account linking. API authentication and wedding-membership authorization remain separate concerns.
- Node.js minimum version is now consistently 22.17.0 in package metadata and README.
- Authentication uses conservative shared global and per-email rate limits. Tune them and add trusted per-IP edge controls before public launch; global caps can affect unrelated users. Email verification/recovery and operational monitoring are still launch requirements.

## Next Recommended Step

The local development database and current email/password plus wedding-create flows are ready. Next choose the next approved V1 feature: finish Google sign-in/password recovery or continue wedding editing and partner invites. Before using Atlas again, rotate its exposed database-user password, update `.env.local`, confirm Atlas Network Access, and rerun setup there. Atlas wedding provisioning, Resend, and the browser-based desktop/mobile comparison remain pending. Before each implementation step, review relevant design sections and the installed Next.js guides as required by `AGENTS.md`.

After each feature, verify its implementation in source, record the checks actually run, move completed work out of the pending list, and revise the next step.
