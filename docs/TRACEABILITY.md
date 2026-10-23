# Sprint 0 Product Backlog → Sprint 1 implementation traceability

**Source of truth:** AlFaw Sprint 0 report, Chapter 3, Product Backlog (pp. 30–40); Phase 3 Sprint 1 instructions, p. 2. This is a **UI completeness** map, not a production functionality certification.

| Backlog user story | Pages / elements | Sprint 1 status | Database-dependent work deferred |
|---|---|---|---|
| Register buyer/seller, validate fields and duplicate email | `register.html`, `script.js` | Local prototype | Real account table, validation on server |
| Login with email/password, error on mismatch | `login.html`, `script.js` | Local-only password fingerprint checking | Server-side password hashing, authoritative sessions |
| Logout; private pages unavailable | `profile.html`, guards in script | Local routing guard only | Auth middleware, invalidation, anti-cache |
| Accessible bidding guide with step-by-step process/rules | `auctions.html#bidding-guide` (legacy guide URL redirects) | Built | None for UI; rules must be enforced in backend |
| Profile view/edit | `profile.html` | Local data edits | Account API, secure authorization |
| Full artifact description/period/origin/condition/documents | `artifact-detail.html`, `manage-artifact.html` | UI and local documents | Document upload, verification and storage |
| Show authority-supplied verification status, not verify | `artifact-detail.html`, `browse.html`, `verification.html` | UI labels, illustrative data | Trustworthy verified status import from authority |
| Browse artifact cards incl. status, photo, price/auction info, paging | `browse.html` | Search/filters/sort and 6/page paging | Query and status from real records |
| View bid history and bidders | `auction-detail.html` | Local sample actions | Persistent authenticated bid records |
| Bidder ranking, highest first, my position | `auction-detail.html` | Local ranking | Atomic updates, multiple-user consistency |
| Place valid bid, minimum increase, reject ended/seller | `auction-detail.html`, `script.js` | Local rule simulation | **True security/concurrency/realtime ≤5s** |
| Arabic partial keyword search | `browse.html` | Implemented | Backend query optimization if needed |
| Category, price and verification filters / clear | `browse.html` | Implemented client side | Query and indexes if needed |
| Seller Trust Score on profile and listings, no-rating state | `seller-profile.html`, `seller-detail.html`, `seller-dashboard.html`, listings | Computed from local winner rating | Server verified reviews/aggregation |
| Winner's 1–5 authenticity stars and review once | `auction-detail.html`, seller detail | Local winner-only gate | Enforce winner and proof of receipt on backend |
| Seller add/edit/delete listings | `manage-artifact.html`, `seller-dashboard.html` | Local create/update/archive with image/docs demo | Persisted storage and authorization |
| View/print own bid receipts | `auction-detail.html`, `profile.html` | Derived from locally recorded bids; informational only | Authenticated access to persistent bid records |
| Seller manage auctions | `manage-auctions.html` | Local create/list/delete upcoming auction | Backend authoritative status |
| In-platform popups for bids and wins | `script.js` toast and profile notices | Local-only | Delivery to actual authenticated users |
| Full Arabic RTL interface | All HTML pages and styles | Implemented as markup | Device/user accessibility audit needed |
| Load/search within 3s and bid updates ≤5s | Frontend | Static asset optimization and JS filtering, **not measured** | Performance verification and backend real time |
| Protect accounts/data, deny unauthorized modification | Guards and demo credential validation | **Only illustrative — not secure** | Backend auth, roles and access controls |
| Admin read-only user list and account details | `admin-dashboard.html` | Local read-only detail view | Authenticated administration API |
| Admin read-only artifact/auction/bid monitoring | `admin-dashboard.html` | Local read-only | Authenticated, authoritative records |

## Excluded from the website to respect scope

No native mobile app; no buyer–seller direct messaging; no international delivery, customs or legal workflow; no direct verification by AlFaw; no live-streaming or recommendation engine (these were discussed only as future ideas in the report). No payment gateway was added.

## Outstanding tasks outside the Sprint 1 UI scope

1. Backend/database, secure registration/login, server-side permissions, atomic bid transactions, notifications and multi-user synchronization.
2. A method to load genuine verification decisions from the Heritage Commission. The site must never self-issue an official verification claim.
3. Evidence-based speed/accessibility QA in real browsers and hardware. Do not infer a 3-second benchmark without measurements.
4. The implemented attachment limit is 50 MB per file (JPG, PNG, WEBP; PDF also accepted for documents). Keep this limit in the report acceptance criteria.
5. Update actual coursework report, publish the repository and invite the lab instructor to Jira.
