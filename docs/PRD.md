# **Make My Marriage** 

Confirmed Product Requirements Document (PRD) — Version 1.1

V1 guest invitation amendment (2026-10-17): the couple sends personal email invitations. Recipients respond Attending or Can't attend without creating accounts. A basic wedding page remains public; the full invitation and detailed venue/story sections unlock only after an Attending response. Guest email/response records are therefore part of V1, while a broad Guest Manager remains out of scope. The Dinesh & Usha sample remains an ungated preview.

## **1. Product Overview** 

**Product:** Make My Marriage **Initial target:** Tamil Nadu / Tamil-style weddings **Platform:** Web application **Languages:** Tamil + English **Primary users:** Bride and Groom 

**Goal:** Provide one simple place for a bride and groom to create and share their wedding, including invitations, events, website, shopping, catering information, photos, and livestream access. 

**Application experience:** V1 is a product application with login/sign-up, a couple dashboard, and a public wedding website; a separate marketing landing page is not part of the V1 application. For the current sample-data preview, `/` directly renders the Dinesh & Usha wedding website and keeps the browser at the root URL. The same public sample is also available to guests without accounts at `/w/dinesh-usha` and the dynamic `/w/[slug]` route. Its Login link opens `/login`; the login page provides a sign-up link. Choose a production root destination after real wedding slugs and hosting behavior are defined.

## **2. User Roles** 

**Bride** and **Groom** are the only wedding administrators. Both can manage the wedding. 

**Guests:** Guests do not need an account. An emailed personal link lets a relative respond to the invitation. A basic wedding page is public; attending relatives can view full invitation details. Store only the recipient address and delivery/attendance response needed for this flow. There is no broader Guest Manager in V1.

## **3. Authentication** 

- Email + Password 

- Google Login 

After registration, the user identifies as Bride or Groom. 

## **4. Wedding Creation & Partner Joining** 

Example flow: Bride creates an account → creates the wedding → system generates a partner invitation link → Groom opens the link → creates/logs into an account → joins the wedding. Both become wedding administrators. 

Each account is limited to one active wedding in V1. 

## **5. Wedding Information** 

- Bride name and photo 

- Groom name and photo 

- Couple photo 

- Short introduction/story 

- Wedding date 

- Main wedding venue 

- Venue address 

- Google Maps location 

- Basic wedding description 

Guest count, budget, and other advanced information are excluded from V1. 

## **6. Wedding Events** 

V1 provides these predefined Tamil wedding events: 

- Engagement 

- Nalangu 

• Muhurtham 

- Reception 

Each event can contain a title, date, time, venue, address, map link, and description. In addition to the four predefined cards, the couple can add, edit, and enable or disable custom wedding events.

New weddings show all four predefined event cards. Couples may add custom ceremonies from the Wedding Events workspace. The Add Event form saves a draft by default; couples may instead check Show this event to attending guests when a date and time are provided. Each card has Edit and Delete icon actions. Deleting a predefined or custom card removes it from the workspace and guest schedule after confirmation; the couple can add that ceremony again as a custom event. Couples may save incomplete cards as drafts; only enabled events with a date and time appear to attending guests. The main wedding date and countdown remain separate from the Muhurtham event date.

## **7. Wedding Invitation** 

The couple selects from predefined invitation templates such as Traditional Tamil, Simple Classic, and Modern. The invitation can contain bride/groom names, couple photo, wedding message, event details, venue, date/time, Google Maps, and wedding website link. 

Current invitation release starts with Traditional Tamil only and no photo upload. The couple edits a welcome message, previews it alongside saved wedding details and enabled events, and saves it as a draft. Publish makes the saved message visible to attending guests; later drafts do not replace it until published. The default invitation remains visible before the first publish. Other templates and photo upload remain planned V1 work.

**Sharing:** WhatsApp share and copy link. No WhatsApp API integration in V1. 

## **8. Wedding Website** 

Every wedding automatically receives a public website, for example: **makemymarriage.com/w/dinesh-usha** .

Sections: Home, Our Story, Events, Venue, Invitation, Gallery, and Live. Anyone with the wedding link can view a basic wedding page. Full invitation and detailed sections require an attending response from an emailed invite. Guests do not create accounts.

## **9. Wedding Shopping** 

A simple checklist with Bride, Groom, and Wedding categories. Users can mark items as Pending or Completed and add custom items. There is no marketplace or payment system in V1. 

New and existing weddings receive a small set of editable suggested items when the couple first opens Shopping. Both bride and groom can add, edit, complete, and delete suggested or custom items. Shopping is private to wedding members. The dashboard shows progress and opens the full checklist; the sidebar remains visible while navigating between dashboard workspaces.

## **10. Catering** 

Basic catering information only: caterer name, contact information, food type, menu, breakfast, lunch, dinner, snacks, and special notes. No vendor marketplace, quotation, booking, or payment system in V1. 

## **11. Photo Gallery** 

The couple can create albums such as Engagement, Nalangu, Muhurtham, Reception, Family, and Friends. Attending invited guests can upload photos after obtaining wedding detail access. The bride/groom can manage or remove uploaded photos.

The first gallery release starts with bride/groom uploads of JPEG, PNG, and WebP images up to 25 MB each. Five suggested albums appear for new and existing weddings; the couple can add or rename albums, and delete empty albums. Each photo is a private draft until a member explicitly publishes it. Only published photos appear on the wedding website for attending guests or members. Guest uploads, HEIC/RAW, ZIP and cloud imports, QR uploads, and storage quotas follow later.

## **12. Wedding Livestream** 

V1 keeps livestreaming simple. The couple can configure a livestream link and enable a Live section on the wedding website. Access should be private and limited through simple access information. The product will not build its own complex video-streaming infrastructure in V1. 

## **13. Wedding Dashboard** 

The dashboard is the main control center for the bride and groom. It provides access to Couple Details, Wedding Information, Events, Invitation, Wedding Website, Shopping, Catering, Gallery, and Livestream. 

Quick actions: Edit Wedding, Preview Website, Preview Invitation, and Share Wedding. 

The dashboard's Upcoming Events card summarizes enabled, dated events. Creating, changing, enabling, and disabling events happens in the Wedding Events workspace.

## **14. Guest Flow** 

Guest receives a short personal email containing the wedding title, a warm invitation message, an attendance prompt, and a response button. The linked RSVP page shows the couple, date, and venue name before the guest responds Attending or Can't attend. An attending guest can view the full invitation, street address, map link, and detailed wedding page. Guests do not need to register. A forwarded personal link can grant access; strict recipient-only verification may be added later if required. WhatsApp/copy-link sharing leads to the basic public page.

## **15. V1 Scope** 

|**Included**|**Excluded**|
|---|---|
|Authentication|Guest Manager|
|Bride/Groom accounts|Guest count|
|Partner joining|Budget Manager|
|Guest email invitations and attendance responses|Guest count dashboard|
|Wedding creation|Online payments|
|Couple profile|Vendor marketplace|
|Wedding information|Vendor booking|
|Engagement|Accommodation|
|Nalangu|Transportation|
|Muhurtham|Parent accounts|
|Reception|Wedding planner accounts|
|Digital invitation|Multiple wedding management|
|Invitation templates|Other Indian wedding styles|
|WhatsApp sharing||
|Wedding website||
|Shopping checklist||
|Basic catering information||
|Photo gallery||
|Guest photo upload||
|Basic private livestream access||
|Tamil + English||



## **16. Future Expansion** 

**Phase 2:** Vendor marketplace, budget management, guest management, accommodation, transportation, wedding planner accounts. 

**Phase 3:** Payments, advanced livestreaming, wedding reminders, WhatsApp API, advanced invitation customization. 

**Phase 4:** Support for Telugu, Kannada, Malayalam, North Indian, and other regional wedding styles. 

## **17. Core Product Concept** 

**Create your wedding** → **Customize it** → **Share one link** → **Let everyone experience the wedding online.** 

The wedding link is the central concept connecting the invitation, website, events, gallery, and livestream. 

Status: CONFIRMED PRD — Version 1.0 

This document represents the agreed initial scope for Make My Marriage. Features can be added in later phases without expanding the V1 scope. 

