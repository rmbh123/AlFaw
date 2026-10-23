# AlFaw design alignment for the course report

These notes support the report; the assignment and instructor clarifications remain the grading authority. Database integration is optional in Sprint 1 and allowed. This ZIP implements browser-local interface workflows, with no Firebase connection.

## Architecture

The selected final architecture is layered: Arabic browser interface, application logic and access control, and Firebase data services. Firebase Authentication will manage identities and sessions; Cloud Firestore will store structured records; Firebase Storage will hold images and supporting files. Final authorization and atomic bid/review updates require secured rules or operations. AlFaw displays seller-entered verification information and does not perform artifact verification.

Current implementation: HTML/CSS/JavaScript; `localStorage` holds demonstration users, sellers, artifacts, auctions, embedded bid arrays, reviews, and notices. Supporting document Blobs are stored in local IndexedDB (`alfaw-document-files`). Photos are compressed for local demonstration storage. There is no cross-device database synchronization.

## Domain classes

The report's conceptual classes are User, Seller, Artifact, Auction, Bid, Review, and Notification. User.role distinguishes buyer, seller, and admin; Seller is a linked public profile, not a Buyer subtype. Admin monitoring is read-only. Class diagrams are design models; the JavaScript implementation need not declare corresponding classes.

Relations: User 1—0..1 Seller; Seller 1—0..* Artifact; Artifact 1—0..1 Auction; Auction 1—0..* Bid; User 1—0..* Bid; Auction 1—0..1 Review; User 1—0..* Review; Seller 1—0..* Review; User 1—0..* Notification.

## Planned Firestore hierarchy

```text
users/{authUid}
  name, email, phone, city, role, sellerId, joined
  notices/{noticeId}: kind, body, url, auctionId, read, created
sellers/{sellerId}
  name, city, specialty, category, bio, joined, ratingsCount, ratingsSum
artifacts/{artifactId}
  sellerId, name, description, category, price, period, origin, condition
  conditionNotes, provenance, verification, verificationReference
  image: Firebase Storage download URL
  documents: embedded array of {name, type, url}
  archived, created
auctions/{auctionId}
  artifactId, sellerId, startingPrice, increment, reservePrice, start, end
  highestBid, bidCount, created
  bids/{bidId}: uid, bidderName, amount, created
reviews/{auctionId}
  sellerId, uid, buyerName, rating, comment, created
```

Collections use document IDs for referencing. Document metadata is embedded; growing bids and notices use subcollections. The planned reviews document ID is the auction ID to enforce one review per auction; the local prototype uses generated review IDs and stores auctionId explicitly. Local user IDs will map to Firebase Authentication UIDs during integration. No SQL schema is selected or required for this NoSQL design.

## The three component designs

1. Place Bid: active auction, authenticated buyer, positive safe whole number, minimum = startingPrice + increment when no bids, otherwise highestBid + increment. Record bid, update history/ranking, and notify the previous leader when another buyer outbids them. A flowchart and pseudocode describe this component.
2. Manage Auction: owned unarchived artifact without another auction; positive whole starting price/increment; optional whole reserve >= starting price; future start and end > start. States are upcoming, active, ended, and the outcome. Only an upcoming auction without bids may be deleted after confirmation. A state diagram and pseudocode describe this component.
3. Review Winning Seller and calculate Trust Score: only the ended-auction winner, receipt confirmation, integer rating 1–5, once per auction. Trust Score = round(sum(ratings) / count / 5 * 100); no ratings displays the empty state. An activity diagram and pseudocode describe this component. A bid record's buyer identifier is `uid`, so use `winnerId = topBid.uid`.

Archiving removes an artifact from public catalogues. It is prohibited while an active/upcoming auction exists. Historical completed-auction and related artifact detail links remain readable; eligible winner reviews and existing bid receipts remain available.

## Interfaces and receipts

The 16 main pages are listed in README. Two compatibility HTML files redirect to current pages. The bidding guide is part of auctions.html, not a separate main page. Popups, tabs, history/ranking and receipts are embedded interfaces, not extra routes.

Buyers can view and print informational receipts for their own recorded bids from auction details and the profile receipts tab. A receipt contains the bid reference, auction, artifact, bidder, amount, and timestamp. It is not a payment invoice, proof of purchase, or proof of winning. It is derived from Bid data; it does not need a payment entity or separate database collection.

Report responsibilities: document receipts in the existing bidding story and interface descriptions; keep seller auction management documented; show the full planned sitemap. Include the actual GitHub and Jira links and confirm the instructor invitation. Use `docs/REPORT_UPDATE_AR.md` for the remaining report changes.
