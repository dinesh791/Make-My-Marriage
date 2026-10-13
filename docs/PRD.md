# **Make My Marriage** 

Confirmed Product Requirements Document (PRD) — Version 1.0 

## **1. Product Overview** 

**Product:** Make My Marriage **Initial target:** Tamil Nadu / Tamil-style weddings **Platform:** Web application **Languages:** Tamil + English **Primary users:** Bride and Groom 

**Goal:** Provide one simple place for a bride and groom to create and share their wedding, including invitations, events, website, shopping, catering information, photos, and livestream access. 

**Application experience:** V1 is a product application with login/sign-up, a couple dashboard, and a public wedding website; a separate marketing landing page is not part of the V1 application. For the current sample-data preview, `/` directly renders the Dinesh & Usha wedding website and keeps the browser at the root URL. The same public sample is also available to guests without accounts at `/w/dinesh-usha` and the dynamic `/w/[slug]` route. Its Login link opens `/login`; the login page provides a sign-up link. Choose a production root destination after real wedding slugs and hosting behavior are defined.

## **2. User Roles** 

**Bride** and **Groom** are the only wedding administrators. Both can manage the wedding. 

**Guests:** Guests do not need an account. They access the wedding through a shared link and can view the website, invitation, events, photos, and livestream when available. There is no Guest Manager or guest database in V1. 

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

Each event can contain date, time, venue, address, and description. The couple can enable or disable events. 

## **7. Wedding Invitation** 

The couple selects from predefined invitation templates such as Traditional Tamil, Simple Classic, and Modern. The invitation can contain bride/groom names, couple photo, wedding message, event details, venue, date/time, Google Maps, and wedding website link. 

**Sharing:** WhatsApp share and copy link. No WhatsApp API integration in V1. 

## **8. Wedding Website** 

Every wedding automatically receives a public website, for example: **makemymarriage.com/w/dinesh-usha** .

Sections: Home, Our Story, Events, Venue, Invitation, Gallery, and Live. Anyone with the wedding link can view the website. No login is required for normal viewing. 

## **9. Wedding Shopping** 

A simple checklist with Bride, Groom, and Wedding categories. Users can mark items as Pending or Completed and add custom items. There is no marketplace or payment system in V1. 

## **10. Catering** 

Basic catering information only: caterer name, contact information, food type, menu, breakfast, lunch, dinner, snacks, and special notes. No vendor marketplace, quotation, booking, or payment system in V1. 

## **11. Photo Gallery** 

The couple can create albums such as Engagement, Nalangu, Muhurtham, Reception, Family, and Friends. Anyone with the wedding link can upload photos. The bride/groom can manage or remove uploaded photos. 

## **12. Wedding Livestream** 

V1 keeps livestreaming simple. The couple can configure a livestream link and enable a Live section on the wedding website. Access should be private and limited through simple access information. The product will not build its own complex video-streaming infrastructure in V1. 

## **13. Wedding Dashboard** 

The dashboard is the main control center for the bride and groom. It provides access to Couple Details, Wedding Information, Events, Invitation, Wedding Website, Shopping, Catering, Gallery, and Livestream. 

Quick actions: Edit Wedding, Preview Website, Preview Invitation, and Share Wedding. 

## **14. Guest Flow** 

Guest receives WhatsApp/link → opens wedding website → views invitation and events → views/uploads gallery photos → watches livestream when available. Guests do not need to register. 

## **15. V1 Scope** 

|**Included**|**Excluded**|
|---|---|
|Authentication|Guest Manager|
|Bride/Groom accounts|Guest count|
|Partner joining|Budget Manager|
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

