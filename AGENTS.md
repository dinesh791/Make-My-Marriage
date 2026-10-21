<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Make My Marriage — Project Context

Last reviewed: 2026-10-21

Use this file for project context and implementation guidance. The confirmed V1 baseline is in `docs/PRD.md`, `docs/SYSTEM_DESIGN.md`, and `docs/DB_API_DESIGN.md`. Read this file and the relevant parts of those documents before implementing a feature. Verify progress against source code; a route, helper, or marketing description does not mean the user-facing feature is complete. Current progress, verification, and next steps are tracked separately in `docs/PROJECT_STATUS.md`.

Update `docs/PROJECT_STATUS.md` only for major changes: completed features, significant fixes, major milestones, or important project decisions. For those updates, record what changed, what is verified, what remains, and the next recommended step. Keep routine troubleshooting, retries, intermediate progress, and minor edits in the chat instead of updating the status file. Keep the confirmed V1 scope unless the product documents are deliberately revised. Never commit secrets; keep service credentials server-side.

## GitHub Push Approval

Always summarize the changes and ask the user for confirmation before pushing changes to GitHub. Wait for explicit approval for the current set of changes before running `git push` or another action that publishes commits to GitHub. Approval for an earlier push does not authorize later pushes. Do not push automatically to trigger a deployment.

## Product Overview

Make My Marriage is a web application for Tamil-style weddings, initially targeting Tamil Nadu. The V1 goal is to let a bride and groom create and share wedding information, events, invitation, website, shopping checklist, catering details, photo gallery, and external livestream. Guests do not need accounts: a basic wedding page is public, while personal email invitations collect attendance responses and unlock details for attending guests. The product UI is intended to support Tamil and English.

The V1 product experience consists of login/sign-up, the couple dashboard, and public wedding websites. A separate marketing landing page is out of scope; during the current sample-data preview, `/` renders the Dinesh & Usha wedding website directly. Its Login link opens `/login`, which links to `/register`. The same sample remains available at `/w/dinesh-usha` as a public wedding URL. See `docs/PROJECT_STATUS.md` for which surfaces are presentation-only versus connected to real authentication and wedding data.

## Stack and Architecture

- Next.js 16 App Router with the `src/` directory, React 19, TypeScript, and Node.js.
- Modular monolith with an explicit, versioned REST API under `src/app/api/v1`.
- MongoDB Atlas through Mongoose; Cloudflare R2 for media objects; Resend for email; Vercel is the documented deployment target.
- Zod for environment and request validation; Argon2 for password hashing; Vitest for tests; ESLint and Prettier for code quality.
- Intended flow: route handler → controller → service → repository → Mongoose model. Keep HTTP concerns in route handlers/controllers, business rules in services, and database access in repositories. React components must not access MongoDB directly.
- `src/modules/<feature>/` owns feature-specific controllers, services, repositories, validators, DTOs, and types. Shared Mongoose models belong in `src/models/`; shared application types belong in `src/types/`; integrations and infrastructure clients belong in `src/lib/`.

## Current Project Structure

```text
docs/                              Confirmed designs and living project status
public/images/wedding/             Reusable Stitch-derived wedding image
src/
  app/
    (auth)/                         Connected email/password forms and partner-invite acceptance; recovery placeholders
    (dashboard)/dashboard/          Protected dashboard with wedding setup, saved details, and editing
    (public)/w/[slug]/              Live wedding pages plus the Stitch sample preview
    api/v1/auth/                    Registration, login, logout, and current-user endpoints
    api/v1/weddings/                Create/list weddings, member details, and partner invite creation
    api/v1/wedding-partner-invites/ Partner invite acceptance
    api/v1/guest-invitations/     Guest RSVP response
    api/v1/public/weddings/         Public read endpoint for active wedding summaries
    api/v1/health/                  Implemented health endpoint
    page.tsx                         Renders the sample wedding at `/`
    globals.css                      Shared product surfaces and responsive styling
  components/
    shared/                          Brand, authentication shell, wedding setup form, wedding countdown
    ui/                              UI-primitives guidance only
  lib/
    auth/                            Password hashing, session cookies, server-side account guard
    db/                              Cached Mongoose connection helper
    email/                            Resend client helper
    env/                              Environment validators
    http/                             API response envelopes and AppError
    i18n/                             Locale types; product-page localization remains pending
    r2/                               Cloudflare R2 S3 client helper
  models/                             Auth, wedding, membership, and partner-invite schemas
  modules/auth/                       Auth controller, service, repository, validators, and DTO
  modules/wedding/                    Wedding controller, service, repository, validators, and DTO
  modules/partner-invite/             One-time invite controller, service, and repository
  modules/guest-invitation/           Email delivery, RSVP, and detail-access rules
  types/                              Shared-type guidance only; no shared application types
tests/
  unit/http/api-response.test.ts      Tests for success/error response envelopes
  unit/auth/auth.test.ts              Isolated authentication/security tests
  README.md                           Integration and end-to-end test guidance
scripts/                             Local MongoDB startup, DB provisioning, auth/wedding integration checks
.env.example                          Empty placeholders for service configuration
```

## Important Technical Decisions

- Treat the three documents in `docs/` as the confirmed V1 scope and architecture baseline.
- Wedding is the central domain object. Bride and groom roles are represented through wedding membership. Guests do not get accounts; V1 stores invited email recipients and attendance responses without a broader guest-manager feature.
- The Dinesh & Usha sample remains public. Real wedding slugs show a basic public page; full invitation, story, and venue details require an attending guest invitation or active bride/groom membership. Enforce this in public API responses as well as pages.
- Keep a modular monolith; do not introduce microservices without a demonstrated need.
- Keep API responses in the documented success/error envelope. Validate request data at API boundaries and centralize wedding-membership authorization.
- Store media objects in R2 and their metadata/object keys in MongoDB. Never store R2 credentials in the database.
- The public wedding design preview currently references Stitch-exported imagery from the narrowly scoped `lh3.googleusercontent.com/aida-public/**` path and renders those originals without server optimization. Move wedding/gallery media to R2 as the data-backed gallery workflow is implemented.
- Use expiring, one-time partner-invite tokens and store token hashes. Mutable business records use soft deletion as specified in the DB/API design; email delivery history is audit-like.
- Store timestamps in UTC and use `Asia/Kolkata` as the V1 wedding timezone. Keep secrets server-side.
- Email/password authentication uses the explicit REST API and opaque, revocable MongoDB sessions. Follow `docs/AUTH_DESIGN.md` for cookie lifetime, HMAC token storage, CSRF/origin rules, rate limits, identity uniqueness and future Google linking. `next-auth` is installed but unused; Google/recovery integration remains pending.
- User email and Google identities stay globally unique after soft deletion. Omit absent `googleSubject` fields so the sparse unique index permits multiple password accounts. Bride/Groom roles belong to wedding membership, not registration data.
- Run `npm run db:setup` to provision declared collections/indexes; `autoCreate` and `autoIndex` remain disabled. Authentication and wedding operations fail closed if required indexes are absent. Do not replace additive index creation with automatic index deletion.
- Local development uses a separate loopback-only MongoDB replica set on port 27018, started with `npm run db:local:start`. Git-ignored `.env.development.local` points development at it while `.env.local` retains the Atlas settings and auth secret. See `README.md` for the local setup steps.
- Node.js 22.17 or newer is required consistently by `package.json` and `README.md`; setup/integration scripts use Node's TypeScript stripping.

## Progress Tracking

Read `docs/PROJECT_STATUS.md` for the verified current status, completed and pending work, validation results, and next steps. Keep progress details in that file rather than duplicating them here. Before each implementation step, reread the relevant PRD and design sections and the Next.js guide under `node_modules/next/dist/docs/`.
