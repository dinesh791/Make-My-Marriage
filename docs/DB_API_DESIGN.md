# **Make My Marriage** 

Database Design & REST API Design - Version 1.0 

**Status:** Confirmed design baseline for V1, derived from the confirmed PRD and system architecture. 

**Primary stack:** Next.js + TypeScript, Node.js, explicit REST API, MongoDB Atlas, Mongoose, Cloudflare R2, Resend, Vercel. **Architecture:** Modular monolith. 

**Initial audience:** Tamil-style weddings in Tamil Nadu; UI supports Tamil and English. 

## **1. Design Goals and Decisions** 

The database and API are designed to keep V1 simple, maintainable, and ready for later expansion. The central domain object is the Wedding. The invitation, website, events, shopping, catering, gallery, livestream, and email flows all connect back to a Wedding. 

#### **Confirmed decisions:** 

- User collection supports email/password and Google login. 

- Bride and Groom are represented through a WeddingMember relationship. 

- Events are stored in a separate collection. 

- One active invitation per wedding in V1. 

- Default shopping items are seeded when a wedding is created. 

- Gallery uses separate albums and photos collections. 

- Guest invitation delivery and attendance responses are stored without creating guest accounts.

- Partner invitation tokens are expiring and one-time use. 

- REST responses use a consistent success/error envelope. 

- Soft delete is used for mutable business data. 

## **2. Database Architecture** 

MongoDB Atlas is the system of record. Mongoose provides schema definitions, validation, indexes, and data access. 

```
Application
```

- `|` 

- `+--> Mongoose` 

```
|
```

```
+--> users
```

- `+--> weddings` 

- `+--> wedding_members` 

- `+--> wedding_partner_invites` 

- `+--> events` 

- `+--> invitations` 

- `+--> shopping_items` 

- `+--> catering` 

- `+--> albums` 

- `+--> photos` 

- `+--> livestreams` 

```
+--> email_invitations
```

Actual image files are stored in Cloudflare R2. MongoDB stores media metadata and the R2 object key, not the binary file. 

## **3. Collection Inventory** 

|**Collection**|**Purpose**|**Relationship**|
|---|---|---|
|users|Authenticated user identity and profile|1 user -> many memberships|
|weddings|Core wedding record and public identity|1 wedding -> many modules|
|wedding_members|Bride/Groom membership and role|membership join model|
|wedding_partner_invites|One-time partner join invitations|belongs to wedding|
|events|Engagement, Nalangu, Muhurtham, Reception|many per wedding|



Make My Marriage - DB & REST API Design v1.0 

Page 1 

|**Collection**|**Purpose**|**Relationship**|
|---|---|---|
|invitations|Active digital invitation configuration|1 active per wedding in V1|
|shopping_items|Wedding checklist|many per wedding|
|catering|Basic catering information|1 active per wedding in V1|
|albums|Gallery albums|many per wedding|
|photos|Gallery photo metadata|many per album|
|livestreams|External livestream configuration|1 active per wedding in V1|
|email_invitations|Invitation email delivery history|many per wedding|
|guest_invitations|Personal guest links, delivery state, and attendance response|many per wedding|



## **4. Common Database Conventions** 

**IDs:** MongoDB ObjectId values are used for internal primary keys. Public APIs expose IDs as strings. 

**Timestamps:** Mongoose timestamps are enabled with createdAt and updatedAt. 

**Soft delete:** Mutable records use deletedAt: null or a timestamp. Normal queries exclude records where deletedAt is not null. 

**Active-only uniqueness:** Mutable wedding records use MongoDB partial unique indexes so a deleted record does not block a replacement active record. User identity identifiers are an explicit exception: email and Google subject stay reserved after soft deletion to prevent identity reuse. See [Authentication implementation](AUTH_DESIGN.md).

**Enums:** Role, event type, status, and category values are validated at the model and API boundary. 

**Timezone:** Store timestamps as UTC and keep the wedding timezone as Asia/Kolkata for V1. Display dates/times in the wedding timezone. 

## **5. users Collection** 

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|_id|ObjectId|Yes|Primary key|
|email|String|Yes|Lowercased; unique|
|emailVerifiedAt|Date|null|No|Email verification timestamp|
|passwordHash|String|null|No|Present for email/password users|
|googleSubject|String (omitted when absent)|No|Google account subject; sparse unique; never default to null|
|firstName|String|Yes|User display name|
|lastName|String|null|No|Optional|
|profilePhotoKey|String|null|No|R2 object key|
|locale|String|Yes|en or ta; default en|
|status|String|Yes|ACTIVE / SUSPENDED|
|deletedAt|Date|null|No|Soft delete|
|createdAt|Date|Yes|Mongoose timestamp|
|updatedAt|Date|Yes|Mongoose timestamp|



### **User indexes** 

- Unique index on email. 

- Sparse unique index on googleSubject. 

Email and Google identity uniqueness applies to deleted accounts too. Optional Google subjects are omitted so the sparse index does not index repeated null values. The authentication implementation adds operational `auth_sessions` and `auth_rate_limits` collections alongside the 12 domain collections; see [AUTH_DESIGN.md](AUTH_DESIGN.md) for fields, indexes, expiry, and session choices.

- Optional index on status and deletedAt for account administration. 

## **6. weddings Collection** 

Make My Marriage - DB & REST API Design v1.0 

Page 2 

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|_id|ObjectId|Yes|Primary key|
|slug|String|Yes|Unique public URL slug|
|title|String|Yes|Public wedding title|
|brideName|String|null|No|Bride's public display name; editable independently of account profile|
|groomName|String|null|No|Groom's public display name; editable independently of account profile|
|story|String|null|No|Couple story / introduction|
|weddingDate|Date|Yes|Primary wedding date|
|timezone|String|Yes|Default Asia/Kolkata|
|venueName|String|Yes|Main venue|
|venueAddress|String|Yes|Display address|
|mapsUrl|String|null|No|Google Maps link|
|coverPhotoKey|String|null|No|R2 key|
|description|String|null|No|Optional public description|
|status|String|Yes|ACTIVE / ARCHIVED|
|deletedAt|Date|null|No|Soft delete|
|createdAt|Date|Yes|Timestamp|
|updatedAt|Date|Yes|Timestamp|



### **Wedding indexes and constraints** 

- Unique index on slug. 

- Index on status, deletedAt. 

- Slug must be URL-safe and normalized to lowercase. 

- V1 business rule: one active wedding per user; enforce through service logic plus a query/index strategy during implementation. 

## **7. wedding_members Collection** 

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|_id|ObjectId|Yes|Primary key|
|weddingId|ObjectId|Yes|Reference to weddings|
|userId|ObjectId|Yes|Reference to users|
|role|String|Yes|BRIDE / GROOM|
|status|String|Yes|ACTIVE / REMOVED|
|joinedAt|Date|Yes|When membership became active|
|createdAt|Date|Yes|Timestamp|
|updatedAt|Date|Yes|Timestamp|



Recommended active-only partial unique indexes: { weddingId, userId } where status=ACTIVE, and { weddingId, role } where status=ACTIVE. This allows a removed membership to be re-created later without violating uniqueness. 

For the V1 one-active-wedding-per-user rule, also enforce a partial unique index on { userId } where status=ACTIVE. When an account leaves or its wedding is archived, its active membership must be transitioned out of ACTIVE before it can join another wedding.

## **8. wedding_partner_invites Collection** 

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|_id|ObjectId|Yes|Primary key|
|weddingId|ObjectId|Yes|Target wedding|
|invitedByUserId|ObjectId|Yes|Current bride/groom|
|targetRole|String|Yes|BRIDE or GROOM|



Make My Marriage - DB & REST API Design v1.0 

Page 3 

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|tokenHash|String|Yes|Store hash, not raw token|
|expiresAt|Date|Yes|Expiration timestamp|
|usedAt|Date|null|No|One-time use|
|revokedAt|Date|null|No|Optional invalidation|
|createdAt|Date|Yes|Timestamp|



Use a unique index on tokenHash and a TTL index on expiresAt for cleanup if desired. The API must still verify usedAt/revokedAt before accepting a token. 

Current implementation: partner links expire after seven days. Creating a new link revokes an earlier unused link for the same wedding. A unique partial index permits one pending invite per wedding/target role. The raw token is returned only at creation and is not stored; MongoDB keeps its HMAC-SHA256 hash. Acceptance checks expiry, revocation, active wedding/membership, target role, and the one-active-wedding-per-account rule in a transaction. The link is shared manually; partner email delivery is pending.

## **9. events Collection** 

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|_id|ObjectId|Yes|Primary key|
|weddingId|ObjectId|Yes|Reference to wedding|
|type|String|Yes|ENGAGEMENT / NALANGU / MUHURTHAM / RECEPTION, or a unique CUSTOM_<uuid> key|
|title|String|Yes|Display title|
|startsAt|Date|null|UTC instant; required when enabled, null for an incomplete draft|
|endsAt|Date|null|No|Optional|
|timezone|String|Yes|Default Asia/Kolkata|
|venueName|String|null|No|Event venue|
|address|String|null|No|Event address|
|mapsUrl|String|null|No|Google Maps link|
|description|String|null|No|Optional|
|enabled|Boolean|Yes|Controls public display|
|sortOrder|Number|Yes|Display order|
|deletedAt|Date|null|No|Soft delete|



Recommended active-only partial unique index on { weddingId, type } where deletedAt is null. This prevents duplicate active event types while allowing a deleted event to be recreated. 

The event editor initially shows the four predefined types, including unsaved draft cards. Saving a predefined card upserts its type for that wedding. Members may add additional custom event records with unique `CUSTOM_<uuid>` type keys. Each card has Edit and Delete actions. Deleting a saved event sets `deletedAt` and disables it; deleting an unsaved predefined card creates a deleted marker so it remains hidden after reload. Repeating the delete reuses the existing marker. Draft fields may remain incomplete; an event cannot be enabled without a start date and time. Custom events share the existing active-only `{ weddingId, type }` unique index. Custom events receive a sort order above all earlier events, including deleted ones, so adding an event after deletion does not change the remaining cards' order. Editing or deleting any event does not update the wedding's separate `weddingDate` field.

## **10. invitations Collection** 

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|_id|ObjectId|Yes|Primary key|
|weddingId|ObjectId|Yes|One active invitation per wedding in V1|
|templateKey|String|Yes|Example: tamil-traditional|
|message|String|Yes|Member-only saved draft message, maximum 1000 characters|
|revision|Number|Yes|Increments on each draft save; checked on write|
|publishedMessage|String|null|No|Guest-visible snapshot from the last Publish|
|publishedRevision|Number|Yes|Revision copied on Publish; 0 before first publish|
|publishedAt|Date|null|No|When current version published|
|deletedAt|Date|null|No|Soft delete|



Recommended active-only partial unique index on { weddingId } where deletedAt is null. 

The implemented first template is `tamil-traditional`, with a single plain-text message and no photo uploads. Localized messages, themes, and other templates remain future design fields. A missing invitation record or unpublished draft serves the original default message to authorized guests. Save and Publish reject stale revisions with 409, and published reads never return the draft message.

Make My Marriage - DB & REST API Design v1.0 

Page 4 

## **11. shopping_items Collection** 

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|_id|ObjectId|Yes|Primary key|
|weddingId|ObjectId|Yes|Reference|
|category|String|Yes|BRIDE / GROOM / WEDDING|
|title|String|Yes|Item name|
|isDefault|Boolean|Yes|Seeded vs custom|
|completed|Boolean|Yes|Checklist state|
|sortOrder|Number|Yes|Display order|
|deletedAt|Date|null|No|Soft delete|



When a wedding is created, the service seeds a small set of default items. Custom items use isDefault=false. 

## **12. catering Collection** 

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|_id|ObjectId|Yes|Primary key|
|weddingId|ObjectId|Yes|Unique active record in V1|
|catererName|String|null|No|Name|
|phone|String|null|No|Contact|
|foodType|String|null|No|Vegetarian etc.|
|menu|Array|No|Simple menu sections/items|
|notes|String|null|No|Special notes|
|deletedAt|Date|null|No|Soft delete|



Recommended active-only partial unique index on { weddingId } where deletedAt is null. 

## **13. albums Collection** 

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|_id|ObjectId|Yes|Primary key|
|weddingId|ObjectId|Yes|Reference|
|name|String|Yes|Album name|
|type|String|Yes|ENGAGEMENT / NALANGU / MUHURTHAM / RECEPTION / FAMILY /<br>FRIENDS / CUSTOM|
|sortOrder|Number|Yes|Display order|
|deletedAt|Date|null|No|Soft delete|



## **14. photos Collection** 

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|_id|ObjectId|Yes|Primary key|
|weddingId|ObjectId|Yes|Reference|
|albumId|ObjectId|Yes|Reference to albums|
|objectKey|String|Yes|Cloudflare R2 object key|
|mimeType|String|Yes|Allowed image type|



Make My Marriage - DB & REST API Design v1.0 

Page 5 

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|sizeBytes|Number|Yes|File size|
|width|Number|null|No|Optional dimensions|
|height|Number|null|No|Optional dimensions|
|uploadedByType|String|Yes|USER / GUEST|
|uploadedByUserId|ObjectId|null|No|Set for authenticated uploads|
|status|String|Yes|ACTIVE / REJECTED|
|deletedAt|Date|null|No|Soft delete|



The API can derive the browser-facing media URL from objectKey and storage configuration. Do not store R2 credentials in MongoDB. 

## **15. livestreams Collection** 

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|_id|ObjectId|Yes|Primary key|
|weddingId|ObjectId|Yes|Unique active record in V1|
|provider|String|Yes|External provider name|
|title|String|Yes|Display title|
|playbackUrl|String|Yes|Public/player URL|
|enabled|Boolean|Yes|Show/hide Live|
|accessMode|String|Yes|SIMPLE_PASSWORD in V1|
|accessPasswordHash|String|null|No|Never store plain password|
|deletedAt|Date|null|No|Soft delete|



Recommended active-only partial unique index on { weddingId } where deletedAt is null. 

## **16. email_invitations Collection** 

V1 amendment (2026-10-17): the implemented `guest_invitations` collection owns one invitation per wedding/recipient email, using a unique index on `{ weddingId, recipientEmail }` and a unique `tokenHash` index. It stores `weddingId`, normalized `recipientEmail`, HMAC-SHA256 `tokenHash`, `expiresAt`, `sendStatus` (PENDING/SENT/FAILED), `response` (PENDING/ATTENDING/DECLINED), `respondedAt`, `resendMessageId`, `sentAt`, `failedAt`, `errorCode`, and timestamps. The raw token appears only in the emailed personal link and guest access cookie. Attendance response data is retained for the couple's dashboard. The earlier `email_invitations` history table below remains design guidance for more advanced email auditing.

|**Field**|**Type**|**Required**|**Notes**|
|---|---|---|---|
|_id|ObjectId|Yes|Primary key|
|weddingId|ObjectId|Yes|Reference|
|invitationId|ObjectId|Yes|Invitation used|
|recipientEmail|String|Yes|Normalized lowercase|
|status|String|Yes|PENDING / SENT / FAILED|
|resendMessageId|String|null|No|Provider message id|
|sentAt|Date|null|No|Successful send|
|failedAt|Date|null|No|Failed send|
|errorCode|String|null|No|Internal/provider error code|
|createdAt|Date|Yes|Timestamp|



Email history is treated as an audit-like record and should not be freely soft-deleted by normal users. 

## **17. Relationship Model** 

```
users
|
```

```
+----< wedding_members >---- weddings
|
```

Make My Marriage - DB & REST API Design v1.0 

Page 6 

```
+----< events
```

```
+----1 invitations
+----< shopping_items
+----1 catering
+----< albums ----< photos
```

```
+----1 livestreams
```

```
+----< email_invitations
|
```

```
+----< wedding_partner_invites
```

This keeps Wedding as the central aggregate while allowing each feature to evolve independently. 

## **18. Key Indexes Summary** 

|**Collection**|**Index**|**Type / reason**|
|---|---|---|
|users|email|Unique|
|users|googleSubject|Sparse unique|
|weddings|slug|Unique public lookup|
|wedding_members|weddingId + userId|Partial unique where status=ACTIVE|
|wedding_members|weddingId + role|Partial unique where status=ACTIVE|
|wedding_members|userId|Partial unique where status=ACTIVE; enforces one active wedding per account|
|wedding_partner_invites|tokenHash|Unique lookup|
|wedding_partner_invites|expiresAt|TTL / cleanup|
|events|weddingId + type|Partial unique where deletedAt is null|
|invitations|weddingId|Partial unique where deletedAt is null|
|shopping_items|weddingId + category + sortOrder|List ordering|
|albums|weddingId + sortOrder|Gallery ordering|
|photos|albumId + createdAt|Gallery listing|
|livestreams|weddingId|Partial unique where deletedAt is null|
|catering|weddingId|Partial unique where deletedAt is null|
|email_invitations|weddingId + createdAt|History listing|
|guest_invitations|weddingId + recipientEmail|Unique recipient per wedding|
|guest_invitations|tokenHash|Unique private-link lookup|



Make My Marriage - DB & REST API Design v1.0 

Page 7 

## **19. REST API Conventions** 

**Base path:** /api/v1 

**Content type:** application/json except file-upload flows. 

**Authentication:** The email/password implementation uses a secure HTTP-only cookie with an opaque, revocable MongoDB session. The browser receives a random token; MongoDB stores its HMAC digest and expiry. See [AUTH_DESIGN.md](AUTH_DESIGN.md). Google sign-in and recovery remain pending.

**Validation:** Validate all request parameters and body fields at the API boundary. Zod is recommended for request DTO validation. 

**Authorization:** Every protected wedding endpoint verifies that the authenticated user is an ACTIVE BRIDE or GROOM member of that wedding. 

**Public API:** Public wedding endpoints use slug and return only safe display data. 

## **20. Standard REST Response Format** 

### **Success** 

```
{
"success": true,
"data": { ... },
"message": "Wedding created successfully"
}
```

### **Error** 

```
{
"success": false,
"error": {
"code": "WEDDING_NOT_FOUND",
"message": "Wedding not found",
"details": null
}
}
```

List responses can use data.items plus pagination metadata when required. 

## **21. Pagination and Filtering** 

For list endpoints, V1 can use simple page-based pagination: 

```
?page=1&limit;=20
```

Recommended maximum limit: 50. Public gallery can also support albumId and sort order filters. Future versions can move to cursor pagination if needed. 

## **22. Authentication API** 

|**Method**|**Endpoint**|**Auth**|**Purpose**|
|---|---|---|---|
|POST|/api/v1/auth/register|Public|Create email/password user|
|POST|/api/v1/auth/login|Public|Create authenticated session|
|POST|/api/v1/auth/google|Public|Start/complete Google login flow|
|POST|/api/v1/auth/logout|User|Clear current session|
|GET|/api/v1/auth/me|User|Return current user|
|POST|/api/v1/auth/verify-email|Public|Verify email token if enabled|
|POST|/api/v1/auth/forgot-password|Public|Request reset email|
|POST|/api/v1/auth/reset-password|Public|Reset password|



## **23. User API** 

Make My Marriage - DB & REST API Design v1.0 

Page 8 

|**Method**|**Endpoint**|**Auth**|**Purpose**|
|---|---|---|---|
|GET|/api/v1/users/me|User|Get profile|
|PATCH|/api/v1/users/me|User|Update profile|
|POST|/api/v1/users/me/photo|User|Create R2 upload flow for profile photo|



## **24. Wedding API** 

|**Method**|**Endpoint**|**Auth**|**Purpose**|
|---|---|---|---|
|POST|/api/v1/weddings|User|Create wedding and seed defaults|
|GET|/api/v1/weddings|User|List current user's active wedding|
|GET|/api/v1/weddings/:weddingId|Member|Get admin wedding details|
|PATCH|/api/v1/weddings/:weddingId|Member|Update wedding details|
|DELETE|/api/v1/weddings/:weddingId|Member|Soft delete / archive wedding|
|POST|/api/v1/weddings/:weddingId/partner-invites|Member|Create partner invite|
|POST|/api/v1/wedding-partner-invites/:token/accept|Authenticated<br>partner|Join wedding|



### **Create wedding request** 

```
{
```

```
"title": "Dinesh & Usha Wedding",
```

```
"story": "We are getting married...",
```

```
"weddingDate": "2027-01-20T00:00:00.000Z",
```

- `"timezone": "Asia/Kolkata",` 

- `"venueName": "Sivan Mahal",`

```
"venueAddress": "Salem, Tamil Nadu",
```

```
"mapsUrl": "https://maps.google.com/..."
```

```
}
```

Creation flow also creates the creator's wedding_members record, default shopping items, a default invitation draft, and optional default gallery albums. 

## **25. Event API** 

|**Method**|**Endpoint**|**Auth**|**Purpose**|
|---|---|---|---|
|GET|/api/v1/weddings/:weddingId/events|Member|List events|
|PUT|/api/v1/weddings/:weddingId/events/:type|Member|Save one predefined event or draft idempotently|
|DELETE|/api/v1/weddings/:weddingId/events/:type|Member|Soft delete a predefined event, including an unsaved default card|
|POST|/api/v1/weddings/:weddingId/events|Member|Create a custom wedding event; immediate visibility requires a start date/time|
|PATCH|/api/v1/weddings/:weddingId/events/custom/:eventId|Member|Edit a custom wedding event|
|DELETE|/api/v1/weddings/:weddingId/events/custom/:eventId|Member|Soft delete a custom wedding event|
|GET|/api/v1/events/:eventId|Member|Get event|
|PATCH|/api/v1/events/:eventId|Member|Update event|
|DELETE|/api/v1/events/:eventId|Member|Soft delete event|



The Wedding Events UI provides four initial event cards and an Add Wedding Event dialog for custom ceremonies. The dialog defaults to a draft and offers a checkbox for immediate guest visibility when a start date/time is supplied. Cards use icon buttons to edit or to delete after confirmation; deleted records are excluded from member lists and the guest schedule.

## **26. Invitation API** 

|**Method**|**Endpoint**|**Auth**|**Purpose**|
|---|---|---|---|
|GET|/api/v1/weddings/:weddingId/invitation|Member|Get invitation configuration|
|PATCH|/api/v1/weddings/:weddingId/invitation|Member|Save message draft with expected revision|
|POST|/api/v1/weddings/:weddingId/invitation/publish|Member|Publish saved draft revision|
|GET|/api/v1/weddings/:weddingId/invitation/preview|Member|Preview invitation data|
|GET|/api/v1/public/weddings/:slug/invitation|Attending guest or member|Published invitation only; locked visitors receive null|
|POST|/api/v1/weddings/:weddingId/invitation/emails|Member|Send email invitation(s)|
|GET|/api/v1/weddings/:weddingId/invitation/emails|Member|List recipient delivery and attendance status|
|POST|/api/v1/guest-invitations/:token/respond|Guest token|Record attendance response; attending sets guest access cookie|



Make My Marriage - DB & REST API Design v1.0 

Page 9 

|**Method**|**Endpoint**|**Auth**|**Purpose**|
|---|---|---|---|
|GET|/api/v1/weddings/:weddingId/invitation/emails|Member|View email send history|



## **27. Email Invitation API** 

### **Send invitation** 

```
POST /api/v1/weddings/:weddingId/invitation/emails
```

```
{
```

```
"recipients": [
```

```
"relative1@example.com",
```

```
"friend@example.com"
```

```
],
```

```
"locale": "en"
```

```
}
```

The API validates up to 10 recipient addresses per request, creates PENDING guest records, sends through Resend, updates each record to SENT or FAILED, and returns per-recipient status. The email contains only the wedding title, short invitation message, attendance prompt, and response button. Five send requests per wedding per day are allowed in the initial implementation. A failed send can be retried, rotating its token. Guests respond through a personal email link without accounts. An Attending response unlocks detailed wedding content; a Can't attend response records the decision without unlocking it.

### **Safeguards** 

- Rate limit sending per wedding/user. 

- Enforce a reasonable per-request recipient limit. 

- Normalize and validate email addresses. 

- Never expose Resend API keys to the client. 

## **28. Shopping API** 

|**Method**|**Endpoint**|**Auth**|**Purpose**|
|---|---|---|---|
|GET|/api/v1/weddings/:weddingId/shopping-items|Member|List items|
|POST|/api/v1/weddings/:weddingId/shopping-items|Member|Add custom item|
|PATCH|/api/v1/shopping-items/:itemId|Member|Update item/completion|
|DELETE|/api/v1/shopping-items/:itemId|Member|Soft delete item|



## **29. Catering API** 

|**Method**|**Endpoint**|**Auth**|**Purpose**|
|---|---|---|---|
|GET|/api/v1/weddings/:weddingId/catering|Member|Get catering details|
|PUT|/api/v1/weddings/:weddingId/catering|Member|Create/update catering|
|DELETE|/api/v1/weddings/:weddingId/catering|Member|Soft delete catering|



Make My Marriage - DB & REST API Design v1.0 

Page 10 

## **30. Gallery and Cloudflare R2 API** 

|**Method**|**Endpoint**|**Auth**|**Purpose**|
|---|---|---|---|
|GET|/api/v1/weddings/:weddingId/albums|Member|List albums|
|POST|/api/v1/weddings/:weddingId/albums|Member|Create album|
|PATCH|/api/v1/albums/:albumId|Member|Update album|
|DELETE|/api/v1/albums/:albumId|Member|Soft delete album|
|POST|/api/v1/weddings/:weddingId/photos/upload-init|Member/Guest|Create signed R2 upload|
|POST|/api/v1/weddings/:weddingId/photos/upload-complete|Member/Guest|Finalize upload and metadata|
|GET|/api/v1/weddings/:weddingId/albums/:albumId/photos|Member|List admin gallery|
|DELETE|/api/v1/photos/:photoId|Member|Soft delete photo|



### **Public gallery API** 

|**Method**|**Endpoint**|**Auth**|**Purpose**|
|---|---|---|---|
|GET|/api/v1/public/weddings/:slug|Public|Public wedding summary|
|GET|/api/v1/public/weddings/:slug/events|Public|Public events|
|GET|/api/v1/public/weddings/:slug/invitation|Public|Public invitation data|
|GET|/api/v1/public/weddings/:slug/albums|Public|Public albums|
|GET|/api/v1/public/weddings/:slug/albums/:albumId/photos|Public|Public photos|
|POST|/api/v1/public/weddings/:slug/photos/upload-init|Public|Guest upload ticket|
|POST|/api/v1/public/weddings/:slug/photos/upload-complete|Public|Guest upload finalization|



Public endpoints return a basic teaser with the venue name but without the street address or map link until an attending guest token or active bride/groom membership is verified. The Dinesh & Usha sample remains public. Admin-only fields such as deletedAt, provider message IDs, storage-management metadata, and internal flags are excluded. Future events, gallery, and livestream endpoints must apply the same detail-access rule before serving protected content.

Guest photo upload endpoints must require an attending invitation access check; a public slug alone is not enough to authorize uploads under the amended V1 policy.

### **R2 upload flow** 

`1. Client requests upload-init.` 

`2. API validates wedding/album and file metadata.` 

`3. API creates short-lived signed upload information for R2.` 

`4. Client uploads directly to Cloudflare R2.` 

`5. Client calls upload-complete.` 

`6. API verifies/records the object and creates the photos document.` 

This keeps large files away from the main application request path. 

## **31. Livestream API** 

|**Method**|**Endpoint**|**Auth**|**Purpose**|
|---|---|---|---|
|GET|/api/v1/weddings/:weddingId/livestream|Member|Get livestream configuration|
|PUT|/api/v1/weddings/:weddingId/livestream|Member|Create/update livestream|
|DELETE|/api/v1/weddings/:weddingId/livestream|Member|Soft delete livestream|
|POST|/api/v1/public/weddings/:slug/livestream/access|Public|Validate shared access<br>password|



## **32. Public Wedding API** 

The public wedding endpoint returns only active, non-deleted weddings. Its unauthenticated teaser contains the slug, title, bride/groom names, wedding date/timezone, and venue name. Story, street address, and map link are returned only for an attending guest or active bride/groom member. The Dinesh & Usha sample page is a separate static preview; stored weddings supply the live API and `/w/[slug]` pages.

|**Method**|**Endpoint**|**Purpose**|
|---|---|---|
|GET|/api/v1/public/weddings/:slug|Public wedding summary|
|||data|
|GET|/api/v1/public/weddings/:slug/events|Events|



Make My Marriage - DB & REST API Design v1.0 

Page 11 

|**Method**|**Endpoint**|**Purpose**|
|---|---|---|
|GET|/api/v1/public/weddings/:slug/invitation|Invitation|
|GET|/api/v1/public/weddings/:slug/albums|Gallery albums|
|GET|/api/v1/public/weddings/:slug/albums/:albumId/photos|Gallery photos|
|GET|/api/v1/public/weddings/:slug/livestream|Live availability metadata|



## **33. Standard HTTP Status Codes** 

|**Status**|**Use**|
|---|---|
|200 OK|Successful read/update|
|201 Created|Successful creation|
|204 No Content|Successful delete where no body is returned|
|400 Bad Request|Invalid input or malformed request|
|401 Unauthorized|Not authenticated / invalid session|
|403 Forbidden|Authenticated but not allowed|
|404 Not Found|Resource not found or not visible|
|409 Conflict|Unique constraint or state conflict|
|422 Unprocessable Entity|Validation error|
|429 Too Many Requests|Rate limit exceeded|
|500 Internal Server Error|Unexpected server failure|



## **34. Error Code Catalog** 

|**Code**|**Meaning**|
|---|---|
|AUTH_INVALID_CREDENTIALS|Login credentials are invalid|
|AUTH_SESSION_REQUIRED|Authenticated session required|
|FORBIDDEN_WEDDING_MEMBER|User is not a member of the wedding|
|WEDDING_NOT_FOUND|Wedding does not exist or is deleted|
|WEDDING_SLUG_TAKEN|Public slug already exists|
|WEDDING_PARTNER_INVITE_INVALID|Partner invite is invalid/revoked/used|
|WEDDING_PARTNER_INVITE_EXPIRED|Partner invite expired|
|EVENT_TYPE_EXISTS|Predefined event already exists for wedding|
|INVITATION_NOT_FOUND|Invitation does not exist|
|PHOTO_UPLOAD_INVALID|File metadata or type is invalid|
|PHOTO_NOT_FOUND|Photo not found|
|EMAIL_SEND_FAILED|Resend delivery request failed|
|RATE_LIMITED|Request frequency limit exceeded|



## **35. Soft Delete Strategy** 

Soft deletion is implemented using deletedAt. A deleted document remains available for recovery/audit unless retention policies later remove it permanently. 

Default repository behavior: filter out deletedAt != null. Explicit internal/admin queries can include deleted records when required. 

Make My Marriage - DB & REST API Design v1.0 

Page 12 

For sensitive operational data such as email delivery history, prefer immutable audit records over user-triggered deletion. 

## **36. Sample Public Wedding Response** 

```
GET /api/v1/public/weddings/dinesh-usha
```

```
{
"success": true,
"data": {
"slug": "dinesh-usha",
"title": "Dinesh & Usha Wedding",
"weddingDate": "2027-01-20T00:00:00.000Z",
"timezone": "Asia/Kolkata",
"venue": {
"name": "Sivan Mahal",
"address": "Salem, Tamil Nadu",
"mapsUrl": "https://maps.google.com/..."
}
},
"message": null
}
```

## **37. Sample Wedding Member Authorization Check** 

`1. Read authenticated user id from session.` 

`2. Load wedding_members where:` 

```
userId = currentUserId
weddingId = requestedWeddingId
status = ACTIVE
```

`3. Require role BRIDE or GROOM.` 

`4. Reject with 403 if no active membership.` 

Keep this authorization rule centralized in middleware/service code instead of repeating it ad hoc in every controller. 

## **38. API Module Structure** 

```
server/
routes/
auth.routes.ts
wedding.routes.ts
event.routes.ts
invitation.routes.ts
shopping.routes.ts
catering.routes.ts
gallery.routes.ts
livestream.routes.ts
public.routes.ts
controllers/
services/
repositories/
middleware/
validators/
dto/
```

Controllers stay thin. Services contain business rules. Repositories handle MongoDB access. Validators handle request schemas. 

## **39. Implementation Sequence** 

Recommended build order: 

1. users + authentication 

2. weddings + wedding_members + partner invites 

3. events 

4. invitation + public wedding API 

5. shopping 

6. catering 

7. albums + photos + R2 upload flow 

8. email invitations + Resend 

Make My Marriage - DB & REST API Design v1.0 

Page 13 

9. livestream 

10. API hardening, indexes, rate limits, observability, and tests 

This order builds the central Wedding domain first, then adds modules around it. 

## **40. Final V1 DB + API Baseline** 

The V1 design uses MongoDB Atlas with focused collections including the 2026-10-17 guest invitation/RSVP amendment, explicit versioned REST APIs, a Wedding-centered domain model, Cloudflare R2 for images, Resend for invitation emails, and simple role-based authorization for Bride/Groom members.

**Key principle:** Store core wedding information once, expose safe public read models, keep admin operations authenticated, and keep guest access account-free. 

#### **Status: CONFIRMED DB + REST API DESIGN BASELINE - Version 1.0** 

Make My Marriage - DB & REST API Design v1.0 

Page 14 

