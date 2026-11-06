# AlFaw — Sprint 0 requirements versus current website (18 October 2026)

## Sources and review scope
- User-supplied 51-page *AlFaw | Phase 2: Sprint 0* report, particularly product roadmap (p. 8), scope (p. 9), use-case diagram (p. 29), and Product Backlog acceptance criteria (pp. 30–40).
- Repository's `docs/TRACEABILITY.md`, `docs/QA_TEST_CASES.md`, `README.md`, and available site source files on `main`.
- **Status means code/documentation coverage, not verified passing browser tests.** This is not the separate official Phase 3 specification; reassess after that is supplied.

## Requirements audit

| Sprint 0 requirement | Current site evidence | Assessment / next verification |
|---|---|---|
| Register (valid input, no duplicate email) | `register.html`, `script.js` | Local prototype; test duplicate email and validation |
| Login / wrong-password rejection / logout | `login.html`, `profile.html`, `script.js` | Local simulation; test browser back after logout |
| Accessible bidding guide with steps and security advice | `auctions.html#bidding-guide`, redirect `bidding-guide.html` | Exists; verify guide discoverability, dismissal/reopening and full rules |
| Profile view, edit, persist | `profile.html`, `script.js` | Local; regression-test recently repaired edit and cancel buttons |
| Artifact details, origin, period, condition, photos, documents | `artifact-detail.html`, `manage-artifact.html` | UI and local uploads; check every field and document preview |
| Heritage Commission verification status | `verification.html`, `browse.html`, `artifact-detail.html` | **Illustrative only, not authoritative data**; avoid any claim of actual verification |
| Browse: cards, status, bid, time, pagination, empty state | `browse.html`, `script.js` | Present in local UI; confirm live card-data consistency and empty state |
| Bid history, ranked bidders, personal position | `auction-detail.html`, `script.js` | Local simulation; confirm updates and no-bid state |
| Bid minimum increment, invalid bid, ended auction, own auction rejection | `auction-detail.html`, `script.js` | Client-only enforcement; real cross-user 5s update **not implemented** |
| Arabic partial search; category/price/verification filters | `browse.html`, `script.js` | Client-side; test combinations and reset |
| Winner-only one-time 1–5 authenticity review | `auction-detail.html`, `script.js` | Local demonstration; check receipt state, nonwinner and repeat-rating rejection |
| Seller Trust Score (%) on profile and listings | Seller pages, browse and local JS | Local calculation; test recalculation and no-rating label |
| Seller listing creation/edit/archive, photos and documents | Seller dashboard, `manage-artifact.html` | Local; not permanent hosted storage; report's [X] MB unresolved |
| Seller manages auction records | `manage-auctions.html` | Local; test dates and authorization |
| Auction win/update popup notices | Shared JS UI | Browser-local notices, not cross-device delivery |
| Arabic RTL mobile-friendly interface | Site pages, CSS | Markup present; responsive and keyboard QA still required |
| Admin read-only user, artifact, auction, bid monitoring | `admin-dashboard.html` | Local role demo; real authorization not established |
| Performance <=3s; bid sync <=5s | Frontend prototype | **Unmeasured** performance; real-time sync missing |
| Strong security and private account authorization | Local storage and client guards | **Not secure for production**; backend needed |

## Design/scope decisions from source report
- Three user roles: Buyer, Seller, Admin.
- Website in Arabic and RTL; native app, international shipping, buyer/seller messaging, legal/customs workflow and AlFaw performing official artifact verification are outside scope (p. 9).
- Page 8 roadmap: Sprint 1 focuses on registration/login, artifact manipulation and profile management; Sprint 2 focuses on browsing/search, artifact details, bidding history, winner ranking, notifications and auction management. Already-present Sprint 2 UI features must not be confused with integrated backend functionality.
- Live streaming and similar-item recommendations were questionnaire suggestions for possible future releases, not required Sprint 0 backlog (p. 25).

## Potential report inconsistency to resolve before submission
- Page 19's narrative says 25 Saudi respondents represented 78.5%, while questionnaire table on p. 48 shows 25 of 27 = 92.6%. Prefer the raw questionnaire table and correct the report explicitly after team confirmation.
- Page 23's narrative for Q11 response times does not match the detailed Q11 answer labels on p. 49: 51.9% chose “immediate”, not “rarely”. This merits report correction.

## Acceptance-test priorities
1. Run `python tests/check_structure.py` and all JS syntax checks in a real working tree.
2. Manually execute `docs/QA_TEST_CASES.md` on desktop and mobile.
3. Validate authentication and roles, registration duplicates, profile save/cancel and logout back-navigation.
4. Validate bidding/auction lifecycle, history/ranking, rejection of illegal bids and winner review.
5. Validate seller artifact and auction CRUD and their visibility across pages.
6. Measure 3s targets; do not claim cross-device 5s sync without a backend.

**Important:** Report describes the desired finished system. The current Sprint 1 site is a local front-end prototype; comparisons must distinguish demonstration from production guarantees.
