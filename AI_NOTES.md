# AI Collaboration Notes

## What Cursor/Claude wrote end-to-end

- Initial project scaffold (Express + SQLite schema, Vite + React + Tailwind)
- API route handlers: `GET /items`, `POST /vote`, `DELETE /vote`, `GET /results`, `GET /matches`
- Seed data and scripts for **104 food items** plus demo voters
- Swipe card gesture logic (pointer events + Framer Motion)
- Results and Matches views, header progress bar, README in submission format

## Where I pushed back / fixed AI output

**`react-tinder-card`:** The study guide suggests it, but it does not support React 19 (peer dependency conflict). I directed the AI to build a **custom swipe card** with Framer Motion and pointer events instead, which also satisfies mouse drag on desktop without legacy peer-deps hacks.

**Progress UI:** First drafts used plain text (`Progress: 10 / 104`). I iterated to a header-integrated bar (current count, “of 104”, amber fill) without the word “Progress.”

**`SwipeCard.jsx`:** An early AI draft had duplicated JSX and broken markup; I rewrote the component manually to keep it maintainable.

## One thing better / worse than expected

- **Better:** Generating 100+ labeled seed items, dedup validation, and the full API in one pass was fast and mostly correct.
- **Worse:** Running the wrong dev server folder (`285_individual copy` on port 5173) made UI fixes appear missing until the correct project was served from `285_fixed`.

## Other tools

- **Cursor Agent** — primary builder and debugger for this project.
- **TheMealDB** — meal images via `server/data/item-images.json` (not AI-generated images).
- No image-generation AI used for dish photos.

## Verification I performed

- [x] Run `npm run seed` and confirm 104 items
- [x] Swipe through several cards; confirm votes in Results
- [x] Reload page; confirm session persists and no double-count on same item (same choice)
- [x] Test undo and Matches tab
- [ ] Record 2–3 minute demo video

## Reflection (half-page)

AI accelerated the “boring but necessary” parts—boilerplate API, schema, seed JSON, and view scaffolding—so I could focus on requirements that needed judgment: React 19 compatibility, dedup semantics, and mobile UX. The main risk was **trusting generated UI code without reading it**; the broken `SwipeCard` was a reminder to review structure, not just behavior. I treated the server as the only source of truth for votes and used AI to draft validation and SQL, then verified edge cases (duplicate vote, vote change, undo) manually. For a course submission, documenting where AI helped versus where I overrode it (tinder-card, progress bar, component rewrite) feels as important as the feature list. Going forward I’d ask AI for smaller, reviewable diffs per file rather than whole components at once.
