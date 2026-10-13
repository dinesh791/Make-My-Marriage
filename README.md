# Make My Marriage

A bilingual web app for Tamil-style weddings. Couples will create and share one wedding link for their invitation, events, website, gallery, shopping checklist, catering details, and livestream.

## Stack

- Next.js App Router and TypeScript
- Explicit REST API under `/api/v1`
- MongoDB Atlas and Mongoose
- Auth.js foundation for Google and credentials authentication
- Cloudflare R2, Resend, and Vercel

## Architecture rules

This is a modular monolith. Route Handlers are HTTP entry points only; controllers handle HTTP concerns, services own business rules, repositories own database access, and Mongoose models live in `src/models`.

React components must not access MongoDB directly. Public APIs return only safe public data. Authentication identifies a user; wedding-membership authorization determines who can manage a wedding.

## Setup

Use Node.js 22.17 or newer. The scaffold pages and health endpoint run without service credentials. Each infrastructure client validates its required environment variables when first used; missing credentials produce a configuration error.

Authentication is not enabled yet. The installed Auth.js package is reserved for the authentication phase; password helpers and cookie settings alone do not authenticate users. The dashboard is currently a public placeholder. Session persistence and Google account linking must be finalized before implementing authentication.

No database models or collections are created by the scaffold. MongoDB automatic collection and index creation are disabled. Never commit secrets. Keep external integrations in `src/lib`, and enforce wedding membership in future protected services.

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in credentials when a related module is implemented.
3. Run `npm run dev`.

## Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm test`
