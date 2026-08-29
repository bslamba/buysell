# The review engine

Everything a listing must survive before it goes live, why each rule exists, and
what to build next.

---

## How a decision is made

```
submit
  │
  ├─► fingerprint every image (sha256 + pHash + dHash)      ~120ms/image
  │
  ├─► run 11 check groups in parallel, none can throw       ~400ms typical
  │
  ├─► any BLOCKER?  ──yes──► REJECT  (no human, instant, reasons to seller)
  │        │no
  ├─► risk = Σ(scoreDelta) × category.riskMultiplier − trustRelief
  │
  ├─► risk ≤ 25 AND seller eligible ──► APPROVE (live immediately)
  ├─► risk ≥ 80                     ──► REJECT
  └─► otherwise                     ──► FLAG → human queue, priority-sorted
```

Two principles hold the design together:

**A blocker is not a score.** Some things are simply disqualifying — a CEIR-blocked
IMEI, another seller's photographs, a phone number in the description. Making
those merely "high risk" means enough good signals elsewhere can outvote them.
They can't.

**Auto-approve is earned.** A brand-new account never skips a human, no matter how
clean the listing. Eligibility needs a verified phone, 3+ approved listings, a
trust score of 60+, and an account older than a week.

---

## Rules that are implemented

### Image integrity — the answer to "same pictures used again"

| Rule | Fires when | Severity |
|---|---|---|
| `image.duplicate_other_user` | sha256 match, or pHash Hamming ≤ 6, against an image ever uploaded by a **different** user | **blocker** |
| `image.duplicate_same_user` | same, but the seller's own image on another listing | medium (20) |
| `image.stock_catalogue` | fingerprint is flagged as a known manufacturer/catalogue image | high (30) |
| `image.likely_stock` | >55% near-white pixels and no camera EXIF | high (25) |
| `image.screenshot` | exact phone-screen resolution and no camera EXIF | high (28) |
| `image.blurry` | Laplacian variance < 60 | medium (10) |
| `image.low_resolution` | under 640×480 | medium (12) |
| `image.count` | fewer photos than the category requires | **blocker** |
| `image.exif_stale` | captured more than 2 years ago | medium (15) |
| `image.exif_future` | capture date in the future | high (20) |
| `image.edited` | EXIF Software is Photoshop/remove.bg/Facetune | low (8) |

**Why three hashes.** `sha256` catches the byte-identical re-upload for free.
`dHash` survives resizing and recompression. `pHash` (DCT-based) survives crops,
filters and brightness changes — which is what someone actually does when they're
trying to get around you. Storing all three costs nothing and closes three
different holes.

**Why a separate fingerprint table.** `image_fingerprints` rows outlive the
listings they came from. Delete a rejected listing and re-upload the same photos
and it still gets caught. Without this, the whole check is one delete away from
useless.

**How the near-match query works.** pHashes are `bit(64)` columns with a pgvector
HNSW index using `bit_hamming_ops`:

```sql
SELECT id, first_user_id, first_listing_id,
       bit_count($1::bit(64) # phash) AS distance
FROM image_fingerprints
WHERE phash <~> $1::bit(64) < 8
ORDER BY phash <~> $1::bit(64)
LIMIT 5;
```

Sub-10ms against millions of rows. Tune `PHASH_DUPLICATE_THRESHOLD` (default 6)
by measuring: too low and you miss re-encodes, too high and you reject two honest
photos of the same white laptop on the same desk.

### Text integrity

| Rule | Catches | Severity |
|---|---|---|
| `text.phone_number` | a phone number, however obfuscated | **blocker** |
| `text.contact_handle` | email, WhatsApp, Telegram, Instagram, external links | high (25–35) |
| `text.scam_phrases` | known Indian classifieds fraud scripts | high → blocker at 70+ |
| `text.prohibited` | weapons, drugs, ID documents, wildlife, counterfeits, SIMs | **blocker** |
| `text.banned_term` | category-specific ("first copy", "icloud bypass") | **blocker** |
| `text.duplicate_other_user` | description ≥85% similar to another seller's | high (35) |
| `text.keyword_stuffing` | one token >15% of the description | medium (15) |
| `text.too_short` | under 40 characters | medium (15) |

The contact scanner normalises before matching: spelled-out digits in English
*and* romanised Hindi (`nau aath saat` → `987`), separator stripping, and
leetspeak folding inside digit runs. Sellers are inventive; a naive `\d{10}`
regex catches almost nobody.

### Price, device and seller

| Rule | Logic | Severity |
|---|---|---|
| `price.suspiciously_low` | under 40% of the variant median (n≥5) | **blocker** |
| `price.below_market` | 40–60% of median | high (30) |
| `price.out_of_band` | outside the category's price limits | **blocker** |
| `device.imei_invalid` | fails the Luhn checksum | **blocker** |
| `device.ceir_blocked` | on the Government of India CEIR stolen/blocked list | **blocker** |
| `device.id_other_seller` | same IMEI/serial already listed by someone else | **blocker** |
| `seller.phone_unverified` | category requires it | **blocker** |
| `seller.kyc_required` | ticket above the category's KYC threshold | **blocker** |
| `seller.velocity` | listings/24h over the trust-tiered limit | high → blocker at 2× |
| `seller.new_account` | under 24h old | medium (15) |
| `seller.high_reject_rate` | >40% rejected over 5+ reviewed | high (25) |
| `seller.disputes` | 2+ disputes lost | high (30) |

Underpricing deserves its blocker status. A scammer needs the deal to look
irresistible because they never intend to ship. A device at 35% of market median
is bait far more often than it is a bargain.

---

## Rules worth building next

Roughly in order of value per unit of effort.

1. **Vision model listing-vs-photo match.** Send the title and the primary image
   to a vision model: "does this photo show a Dell XPS 13?" Catches the whole
   class of mislabelled and bait listings that hashing can't. ~₹0.30/listing.
2. **Watermark and platform-logo OCR.** Detect OLX, Cashify, Amazon, Flipkart or
   Quikr watermarks. A watermark from a competitor is near-proof the photo was
   lifted. Sightengine does this out of the box.
3. **Reverse image search on the open web.** For high-value listings only, check
   whether the photo exists on a manufacturer or retailer site. Expensive per
   call — gate it to items above ₹40,000.
4. **Face detection and auto-blur.** People photograph devices with family in
   frame. Blur automatically. Privacy improvement and a visible courtesy.
5. **Device and network fingerprinting.** Link accounts sharing a device
   fingerprint, IP or payment instrument. Multi-accounting is how a banned seller
   comes back. This is the highest-value item on the list once you have volume.
6. **Serial/IMEI OCR from the photo.** Ask for a photo of the sticker or the
   `*#06#` screen and OCR it. If the OCR'd number doesn't match what was typed,
   that is a very strong signal. Also the foundation of the Condition Certificate.
7. **Behavioural signals at upload.** Time-to-complete the form, paste vs type in
   the description, image upload timing. Bulk fraud tooling behaves nothing like a
   person selling one laptop.
8. **Cross-listing consistency.** Same seller, same model, different declared
   condition or wildly different price across listings.
9. **Buyer-side abuse detection.** Bid retraction rates, non-payment, dispute
   abuse. The auction side needs this before it needs anything else.
10. **Shadow-mode framework.** Every new rule logs what it *would* have done for
    a week before enforcing. Build this once and every subsequent rule is safe to
    ship. Arguably should be #1.
11. **Appeal loop with active learning.** Every overturned rejection is labelled
    training data. Feed it back into threshold tuning monthly.
12. **Seasonal/velocity anomaly detection.** A sudden spike of the same model from
    a new city, priced identically, is a fraud ring — invisible listing by listing.

---

## Tuning discipline

- Never ship a new blocker straight to enforcement. Shadow mode, one week, then
  decide.
- **Watch false positives, not false negatives.** A fraudulent listing that slips
  through costs you one dispute. A wrongly rejected honest seller never comes
  back and tells fifteen people. Target: under 2% of auto-rejects overturned on
  appeal.
- Review the `moderation_events` fire-rate table monthly. A rule that never fires
  is dead weight; a rule that fires on 40% of listings is miscalibrated.
- Rejection messages must be specific and actionable, and must never reveal a
  threshold. "This photo has been used by another seller" — not "pHash distance 4
  against fingerprint 8821".
