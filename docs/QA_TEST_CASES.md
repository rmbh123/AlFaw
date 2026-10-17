# AlFaw — manual acceptance and regression scenarios

**Note:** These are runnable manual test plans, not pass claims. Use a fresh browser storage for deterministic initial data. A production pass requires a real backend, which Sprint 1 explicitly excludes.

| ID | Steps | Expected |
|---|---|---|
| A01 | Open each site page from navigation | Page loads; no dead link or missing image |
| A02 | Visit browse at width 320, 375, 768, 1024, 1440 | No horizontal overflow; readable cards/forms |
| A03 | Search Arabic partial word `عملة` | Matching coin cards only |
| A04 | Apply category + price + verification, then clear | Conjunction of all filters; then defaults restored |
| A05 | Create 7+ mock artifacts, browse | Next/previous buttons and correct 6-per-page boundaries |
| A06 | Open an item from a card | Exact ID, photo, period, origin, condition, documentation, seller |
| A07 | Open auction listed as active/upcoming/ended | Status and schedule correspond to detail page |
| A08 | Search auction by AUC ID or Arabic name | Exact linked auction; no mismatched internal IDs |
| A09 | Change status filter and price sort | Result count and order update without losing selected filter |
| A10 | Refresh countdown or change device clock | Demo time recalculates; server trust is NOT implemented |
| A11 | Submit bid without buyer login | Bid disabled or rejected |
| A12 | Login with wrong demo password | Reject and show Arabic error |
| A13 | Login with correct demo password | Navigate to role-specific area |
| A14 | Bid less than minimum | Reject and show minimum |
| A15 | Buyer bids required minimum + increment | Bid appears in local history/highest/ranking |
| A16 | Try bidding on ended auction | Reject |
| A17 | Seller tries own auction | Reject |
| A18 | Seller creates an item with photo and document | Validated and locally visible in public browse and seller dashboard |
| A19 | Seller edits an own item | Changes appear on details/listing |
| A20 | Seller removes own item after confirming | Archived from public/seller active listings; history preserved |
| A21 | Seller creates upcoming auction with invalid dates | Inline error; no auction saved |
| A22 | Seller creates valid auction | Appears in management and auction catalog |
| A23 | Manually advance test/demo auction to ended with winning bid | Result and win notice locally shown |
| A24 | Winner rates received authenticity 1–5 once | Seller score changes; second review blocked |
| A25 | Non-winner tries review | Rejected |
| A26 | Seller with no winner reviews | “لا توجد تقييمات” shown |
| A27 | Admin views account details from table | Read only; no edit/delete actions |
| A28 | Buyer or seller navigates to admin dashboard | Restricted view message |
| A29 | Visit pages with keyboard only | All controls keyboard operable, visible focus |
| A30 | Enable reduced motion | No unnecessary animation; tasks remain usable |
| A31 | Inspect popup notification | Arabic message, keyboard-accessible close action |
| A32 | Open documents from artifact detail | User-provided local demo document opens safely |

**Requires later integration:** Real multi-device bids within 5 seconds; authoritative timer; server password hashing; access control; true official verification; durable document storage; performance guarantee below 3 seconds.
