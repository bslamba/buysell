# Pakka — engineering log

## 2026-08-29 — Repo initialised

- Next.js 15 + TypeScript + Tailwind v4 + Drizzle scaffold
- Full database schema: users, orgs, listings, image fingerprints, moderation events, auctions, lots, bids, orders, certificates, price observations, audit log
- Category registry with per-category rules (open catalogue, category-scoped strictness)
- Image fingerprinting: sha256 + DCT pHash + dHash, blur and stock-photo heuristics
- Moderation engine with 11 check groups, blocker/score/priority model, unit tests
- Docs: BUILD, MODERATION, ARCHITECTURE, NAMING

### Next
- Phase 1: auth (phone OTP + Google), roles, first Vercel deploy
- Wire ModerationServices to real queries (pgvector Hamming, price percentiles, CEIR)
