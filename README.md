# AlFaw | ألفاو — Phase 3 / Sprint 1

An Arabic RTL, responsive **interface prototype** for historical-artifact auctions, aligned with the AlFaw Sprint 0 report's Product Backlog and the university's Phase 3: Sprint 1 instructions.

## Sprint 1 boundary

The university brief requires **all pages**. Database integration is optional for Sprint 1 and is permitted by the instructor. This submission uses browser-local demonstration data and has **no live database, backend, real official verification, payment service, real-time multi-device synchronization, or legally binding bidding**. Interactions on this version run **only in this browser** using `localStorage`. Even when local credentials are checked, browser data can be edited; **do not use real passwords, identity data, or payments**. A backend is required before production.

Nothing here performs Heritage Commission verification. The verification status shown is illustrative / supplied by the hypothetical seller. Do not interpret it as an official certified result.

## Start

1. Unzip the archive and enter the `AlFaw-main` directory.
2. Run `python -m http.server 8000` (or an equivalent local HTTP server).
3. Open `http://localhost:8000/index.html` in a browser.
4. For a clean test: DevTools → Application → Local Storage → clear this origin, then reload.

`localhost` is important for browser Web Crypto in the local demonstration. No package manager, third-party service, or database is required.

## Local-only demo users

| Role | Email | Password | Entry page |
|---|---|---|---|
| Buyer | buyer@alfaw.demo | AlfawDemo!2026 | login.html → profile |
| Seller | seller@alfaw.demo | AlfawDemo!2026 | login.html → seller dashboard |
| Admin (read-only) | admin@alfaw.demo | AlfawDemo!2026 | admin-login.html → admin dashboard |

New buyer or seller accounts can be created using the registration form. Admin registration is deliberately not available through the public form. These demo secrets exist visibly in the frontend JavaScript: they **do not confer real security**.

## Included interfaces

- Home: `index.html` — existing heritage-inspired cinematic visual
- Artifacts: `browse.html`, `artifact-detail.html` — Arabic search, multi-filters, sorting, pagination, documented artifact detail, seller verification-status display
- Auctions: `auctions.html`, `auction-detail.html` — active/upcoming/ended demo auctions; countdown; price, simulated bids, history, bidder ranking, auction result, winner review flow
- Seller pages: `seller-profile.html`, `seller-detail.html`, `seller-dashboard.html`, `manage-artifact.html`, `manage-auctions.html`
- Accounts: `register.html`, `login.html`, `admin-login.html`, `profile.html`
- Admin read-only view: `admin-dashboard.html`
- Information: `verification.html`; the bidding guide is now embedded at `auctions.html#bidding-guide` (`bidding-guide.html` redirects for old bookmarks)
- `serller-detail.html` redirects to `seller-detail.html` for compatibility with older URLs.

### Data rules

- Auction demo times are created relative to the first visit and persisted in browser storage. No fixed hard-coded countdown is presented as a live server timestamp.
- Bid validity, bidder ranking, winner condition and Trust Score are **client-side demonstrations**. Real users, tabs or browsers cannot reliably transact across devices without a server.
- Sellers can archive artifacts from active listings while preserving historical auction references; uploaded demo images and PDF/image documents are stored **only locally**. Images and PDF/image attachments accept files up to **50 MB each**. Demo artifact photos are resized and compressed for browser `localStorage`; supporting attachments are saved locally in IndexedDB. This is **not** cloud upload or original-quality archival storage.
- Archived artifacts disappear from public catalogues. Their completed auction and artifact detail pages remain accessible through historical links, so bid history, receipts, and winner reviews remain available. Active or upcoming auctions prevent artifact deletion.
- Buyers can view and print informational bid receipts from auction details and their profile. Receipts are derived from their recorded bids; they are not payment invoices or proof of purchase.
- Ratings require a demo auction winner, 1–5 stars, and are limited to one per auction/winner in the local state. Trust Score = average stars ÷ 5 × 100, only for recorded authenticity reviews. Missing ratings show “لا توجد تقييمات”.
- Admin may read registered users, listings, bids and auction data; no admin update/delete controls are provided.

## QA and deliverable notes

- Run `python tests/check_structure.py` and `node --check script.js`.
- See `docs/TRACEABILITY.md` for feature-to-backlog alignment and deferred Sprint 2+ capabilities.
- See `docs/CHAPTER4_DESIGN_NOTES.md` for preliminary Sprint 1 architecture, UML/data model, pseudocode for three key processes and a site map.
- See `docs/QA_TEST_CASES.md` for end-to-end manual tests, including device and accessibility checks.
- Optional browser regressions: install Playwright in a separate tools directory, install Chromium, then run `node tests/check_browser_flows.cjs` with Playwright available on Node's module path. `ALFAW_PLAYWRIGHT_MODULE` may point to an installed Playwright module, and `ALFAW_CHROMIUM_EXECUTABLE` may select a Chromium binary. These are test tools only; the website itself has no npm runtime dependency.
- Browser tests use a temporary localhost server, fresh browser-local accounts, form interactions, and explicit test-only auction schedule fixtures. They do not verify cloud security, cross-device bidding, or production performance.
- See `docs/QA_RESULTS.md` for the checks actually performed on this ZIP, and `docs/REPORT_UPDATE_AR.md` for exact remaining report edits.

## Submission obligations not possible from a ZIP

Phase 3 also requests an updated Chapters 1–3 and Chapter 4 PDF, an actual GitHub URL containing all project files plus `README` and `AUTHORS`, and the team's real Jira project and instructor invitation. **This ZIP does not create a GitHub repository, invite the instructor, or replace the required signed-off course report.** Put your own real links into the university report; do not fabricate them.
