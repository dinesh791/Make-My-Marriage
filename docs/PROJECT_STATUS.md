# Make My Marriage — Project Status

Last reviewed: 2026-10-13

This is the living progress tracker for the project. `AGENTS.md` contains persistent project and implementation guidance. The confirmed V1 requirements and design are in `PRD.md`, `SYSTEM_DESIGN.md`, and `DB_API_DESIGN.md` in this folder.

## Current Status

- The marketing landing page has been removed by product decision. `/` directly renders the Dinesh & Usha sample wedding without changing the URL; the same public wedding is available at `/w/dinesh-usha`. Its Login link opens `/login`, where sign-up is available.
- Stitch's exported Tamil wedding website design is implemented as the sample public wedding presentation. Login/sign-up and couple dashboard previews remain presentation-only.
- These screens are presentation-only. Authentication, wedding persistence, dashboard actions, and data-backed public wedding pages are not implemented.
- Treat sample events, checklist counts, and wedding details in these screens as illustrative rather than live product data.

## Completed and Verified

- `/` and `/w/dinesh-usha` render the same public wedding presentation; `/` stays at the root URL. The shared page component supports both routes, and its Login link opens `/login`. No marketing landing page is present.
- Stitch-inspired login and registration layouts, the full public wedding presentation at `/w/[slug]`, and a responsive couple dashboard preview are implemented with illustrative sample data.
- The public wedding preview follows the provided Stitch export's section order and sample identity: Dinesh & Usha, Sivan Mahal, Salem. It includes a live countdown and marks gallery upload/livestream setup as unavailable until those workflows exist.
- The public wedding header brand mark matches the Stitch export: a burgundy rounded-square tile with the intertwined gold-circle wedding emblem and serif wordmark.
- The login preview includes a top-right “Back to website” link that returns to the root wedding site.
- Stitch gallery, map, and broadcast artwork is referenced directly from its public Google-hosted export path (without server-side optimization, because this environment blocks outbound CDN requests); wedding-owned media should move to R2 when the gallery workflow is connected.
- Public wedding section links remain available on mobile in a horizontally scrollable navigation row.
- The couple image previously stored under `public/images/landing/` is now under `public/images/wedding/` and reused by the product screens.
- `PRD.md` and `SYSTEM_DESIGN.md` describe the root sample-wedding route and `/w/[slug]`; `DB_API_DESIGN.md` uses public-wedding terminology for the endpoint.
- `/api/v1/health` returns the documented success response envelope. Shared success/error response helpers and a focused unit test exist.
- Foundation helpers exist for Mongoose connection reuse, environment validation, Argon2 password hashing, session-cookie options/types, Cloudflare R2 client creation, and Resend client creation. These clients and helpers are not wired into end-to-end product workflows.
- Next.js route locations exist for login, registration, password recovery, partner invite, dashboard, and `/w/[slug]`.
- The Stitch-derived couple image is retained under `public/images/wedding/` for product UI reuse.

## Current Implementation Reality

- `/api/v1/health` is the only REST endpoint under `src/app/api/v1`.
- Login and registration are visual forms only; submit controls are not connected to an authentication API. Forgot-password, reset-password, and partner-invite remain placeholders.
- Dashboard and public wedding pages currently use illustrative hard-coded content. Dashboard actions and public wedding data are not backed by APIs or MongoDB.
- Product screens are English-only at present. Tamil product-page localization remains pending.
- `src/models/`, `src/modules/`, `src/types/`, and `src/components/ui/` contain guidance files, but no Mongoose models, feature modules, shared application types, or UI primitives yet.
- The only current test file is `tests/unit/http/api-response.test.ts`. There is no feature-level integration or end-to-end coverage yet.
- Authentication is not enabled. `next-auth` is installed, but provider/session behavior is not finalized. Password hashing and cookie settings alone do not provide authentication.
- `npm run typecheck`, `npm test` (1 test file, 2 tests), and `npm run build` pass after the root-route update. Targeted ESLint and Prettier checks also pass. The build includes `/`, `/login`, `/register`, `/dashboard`, and `/w/[slug]`.
- Production-server smoke check confirmed `/` returns `200` directly (no redirect), `/w/dinesh-usha` returns `200`, and `/login` returns `200`. Both wedding routes contain Dinesh & Usha and a Login link to `/login`.
- Targeted ESLint on changed TSX files passes. Full `npm run lint` did not finish within about two minutes and was stopped; it produced no lint diagnostics before stopping.
- A full browser screenshot comparison of the running app against the exported Stitch screenshot has not yet been completed.

## Pending Development

Follow the implementation order in `DB_API_DESIGN.md` and update this section as work is completed:

1. Finalize authentication and session choices; implement users, email/password and Google sign-in, registration, sign-out, current-user lookup, password recovery, and protected routes.
2. Add Mongoose models, indexes, repositories, wedding creation/editing, `WeddingMember` roles, the one-active-wedding-per-user rule, and expiring one-time partner invitations.
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
- Finalize the authentication/session approach before building protected product flows. The design recommends secure HTTP-only session cookies; the selected integration must also support the documented email/password and Google sign-in requirements.
- Resolve the Node.js version mismatch before CI/deployment: `package.json` allows `>=20.9.0`, while `README.md` recommends 22.17 or newer.

## Next Recommended Step

Complete a browser-based desktop/mobile comparison of the running app against the Stitch export and resolve the slow full-project lint run. Then finalize the authentication/session decision and implement the user model and authentication flow before wiring the dashboard to wedding data. Make the public website data-backed as the wedding and public API modules are implemented, moving the preview's externally hosted artwork to R2-backed wedding media as part of the gallery workflow. Before each implementation step, review relevant sections in `PRD.md`, `SYSTEM_DESIGN.md`, and `DB_API_DESIGN.md`, and consult the installed Next.js guides as required by `AGENTS.md`.

After each feature, verify its implementation in source, record the checks actually run, move completed work out of the pending list, and revise the next step.
