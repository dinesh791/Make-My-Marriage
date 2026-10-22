# **Make My Marriage** 

System Design & Architecture — Version 1.0 

## **1. Architecture Overview** 

Make My Marriage V1 uses a **modular monolith** . The application has a Next.js + TypeScript frontend and an explicit REST API running on Node.js. MongoDB Atlas is the primary database, Cloudflare R2 stores media files, Resend handles email, and Vercel is the deployment platform. 

The design keeps V1 simple while maintaining clear module boundaries for future expansion. 

## **2. Confirmed Technology Stack** 

|**Layer**|**Technology**|
|---|---|
|Frontend|Next.js + TypeScript|
|Backend / Runtime|Node.js|
|API|Explicit REST API|
|Database|MongoDB Atlas|
|ODM|Mongoose|
|Authentication|Email/Password + Google|
|File Storage|Cloudflare R2|
|Deployment|Vercel|
|Email|Resend|
|Languages|Tamil + English|
|Architecture|Modular Monolith|



## **3. High-Level Architecture** 

`Browser` → `Next.js Frontend` → `REST API` → `Services / Business Logic` → `Repositories / Data Access` → `MongoDB Atlas` 

Media flow: Browser → upload flow → Cloudflare R2, with photo metadata in MongoDB. Email flow: Application → Resend → recipient. 

## **4. Architecture Layers** 

**Presentation:** Next.js pages, React components, dashboard, public wedding pages, invitation preview. 

**Primary application surfaces:** account access (`/login`, `/register`), couple dashboard (`/dashboard`), guest RSVP (`/invitation/[token]`), and wedding website (`/w/[slug]`). There is no marketing landing page in V1; `/` and `/w/dinesh-usha` remain ungated sample previews. Real weddings show a basic public page and require an attending guest invitation or bride/groom membership for detailed invitation content. Guests do not create accounts.

**API:** Versioned REST endpoints under **/api/v1** , handling HTTP requests, validation, authentication, authorization, and response formatting. 

**Service:** Business rules such as wedding creation, partner joining, event management, invitations, gallery operations, and email invitations. 

**Repository:** Mongoose-based MongoDB access isolated from business logic. 

**Infrastructure:** MongoDB Atlas, Cloudflare R2, Resend, authentication/session infrastructure, and Vercel. 

## **5. Core Modules** 

Authentication • User • Wedding • Events • Invitation • Wedding Website • Shopping • Catering • Gallery • Livestream • Internationalization • Email 

## **6. REST API** 

```
/api/v1/auth
```

```
/api/v1/users
```

```
/api/v1/weddings
```

```
/api/v1/events
```

```
/api/v1/invitations
```

```
/api/v1/shopping
```

```
/api/v1/catering
```

```
/api/v1/gallery
```

```
/api/v1/livestream
```

```
/api/v1/email
```

Use standard HTTP methods such as GET, POST, PATCH/PUT, and DELETE, with consistent JSON success and error formats. 

## **7. Authentication & Authorization** 

Authentication supports email/password and Google login. V1 roles are BRIDE and GROOM. Both can manage their wedding. Guests do not have application accounts. 

The first implemented slice supports email/password through the versioned REST API and revocable MongoDB sessions in HTTP-only cookies. Google login remains a V1 requirement awaiting provider integration. Session/counter infrastructure, identity uniqueness, and request protections are recorded in [AUTH_DESIGN.md](AUTH_DESIGN.md).

V1 rule: one user has one active wedding. This can be relaxed later. 

## **8. Wedding Membership** 

Use a WeddingMember relationship: User → WeddingMember → Wedding. WeddingMember contains userId, weddingId, and role (BRIDE or GROOM). This keeps ownership and authorization flexible. 

## **9. Partner Joining** 

Bride/Groom registers → creates wedding → partner invitation link/token is generated → partner opens link → registers/logs in → joins wedding → both can manage the wedding. 

Partner joining is separate from normal wedding invitations sent to relatives and friends. 

## **10. Public Wedding Website** 

Each wedding receives a unique slug such as **/w/dinesh-usha** . Anyone with the link can view basic couple/date/venue-name information. Full invitation, story, street address, map link, and detailed venue content require bride/groom membership or an attending guest invitation. Guest access is checked on the server for pages and REST responses; hiding a UI section alone does not protect it. The sample wedding remains a public preview.

The four predefined event cards can be saved as drafts. Published events require a start date and time and are included in the detailed wedding page and public events API only after the same attending-guest or member access check. The wedding's main date and countdown do not change when a Muhurtham event is edited.

## **11. Invitation & Email** 

Predefined invitation templates use the central wedding/event data. Sharing supports WhatsApp, copy link, and email. 

**Email flow:** Bride/Groom enters recipient email → REST API validates and rate limits request → invitation service stores a token hash and sends a short email through Resend with the wedding title, invitation message, attendance prompt, and response button → the linked RSVP page shows the couple, date, and venue name and lets the recipient answer Attending or Can't attend → an Attending answer sets an HTTP-only guest access cookie for the full wedding invitation and detailed venue information. Recipients do not need an account. The personal link acts as a bearer secret and should not be forwarded; strict mailbox verification is a future privacy enhancement.

## **12. MongoDB Atlas** 

Suggested V1 collections: 

```
users • weddings • wedding_members • events • invitations • shopping_items • catering • photos • livestreams
```

Mongoose provides schemas, validation, models, and database access. 

## **13. Cloudflare R2 Media Storage** 

Actual image/file objects are stored in Cloudflare R2; MongoDB stores metadata and references. Example logical path: weddings/{weddingId}/gallery/{albumId}/{file}. 

Uploads should use file type/size validation, rate limiting, and appropriate access controls. Signed upload URLs can be used for direct client uploads. 

## **14. Guest Photo Upload** 

Attending invited guests can upload photos without accounts after guest access is checked. V1 should include file validation, size limits, rate limiting, and bride/groom delete controls.

## **15. Livestream** 

V1 will not build a custom video platform. The application stores livestream configuration and points to an external streaming provider. The public website shows the Live section when enabled. 

## **16. Internationalization** 

English and Tamil are supported from the beginning. UI text should use translation keys so future languages can be added without major rewrites. 

## **17. Suggested Project Structure** 

`make-my-marriage/` III `app/   # Next.js frontend routes` III `components/   # shared React UI` 

III `modules/   # auth, wedding, events, invitation, shopping, catering, gallery, livestream` III `server/   # REST routes, controllers, services, repositories, middleware` III `models/   # Mongoose models` III `lib/   # DB, auth, R2, Resend, i18n, utilities` III `types/   # TypeScript types` 

## **18. Deployment** 

`Next.js / Node.js application` → `Vercel MongoDB` → `MongoDB Atlas Images/files` → `Cloudflare R2 Email` → `Resend` 

Secrets and environment variables remain server-side and are never exposed to the browser. 

## **19. Core Request Flows** 

**Admin:** Browser → Next.js UI → REST API → Auth/Authorization → Service → Repository → MongoDB. 

**Public wedding:** Browser → Next.js public route → data/API layer → wedding data → public page. 

**Photo upload:** Browser → controlled upload flow → Cloudflare R2 → photo metadata in MongoDB. 

**Email invitation:** Bride/Groom → REST API → invitation service → Resend → recipient → attendance response → access-controlled wedding details.

## **20. Architecture Principles** 

- Start simple; no microservices in V1. 

- Keep module boundaries clean. 

- Use explicit versioned REST APIs. 

- Store wedding information once and reuse it. 

- Keep media files out of MongoDB. 

- Separate authentication from authorization. 

- Keep guests account-free in V1. 

- Support Tamil + English from the beginning. 

- Scale only when requirements justify it. 

## **21. Future Scalability** 

The system remains a modular monolith initially. If the product grows, modules such as gallery processing, notifications, marketplace, payments, or livestream management can later be extracted into independent services. 

**Architecture principle:** Start simple → keep boundaries clean → scale only when requirements justify it. 

Status: CONFIRMED SYSTEM DESIGN BASELINE — Version 1.0 

