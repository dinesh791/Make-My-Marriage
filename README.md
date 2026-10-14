# Make My Marriage

A bilingual web app for Tamil-style weddings. Couples will create and share one wedding link for their invitation, events, website, gallery, shopping checklist, catering details, and livestream.

## Stack

- Next.js App Router and TypeScript
- Explicit REST API under `/api/v1`
- MongoDB Atlas and Mongoose
- Email/password authentication with revocable MongoDB sessions (Google sign-in pending)
- Cloudflare R2, Resend, and Vercel

## Architecture rules

This is a modular monolith. Route Handlers are HTTP entry points only; controllers handle HTTP concerns, services own business rules, repositories own database access, and Mongoose models live in `src/models`.

React components must not access MongoDB directly. Public APIs return only safe public data. Authentication identifies a user; wedding-membership authorization determines who can manage a wedding.

## Setup

Use Node.js 22.17 or newer. The scaffold pages and health endpoint run without service credentials. Each infrastructure client validates its required environment variables when first used; missing credentials produce a configuration error.

Email/password registration, login, logout, and current-user lookup are implemented. A signed-in user can create one wedding, choose Bride/Groom, and save its date and venue; the dashboard displays saved wedding details. Partner invitations, editing, Google sign-in, and recovery remain pending. The installed `next-auth` package is unused; session behavior and the future Google linking requirements are documented in [docs/AUTH_DESIGN.md](docs/AUTH_DESIGN.md).

MongoDB automatic collection and index creation are disabled. Run the explicit setup command before using authentication or wedding features; it creates the declared auth, `weddings`, and `wedding_members` collections and adds their indexes without seeding accounts or dropping existing data. Never commit secrets. Keep external integrations in `src/lib`, and enforce wedding membership in protected services.

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` if it does not already exist. Set `MONGODB_URI` with an explicit database name, a random `AUTH_SECRET` of at least 32 characters, and `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Google/R2/Resend credentials are not required for email/password authentication.
3. Allow your current IP in Atlas and run `npm run db:setup`.
4. Run `npm run dev` and open `http://localhost:3000/register`. Use this exact origin for forms; if the port/hostname changes, update `NEXT_PUBLIC_APP_URL` and restart the server.

## Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run db:setup` — provision declared collections/indexes; preserves existing data.
- `npm run test:auth:integration` — verify the running local app against `makemymarriage_dev`; temporary accounts/sessions are cleaned up automatically.
