# Corrections in this ZIP

- Fixed the Browse single-element/list selector error so locally saved artifact additions, edits, and archives reach the public catalogue.
- Kept completed auction and related artifact detail links available after archiving; retained active/upcoming deletion restrictions.
- Removed archived-auction cards from public catalogues, including previously rendered cards.
- Updated the bid input hint from the actual current minimum after every bid.
- Corrected README demo password casing and the missing compareBids dependency in the auction-rule test.
- Kept outbid notification kind and auctionId with the saved notice.
- Aligned repository design notes with the report's planned Firebase/Firestore design, component selection, receipts, and browser-local file storage.
- Added browser regression scenarios and Arabic report correction instructions.

# Changes applied to the replacement source ZIP

This deliverable was produced **from the newly supplied** `AlFaw-main 2(1).zip` archive, not the earlier archive.

## Updated in the website

- Fixed every missing local asset/link found in the HTML: manuscript image, cinematic background, seller details route (legacy misspelling redirects).
- Added the required bidding guide and linked it into navigation.
- Repaired auction card IDs to match the linked actual auction IDs; made card status, prices and timing follow the same local data used on auction details.
- Created representative local demo auction start/end states: active, upcoming and ended, with accurate client-side countdown instead of static timestamps.
- Improved Arabic auction search, status filtering, sorting and clear filters, and empty-result messages.
- Added browse pagination, kept category/price/verification filtering together, and made locally created artifacts visible in public browsing.
- Updated login demo to reject wrong passwords, preserve a local browser-session placeholder, and route roles to appropriate pages; added read-only admin demo access.
- Added an admin user-details read-only view; kept admin monitoring free of edit/delete actions.
- Enabled local demo artifact photo and document preview/persistence with a test-only size limit and validation.
- Seller deletion now archives records from active listings without destroying historical auction references.
- Improved bid validation/feedback, local toast notifications and winning messages, winner-only authenticity reviews after receipt confirmation, and Trust Score rendering on listings.
- Removed related-item/recommendation widgets that Sprint 0 identifies only as a possible future enhancement.
- Added motion/focus/reduced-motion/responsive refinements without creating new product functionality.
- Included README, AUTHORS, source structure QA, traceability, Chapter 4 design notes, and manual QA acceptance cases.

## Not integrated in this prototype

No database/API server, real authentication/security enforcement, actual authority verification, realtime cross-user bidding, durable file hosting, payment gateway, native app, direct messages, shipping or live-streaming. Any locally demonstrated feature is **not** a verified live financial workflow.

## Verification performed

`python tests/check_structure.py` checks static links/assets, RTL markup, unique page IDs, JavaScript syntax and auction helpers. Current browser regression coverage and remaining limits are recorded in `docs/QA_RESULTS.md`.
