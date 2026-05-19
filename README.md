# SwipeFood

Mobile swipe app where you vote **yes** or **no** on food dishes — *Would You Eat This?*

React + Vite frontend and Node/Express + SQLite backend (390×844 mobile-first UI).

## How to run

```bash
# From project root
npm run install:all
npm run seed          # loads 104 items + demo voters (for Results)
npm run seed:votes    # refresh demo votes only
npm run dev:server    # API on http://localhost:3001
npm run dev:client    # UI on http://localhost:5173
```

Open **http://localhost:5173** in your browser (DevTools device mode at 390×844 recommended).

## Features

- Swipe or tap Yes/No on 104 food items
- Results tab with sort: most loved, hated, controversial, most votes
- Matches tab (your yes + global yes rate ≥ 60%)
- Undo last swipe, session persistence, vote deduplication on server

## Architecture

Express API + SQLite (`server/data/votes.db`). Vite proxies `/api/*` to the backend. Images from [TheMealDB](https://www.themealdb.com) via `server/data/item-images.json`.

See [AI_NOTES.md](./AI_NOTES.md) for AI usage notes.
