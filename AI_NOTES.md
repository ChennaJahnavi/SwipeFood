# AI Collaboration Notes

## What Cursor/Claude wrote end-to-end

- Initial project scaffold (Express + SQLite schema, Vite + React + Tailwind)
- All three API route handlers and seed data for 100+ food items
- Swipe card gesture logic (pointer events + Framer Motion)
- Results and Matches views, README structure

## Where I pushed back / fixed AI output

**Example:** The study guide recommends `react-tinder-card`, but it does not support React 19 (peer dependency conflict). I directed the AI to implement a **custom swipe card** with Framer Motion and pointer events instead, which also satisfies the “mouse drag on desktop” requirement without legacy peer-deps hacks.

## One thing better / worse than expected

- **Better:** Generating 100+ labeled seed items and the full API with dedup validation in one pass was fast and mostly correct.
- **Worse:** The first draft of `SwipeCard.jsx` had duplicated JSX and broken markup; required a manual rewrite to keep the component clean.

## Other tools

- **Cursor Agent** — primary builder and debugger for this session.
- No image-generation AI used; picsum.photos placeholders for speed and licensing safety.

## Verification I performed

- [ ] Run `npm run seed` and confirm 104 items
- [ ] Swipe through several cards; confirm votes in Results
- [ ] Reload page; confirm session persists and no double-count on same item
- [ ] Test undo and Matches tab
- [ ] Record 2–3 minute demo video

*(Check boxes after you run through the app locally.)*
