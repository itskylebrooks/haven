# Haven

*A calm social network for authentic expression and connection*

Haven is a minimalist, invite-only social space that blends the clarity of early Twitter with the warmth of early Instagram — **no ads, no algorithms, no public metrics**. It’s designed for small circles of real people, private reciprocity, and feeds that end.

## Features (prototype)
- **Two calm feeds**
  - **Circles** — mutual/private posts in strict reverse‑chrono.
  - **Signals** — deliberate public broadcasts (separate feed).
- **Composer** — write a *Trace* (text) and choose **Circle** or **Signal**.
- **Profiles** — your portrait + posts, and simple public profiles for others.
- **Minimal motion** — subtle framer‑motion transitions; the feed ends.
- **Private feedback (planned)** — **Resonate** (no counts) and **Reflect** (replies).
- **Local-first data (optional)** — Dexie/IndexedDB for persistence and quick load.
- When hosted, Haven will use a subscription model. No ads, no tracking.

## Principles
1. **Chronological & finite** — no ranking, no endless scroll.
2. **No ads, no tracking** — membership-funded when hosted.
3. **Human-scale** — ~100 connections cap (design constraint, not a growth hack).
4. **Expression first** — private appreciation instead of public scores.
5. **Calm design** — dark canvas (#0a0a0a), generous spacing, soft motion.

## Tech
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS, Lucide icons
- **Animation:** framer-motion (short, subtle transitions)
- **Data (prototype):** in‑memory; optional **Dexie (IndexedDB)** integration
- **Future sync:** Postgres (Supabase) with Row‑Level Security

## Getting started

### Prerequisites
- Node.js **18+**
- pnpm, npm, or yarn (examples use `npm`)

### Setup
```bash
# install deps
npm install

# start dev server
npm run dev

# build for production
npm run build

# preview local build
npm run preview
```

The default dev server prints a local URL. Open it to explore **Circles**, **Signals**, and **Profile**.

## Shortcuts (when enabled)
- **t** — open composer
- **Esc** — close composer

## License  

The source code in this repository is licensed under the MIT License (see `LICENSE`).