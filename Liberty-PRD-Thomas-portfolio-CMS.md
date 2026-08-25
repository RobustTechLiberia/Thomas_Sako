# Project Requirements Document

## "Liberty" — Independent Voices Platform (Smerconish.com Clone)

**Version:** 1.0
**Status:** Draft for review
**Reference site:** https://www.smerconish.com/
**Base codebase:** Liberty (React 19 + Vite + Tailwind / Express 5 + MySQL)

---

## 1. Document Purpose

This document defines the functional and technical requirements to evolve the existing Liberty codebase into a full clone of smerconish.com's public site **and** to add a custom-built Content Management System (CMS) that lets non-technical staff run the site day-to-day without a developer.

It assumes the reader has access to the existing Liberty repository (React/Vite client, Express/MySQL server) and builds directly on top of what already exists there rather than starting from zero.

---

## 2. Executive Summary

Liberty is a portfolio clone of smerconish.com — an independent political commentary site built around a syndicated radio/TV host's brand ("Balanced. Unbiased. Independent."). The reference site combines:

- A daily interactive poll
- A newsletter capture funnel
- Aggregated podcast/video content
- A political cartoon gallery
- An interview/community sub-brand ("The Mingle Project")
- Booking/speaking inquiries
- Advertising inquiries
- Social distribution across seven platforms

Today, Liberty has a working daily poll engine, a newsletter subscribe flow, and a social-links API — but every piece of content (poll questions, podcast episodes, cartoons, interviews) is either hardcoded in JSON files or entered directly into the database by hand. **There is no way for a non-developer to publish content.**

This document scopes the remaining public-facing pages to reach feature parity with smerconish.com, and — as the primary new requirement — a **custom admin CMS** so an editorial team can manage polls, podcasts, cartoons, Mingle content, playlists, and booking requests without touching code.

---

## 3. Goals

| #   | Goal                                                                                             |
| --- | ------------------------------------------------------------------------------------------------ |
| G1  | Reach visual and functional parity with smerconish.com's public site                             |
| G2  | Replace all hardcoded/manual content sources with a database-backed CMS                          |
| G3  | Let a non-technical editor publish a poll question, podcast, or cartoon in under 2 minutes       |
| G4  | Preserve and harden the existing poll/newsletter engines already built in Liberty                |
| G5  | Ship a system one developer can maintain — no third-party CMS lock-in, no unnecessary complexity |

### Out of scope (v1)

- Native mobile apps
- Payment/subscription/paywall functionality
- Multi-language / i18n
- Live chat or comments system
- Automated podcast transcription

---

## 4. Stakeholders

| Role                 | Responsibility                                                             |
| -------------------- | -------------------------------------------------------------------------- |
| Site Owner / Host    | Final content approval, brand voice                                        |
| Editor(s)            | Daily content publishing via CMS (polls, podcasts, cartoons, Mingle posts) |
| Developer/Maintainer | Builds and maintains platform + CMS                                        |
| Site Visitors        | Public consumers — vote in polls, subscribe, browse content                |

---

## 5. Current State (What Liberty Already Has)

Carried forward, not rebuilt from scratch:

- **Daily poll engine** — 24-hour dedup by hashed IP+User-Agent, vote submission, results aggregation (consolidated into a single `poll.js` route in the current cleanup pass).
- **Newsletter subscribe** — Nodemailer/Gmail-based confirmation email flow.
- **Social links API** — serves platform URLs from environment config.
- **Stack** — React 19, Vite, Tailwind CSS 4 on the frontend; Express 5, MySQL (via `mysql2`) on the backend; single deploy unit (`client/dist` served by Express).
- **Known gaps closed in prior hardening passes:** hardcoded DB credentials removed, `.env` properly gitignored, destructive `GET /db` setup endpoint replaced with an offline init script.

This PRD builds on that foundation — it does not propose replacing the poll/newsletter/social systems, only extending the platform around them.

---

## 6. Reference Site Feature Inventory (smerconish.com)

Captured directly from the live reference site, used as the parity checklist for Section 7.

| Area                 | Description                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Header               | Dual station badges (SiriusXM M-F 9am-12pm, CNN Sat 9-10am), primary nav, newsletter CTA button                                       |
| Daily Poll           | Single active question, sponsor masthead banner above/around it, vote redirect flow                                                   |
| Hero/Brand statement | "Balanced Unbiased Independent — Giving Voice to the Exhausted Majority" with embedded video                                          |
| Newsletter           | Popup + footer capture form, Mailchimp-style compliance copy                                                                          |
| Content hub tiles    | Icon-tile grid linking to: Podcasts, Mingle Project, Cartoons, Playlists/Bumpers, Booking, Advertising, About, Contact                |
| Podcasts             | Episode listing/player, tied to YouTube channel                                                                                       |
| Mingle Project       | Sub-brand with 4 sections: Meet Ups, Watch (video playlist), Author & Writer Interviews, Mingle News                                  |
| Cartoons             | Gallery of political cartoons                                                                                                         |
| Playlists / Bumpers  | Audio/music content used as show bumpers                                                                                              |
| Booking              | Speaking engagement inquiry form                                                                                                      |
| Advertising          | Advertising inquiry contact (obfuscated email)                                                                                        |
| About / Contact      | Bio and contact form pages                                                                                                            |
| Footer               | Logo, social row (X, Instagram, Facebook, TikTok, YouTube, Threads, Bluesky), station badges repeated, privacy policy link, copyright |

---

## 7. Functional Requirements — Public Site

### 7.1 Global / Layout

- FR-1.1: Header displays station simulcast badges (configurable via CMS — see 8.6), primary nav, and a persistent "Newsletter" CTA.
- FR-1.2: Footer repeats social row, station badges, privacy policy link, and copyright year (auto-computed).
- FR-1.3: Fully responsive down to 360px width.
- FR-1.4: All pages meet WCAG 2.1 AA color contrast and keyboard navigation minimums.

### 7.2 Home Page

- FR-2.1: Hero section with brand statement and optional embedded video (CMS-managed).
- FR-2.2: Today's Poll widget rendered inline (existing poll engine), with optional sponsor banner slot above/below it.
- FR-2.3: Newsletter signup section with inline form (not only popup).
- FR-2.4: Icon-tile grid linking to each content hub (Podcasts, Mingle, Cartoons, Playlists, Booking, Advertising, About, Contact) — tile order and visibility configurable in CMS.

### 7.3 Daily Poll (existing, extend)

- FR-3.1: Poll question, answer options, and active/inactive state are CMS-managed (replacing the static `questions.json` file).
- FR-3.2: Only one poll is "active" at a time; CMS enforces this via a publish toggle.
- FR-3.3: Editors can view live vote tallies from within the CMS (reuses `GET /results`).
- FR-3.4: Poll auto-expires and CMS surfaces a "needs a new question" reminder after 24h (matches README's stated expiration behavior).

### 7.4 Newsletter (existing, extend)

- FR-4.1: Subscribers are persisted to the database (currently only an email is sent — no subscriber list exists). CMS exposes a subscriber list, count, and CSV export.
- FR-4.2: Unsubscribe link in every email, honored on future sends.

### 7.5 Podcasts

- FR-5.1: List of episodes (title, description, publish date, embedded YouTube video or audio link), newest first.
- FR-5.2: Filter/search by title.
- FR-5.3: All episode metadata is CMS-managed.

### 7.6 Cartoons

- FR-6.1: Gallery grid of cartoon images with captions and publish dates.
- FR-6.2: Lightbox/full-size view on click.
- FR-6.3: CMS supports image upload, caption, and publish/unpublish.

### 7.7 The Mingle Project

- FR-7.1: Landing page with four sub-sections mirroring the reference site: Meet Ups, Watch (video playlist embed), Author & Writer Interviews, Mingle News.
- FR-7.2: Each sub-section is its own CMS content type sharing a common "Mingle Post" shape (title, body, media, publish date, sub-section tag).

### 7.8 Playlists / Bumpers

- FR-8.1: List of audio tracks/playlists with embed or link-out (e.g., Spotify/YouTube Music embed).
- FR-8.2: CMS-managed track list.

### 7.9 Booking / Speaking

- FR-9.1: Inquiry form (name, org, event date, event type, message) submitted via email (reuse Nodemailer pattern from `subscribe.js`) **and** stored in the CMS as a lead record.
- FR-9.2: CMS shows a list of booking inquiries with status (New / Contacted / Booked / Declined).

### 7.10 Advertising Inquiries

- FR-10.1: Same pattern as Booking — form + CMS lead list with status tracking.

### 7.11 About / Contact

- FR-11.1: About page content (bio, photo) is CMS-editable rich text, not hardcoded JSX.
- FR-11.2: Contact form submits to CMS lead list + email notification.

---

## 8. Functional Requirements — Custom CMS

This is the centerpiece of this phase. The CMS is a separate authenticated admin area (e.g., `/admin`) built on the same Express/MySQL backend, with its own React admin UI (can reuse the existing Vite build with a second entry point, or a separate small SPA — see Section 10).

### 8.1 Authentication & Access Control

- FR-CMS-1.1: Admin login with email + password (hashed with bcrypt/argon2, never plaintext).
- FR-CMS-1.2: Session-based or JWT-based auth; CMS routes require a valid session.
- FR-CMS-1.3: Two roles at launch:
  - **Admin** — full access including user management and site settings.
  - **Editor** — content CRUD only, no user management, no destructive settings.
- FR-CMS-1.4: Failed login attempts are rate-limited.
- FR-CMS-1.5: Password reset via emailed time-limited token.

### 8.2 Dashboard

- FR-CMS-2.1: Landing screen on login shows: active poll status + live vote count, newsletter subscriber count, pending booking/advertising leads count, recent CMS activity log.

### 8.3 Content Management — Common Requirements

For every content type below (Poll Questions, Podcasts, Cartoons, Mingle Posts, Playlists, Pages):

- FR-CMS-3.1: List view with search, filter by status (Draft/Published), sort by date.
- FR-CMS-3.2: Create/Edit form with a rich text editor for body copy (e.g., TipTap or similar lightweight editor — no heavyweight WYSIWYG framework needed for this scope).
- FR-CMS-3.3: Draft → Published workflow; drafts are never served on the public API.
- FR-CMS-3.4: Soft delete (archive), not hard delete, for auditability.
- FR-CMS-3.5: "Preview" renders the content as it will appear on the public site before publishing.

### 8.4 Media Library

- FR-CMS-4.1: Central image/file upload area used by Cartoons, Podcasts (thumbnails), Mingle posts, and About page.
- FR-CMS-4.2: Server-side validation of file type/size; images resized/optimized on upload.
- FR-CMS-4.3: Files stored on disk (or S3-compatible bucket if hosting supports it) — never stored as base64 in MySQL.

### 8.5 Leads (Booking / Advertising / Contact)

- FR-CMS-5.1: Unified "Leads" inbox filterable by source (Booking / Advertising / Contact).
- FR-CMS-5.2: Status field per lead (New / Contacted / Resolved).
- FR-CMS-5.3: Internal notes field per lead, timestamped and attributed to the editor who wrote it.

### 8.6 Site Settings

- FR-CMS-6.1: Social links (currently env-var driven via `socialmedia.js`) become CMS-editable, falling back to env vars if unset.
- FR-CMS-6.2: Station simulcast badges (SiriusXM/CNN-equivalent text + logo + link) are CMS-editable.
- FR-CMS-6.3: Homepage hero video/copy is CMS-editable.
- FR-CMS-6.4: Content-hub tile order/visibility is CMS-editable.

### 8.7 Audit Log

- FR-CMS-7.1: Every create/update/publish/delete action is logged with actor, timestamp, and content type/ID.
- FR-CMS-7.2: Log is viewable (Admin role only) and read-only.

### 8.8 CMS API

- FR-CMS-8.1: All CMS-authored content is exposed to the public site via read-only, unauthenticated `GET` endpoints (e.g., `GET /api/podcasts`, `GET /api/cartoons`) — the public React app never talks to authenticated CMS routes directly.
- FR-CMS-8.2: Authenticated `POST/PUT/DELETE` routes live under a distinct namespace (e.g., `/api/admin/...`) and require a valid session on every request.

---

## 9. Non-Functional Requirements

| Category        | Requirement                                                                                                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security        | No secrets in source control (see prior hardening pass); all admin routes behind auth; parameterized SQL only (already the pattern in `mysql2` usage); rate limiting on public POST endpoints (poll vote, newsletter, forms) |
| Performance     | Public pages should target < 2.5s LCP on 4G; CMS is internal-tool grade, not performance-critical                                                                                                                            |
| Accessibility   | WCAG 2.1 AA on all public pages                                                                                                                                                                                              |
| SEO             | Server-rendered or pre-rendered meta tags per page (title, description, OG image) — CMS-managed where content-driven                                                                                                         |
| Availability    | Single-region deployment acceptable at this scale; no HA requirement in v1                                                                                                                                                   |
| Data retention  | Poll votes and leads retained indefinitely unless a deletion request is received                                                                                                                                             |
| Browser support | Last 2 versions of Chrome, Firefox, Safari, Edge                                                                                                                                                                             |

---

## 10. Technical Architecture

### 10.1 High-level approach

Keep the existing single-repo, single-deploy-unit shape rather than introducing a separate CMS product (Strapi/Sanity/etc.) or a second deployment target. Rationale: the platform is small, the team is small, and a bespoke CMS scoped tightly to these six content types is materially simpler to operate than standing up and licensing a general-purpose headless CMS.

```
liberty/
├── src/                      # public React app (existing)
├── admin/                    # NEW: CMS React app (separate Vite entry or route-split SPA)
├── server/
│   ├── app.js
│   ├── db/
│   │   ├── pool.js           # existing (from prior hardening pass)
│   │   └── init.js           # existing, extended with new tables
│   ├── middleware/
│   │   └── auth.js           # NEW: session/JWT verification, role check
│   └── routes/
│       ├── poll.js           # existing
│       ├── subscribe.js      # existing, extended to persist subscribers
│       ├── socialmedia.js    # existing, extended to read from DB w/ env fallback
│       ├── podcasts.js       # NEW: public read + admin write
│       ├── cartoons.js       # NEW
│       ├── mingle.js         # NEW
│       ├── playlists.js      # NEW
│       ├── leads.js          # NEW: booking + advertising + contact
│       ├── settings.js       # NEW: site settings
│       └── admin/
│           ├── auth.js       # NEW: login/logout/reset
│           └── media.js      # NEW: upload handling
```

### 10.2 Admin app decision

Two viable options — flag for stakeholder decision:

1. **Route-split within the existing SPA** (`/admin/*` behind an auth guard) — simplest to ship, shares build tooling.
2. **Separate Vite app** deployed under the same domain at `/admin` — cleaner separation of public/admin bundles (public visitors never download admin JS), marginally more build config.

_Recommendation:_ Option 2, since it keeps the public bundle lean and avoids ever shipping CMS code to anonymous visitors.

---

## 11. Data Model (New/Changed Tables)

Builds on the existing `poll` table (see prior consolidation notes).

| Table                    | Key columns                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `admin_users`            | id, email, password_hash, role (admin/editor), created_at                                   |
| `poll_questions`         | id, question_text, options (JSON), status (draft/active/archived), created_by, published_at |
| `podcasts`               | id, title, description, media_url, thumbnail_url, status, published_at                      |
| `cartoons`               | id, image_url, caption, status, published_at                                                |
| `mingle_posts`           | id, section (meetups/watch/interviews/news), title, body, media_url, status, published_at   |
| `playlists`              | id, title, embed_url, status, published_at                                                  |
| `newsletter_subscribers` | id, email, subscribed_at, unsubscribed_at (nullable)                                        |
| `leads`                  | id, source (booking/advertising/contact), name, email, message, status, notes, created_at   |
| `site_settings`          | key, value (JSON), updated_by, updated_at                                                   |
| `audit_log`              | id, actor_id, action, entity_type, entity_id, created_at                                    |

---

## 12. Public API Surface (additions)

| Method | Path                   | Purpose                                                   |
| ------ | ---------------------- | --------------------------------------------------------- |
| GET    | `/api/podcasts`        | List published podcasts                                   |
| GET    | `/api/cartoons`        | List published cartoons                                   |
| GET    | `/api/mingle/:section` | List published Mingle posts by section                    |
| GET    | `/api/playlists`       | List published playlists                                  |
| POST   | `/api/leads`           | Submit booking/advertising/contact form                   |
| GET    | `/api/settings`        | Public site settings (social links, badges, hero content) |

## 13. Admin API Surface (additions)

| Method    | Path                        | Purpose                            |
| --------- | --------------------------- | ---------------------------------- |
| POST      | `/api/admin/auth/login`     | Authenticate                       |
| POST      | `/api/admin/auth/logout`    | End session                        |
| CRUD      | `/api/admin/poll-questions` | Manage poll questions              |
| CRUD      | `/api/admin/podcasts`       | Manage podcasts                    |
| CRUD      | `/api/admin/cartoons`       | Manage cartoons                    |
| CRUD      | `/api/admin/mingle-posts`   | Manage Mingle content              |
| CRUD      | `/api/admin/playlists`      | Manage playlists                   |
| GET/PATCH | `/api/admin/leads`          | View/update lead status            |
| GET       | `/api/admin/subscribers`    | View/export newsletter subscribers |
| GET/PATCH | `/api/admin/settings`       | View/update site settings          |
| POST      | `/api/admin/media`          | Upload media asset                 |

---

## 14. Phased Roadmap

| Phase          | Scope                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| Phase 0 (done) | Poll engine, newsletter send, social links API, security hardening               |
| Phase 1        | CMS core: auth, roles, dashboard, Poll Questions CMS (replaces `questions.json`) |
| Phase 2        | Podcasts + Cartoons CMS + public pages                                           |
| Phase 3        | Mingle Project (4 sub-sections) CMS + public pages                               |
| Phase 4        | Playlists CMS + public page; Newsletter subscriber persistence + export          |
| Phase 5        | Booking/Advertising/Contact lead system (form + CMS inbox)                       |
| Phase 6        | Site Settings CMS (social links, badges, hero) + Audit Log                       |
| Phase 7        | Polish: accessibility pass, SEO metadata, performance pass                       |

---

## 15. Success Metrics

- An editor can publish a new poll question without developer involvement (target: < 2 min from login to live).
- Zero hardcoded content files (`questions.json` and equivalents) remain in the repo post-Phase 1.
- 100% of admin routes reject unauthenticated requests (verified via automated test).
- Public site Lighthouse accessibility score ≥ 90 on all top-level pages.

The final product should be a production-ready digital media publishing platform, not merely a frontend clone.

It should combine:

## Public Website + Custom CMS + Editorial Workflow + Subscriber Management + Email Notification System + YouTube Integration + Analytics + SEO + Security + Scalable 

## Backend Infrastructure

The CMS should be powerful enough that non-technical administrators can operate the entire publishing platform without needing to modify the application's source code.

The architecture should also allow future expansion into features such as:

-	Premium subscriptions
-	Paid memberships
-	Podcasts
-	Video hosting
-	Advertising management
-	Sponsorship management
-	Comments
-	Push notifications
-	Mobile applications
-	Multiple newsletters
-	Advanced audience segmentation
-	Recommendation algorithms
-	AI-assisted editorial tools
-	Multi-author publications
-	Additional social-media integrations


---

## 16. Open Questions

1. Does the CMS need multiple editors working concurrently, or is single-editor sufficient for v1? (Affects whether optimistic locking on content edits is needed.)

Answer: single-editor sufficient for v1

2. Should newsletter sending stay on Nodemailer/Gmail, or move to a transactional email provider (e.g., Postmark/SendGrid) once subscriber volume grows past Gmail's sending limits?

Answer: SendGrid email provider should be used.

3. Hosting target — confirm whether media uploads can rely on local disk storage or need S3-compatible object storage from day one.

Answer: object storage will be used for production while local disk will be used for development.

4. Is a "sponsor banner" slot (seen above the reference site's poll) in scope for v1, or a later monetization phase?

Answer: "sponsor banner" slot (seen above the reference site's poll) in scope for v1. CMS determine it's visibility.

---

## 17. Appendix — Glossary

- **CMS** — Content Management System; the authenticated admin interface described in Section 8.
- **Lead** — A form submission from Booking, Advertising, or Contact pages, tracked through a status lifecycle.
- **Mingle Project** — The reference site's interview/community sub-brand, replicated as a 4-section content type.
- **Dedup window** — The 24-hour period during which the existing poll engine prevents a repeat vote from the same hashed IP/User-Agent fingerprint.
