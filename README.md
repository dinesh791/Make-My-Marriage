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

Email/password registration, login, logout, and current-user lookup are implemented. A signed-in user can create one wedding, choose Bride/Groom, and edit its saved details. A partner can join through a private invitation link. The couple can email personal guest invitations, see attendance responses, and unlock the full wedding page for attending guests. Sending to relatives requires a verified Resend sender and a publicly reachable app URL; the local Resend test sender is limited to the account owner's inbox. Google sign-in and password recovery remain pending. The installed `next-auth` package is unused; session behavior and the future Google linking requirements are documented in [docs/AUTH_DESIGN.md](docs/AUTH_DESIGN.md).

MongoDB automatic collection and index creation are disabled. Run the explicit setup command before using authentication or wedding features; it creates the declared auth, wedding, partner-invite, guest-invitation, event, invitation, and shopping collections and adds their indexes without seeding accounts or dropping existing data. Never commit secrets. Keep external integrations in `src/lib`, and enforce wedding membership in protected services.

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` if it does not already exist. Set `MONGODB_URI` with an explicit database name, a random `AUTH_SECRET` of at least 32 characters, and `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Google/R2/Resend credentials are not required for email/password authentication.
3. For local MongoDB, follow the steps below. For Atlas, allow your current IP and run `npm run db:setup`.
4. Run `npm run dev` and open `http://localhost:3000/register`. Use this exact origin for forms; if the port/hostname changes, update `NEXT_PUBLIC_APP_URL` and restart the server.

## Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run db:setup` — provision declared collections/indexes; preserves existing data.
- `npm run db:local:start` — start or reconnect to the project-only local MongoDB replica set on port 27018.
- `npm run test:auth:integration` — verify the running local app against `makemymarriage_dev`; temporary accounts/sessions are cleaned up automatically.
- `npm run test:wedding:integration` — verify local wedding persistence and membership; its temporary account and wedding are cleaned up.

With the local app and database running, run `node --experimental-strip-types scripts/verify-local-events.mjs --keep` followed by `node --experimental-strip-types scripts/verify-local-invitation.mjs` for the event and invitation HTTP flow. The first command keeps disposable local fixtures for the second; the second removes them when complete.

Wedding Events is the only place to create and edit events. Upcoming Events on the dashboard lists enabled events with dates. The Invitation workspace offers a Traditional Tamil preview and editable message. Save draft keeps changes private; Publish shows the saved message to attending guests on the live wedding page. Photo uploads and other templates are pending.

## Local database, step by step

MongoDB Compass is a viewer and editor for a database. The application also needs MongoDB Server; this computer has it installed. The local setup uses a separate replica set because registration and wedding creation use database transactions. It listens only on `127.0.0.1:27018` and stores development data in Git-ignored `.local/mongodb/data`. The existing MongoDB Windows service on port 27017 is left alone.

1. Run `npm run db:local:start`. Repeat this after a reboot before starting the app. On Windows the script finds the installed `mongod.exe`; on other systems it uses `mongod` from PATH. You can set `MONGOD_BIN` if needed.
2. Create Git-ignored `.env.development.local` containing `MONGODB_URI=mongodb://127.0.0.1:27018/makemymarriage_dev?replicaSet=mmm_local&directConnection=true`. Keep `AUTH_SECRET` and `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local`. Development loads both files, with the local database URI taking precedence; the Atlas URI in `.env.local` is preserved.
3. Run `npm run db:setup`. This creates `users`, `auth_sessions`, `auth_rate_limits`, `weddings`, `wedding_members`, `wedding_partner_invites`, `guest_invitations`, `events`, `invitations`, and `shopping_items` with their indexes. It does not create accounts or wedding records. Shopping suggestions are added when a member first opens the checklist.
4. Run `npm run dev`. Open `http://localhost:3000/register`, create an account, sign out, and sign in again. Then create a wedding in the dashboard. Google sign-in and password recovery are still pending.
5. In Compass, connect with `mongodb://127.0.0.1:27018/makemymarriage_dev?replicaSet=mmm_local&directConnection=true` and open `makemymarriage_dev` to inspect the collections. Passwords are stored as hashes; sessions store token digests.
6. With the app running, run `npm run test:auth:integration` and `npm run test:wedding:integration` for temporary end-to-end checks. The scripts first confirm the running app reads the configured development database, then remove their own test accounts and weddings. Restart the app after changing either environment file.

Local data and Atlas data do not synchronize automatically. Use local MongoDB for development and Atlas for hosted deployment.

## Provision Atlas from PowerShell

When `.env.development.local` points to local MongoDB and `.env.local` holds the Atlas `MONGODB_URI`, set `NODE_ENV` to `production` for the setup command so it reads the Atlas value. First verify the target database is the intended Atlas database; never paste or print the full URI. Then run:

```powershell
$previousNodeEnv = $env:NODE_ENV
$env:NODE_ENV = "production"
try { npm run db:setup } finally {
  if ($null -eq $previousNodeEnv) { Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue }
  else { $env:NODE_ENV = $previousNodeEnv }
}
```

The script adds missing collections and indexes without dropping records or copying local data. Confirm that its output includes `Ready: shopping_items` and `Database setup completed` before deploying the Shopping feature. In Atlas, the empty `shopping_items` collection appears in `makemymarriage_dev`; a signed-in bride or groom first opening Shopping creates the suggested items for that wedding.

If login shows “We couldn't complete that request. Please try again shortly.” during local development, first run `npm run db:local:start` and retry. The website can run while MongoDB is stopped, but authentication requires the database. The project database does not start automatically after a reboot. If the response changes to “Email or password is incorrect,” check your credentials and confirm the account was registered in the local database rather than Atlas.
