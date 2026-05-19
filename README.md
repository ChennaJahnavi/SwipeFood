# Project Name - Swipe-to-Vote Web App

**Repository:** [SwipeFood](https://github.com/ChennaJahnavi/SwipeFood)

## 1. Project Theme & Overview

**Would You Eat This?** is a binary voting web app themed around food. Users swipe (or tap) **right = yes, I’d eat it** and **left = no** on a deck of dishes. The experience is mobile-first (390×844) and designed to feel like a lightweight Tinder-style food poll.

The catalog contains **104 distinct items** (`food-001` … `food-104`), each with a label, short description, and image. Dishes span global cuisines (pizza, pho, sushi, tacos, curries, desserts, breakfast, etc.). Images are matched per dish via [TheMealDB](https://www.themealdb.com) and stored in `server/data/item-images.json` (with keyword fallbacks in `server/food-images.js`). After voting, users can explore **aggregate Results** (how everyone voted) and **Matches** (dishes they liked that are also popular globally).

## 2. Architecture & Design Choices

The app is a **React 19 + Vite** frontend and a **Node.js + Express** REST API, connected through Vite’s dev proxy (`/api` → `http://localhost:3001`). The UI uses **Tailwind CSS v4** and **Framer Motion** for swipe gestures, card tilt, and yes/no color overlays. Swipe logic is custom (pointer events + motion values) because `react-tinder-card` does not support React 19.

The server is the **source of truth** for all votes and aggregates. On startup, if the database has no items, `seed.js` loads 104 rows into SQLite. The client keeps only an anonymous `sessionId` in `localStorage` to identify the browser between reloads; every vote is sent to the API and stored in the database.

* **Persistence Layer Justification:** **SQLite** via `better-sqlite3`. A single file (`server/data/votes.db`) needs no separate DB server, works offline for demos, and supports synchronous writes so vote inserts and aggregates stay simple and race-free. WAL mode is enabled for safer concurrent reads during Results polling.

* **Deduplication Strategy:** The `votes` table enforces `UNIQUE (session_id, item_id)`. `POST /vote` checks for an existing row first: identical choice → idempotent success (`duplicate: true`); changed choice → `UPDATE` (counts reflect the latest vote). Concurrent duplicate inserts are caught by `SQLITE_CONSTRAINT` and treated as duplicates. The client filters already-voted items using `votedIds` from `GET /items?sessionId=…`.

## 3. Installation & How to Run

**Prerequisites:** Node.js 18+ and npm.

```bash
git clone https://github.com/ChennaJahnavi/SwipeFood.git
cd SwipeFood

# Install dependencies (root script installs server + client)
npm run install:all

# Seed 104 items + demo votes (needed for meaningful Results)
npm run seed

# Terminal 1 — API (http://localhost:3001)
npm run dev:server

# Terminal 2 — UI (http://localhost:5173)
npm run dev:client
```

Open **http://localhost:5173** (use browser DevTools device mode at **390×844**).

**Optional commands:**

```bash
npm run seed:votes      # Refresh demo votes only (keeps your session’s votes)
npm run build:images    # Regenerate item-images.json from TheMealDB (network required)
npm run test:e2e        # API smoke test (scripts/e2e-api.test.js)
```

**Production-style run:**

```bash
cd server && npm start
cd client && npm run build && npm run preview
```

## 4. Requirements Checklist

### Core Requirements (Section 3.1)

- [x] 100+ distinct items with images & labels (104 items)
- [x] Swipe UI (left/right) with visual feedback & card tilt (Framer Motion + YES/NO overlays)
- [x] Aggregated results view with sort/filter (most loved, hated, controversial, most votes)
- [x] Server-side persistent state (no localStorage source of truth; votes in SQLite)
- [x] Graceful end-of-deck state (“You voted on everything!”)

### Stretch Requirements (Section 3.2)

- [x] Anonymous session identity (`sessionId` in `localStorage`, sent with each request)
- [x] Undo last swipe (`DELETE /vote`)
- [x] Matches view (`GET /matches` — your yes + global yes rate ≥ 60%)
- [x] Near real-time results (poll every 8 seconds on Results tab)
- [ ] Admin panel (not implemented — use `npm run seed` / `seed:votes` instead)
- [ ] Analytics dashboard (not implemented)

## 5. Known Issues & Trade-offs

- **Vote changes:** Users can change yes ↔ no on the same item; aggregates always use the **latest** choice, not a full audit history.
- **Images:** Some niche dishes may share a generic fallback image if no TheMealDB keyword rule matches.
- **Pull-to-results:** A basic top-edge pull gesture opens Results; the tab bar is the reliable navigation path.
- **Demo data:** `npm run seed` adds synthetic voters so Results/Matches are interesting before real traffic; run `seed:votes` to refresh without wiping items.
- **Database not in git:** `votes.db` is gitignored; clone → `npm run seed` on first setup.

## 6. AI Collaboration Notes

AI tools (primarily **Cursor Agent**) helped scaffold the Express API, SQLite schema, Vite/React client, seed data for 104 items, and initial swipe/results views. I **rejected** `react-tinder-card` due to React 19 peer dependency conflicts and directed a **custom Framer Motion swipe card** instead, which also supports mouse drag on desktop.

**What worked well:** Generating the full API surface, validation, and bulk seed content in one pass was fast and mostly correct.

**What needed manual fixes:** An early `SwipeCard.jsx` draft had duplicated JSX and broken markup and required a rewrite. Progress UI was iterated from plain “Progress: X / Y” text to a header bar with numeric count and fill indicator.

**Verification performed locally:**

- [x] `npm run seed` → 104 items
- [x] Swipe flow; votes appear in Results
- [x] Reload persists session; no double-count on same item with same choice
- [x] Undo and Matches tab
- [ ] Record 2–3 minute demo video *(pending)*

For additional detail, see [AI_NOTES.md](./AI_NOTES.md).
