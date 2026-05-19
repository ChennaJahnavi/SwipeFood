const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '32kb' }));

// Ensure DB has items on first run
const itemCount = db.prepare('SELECT COUNT(*) AS n FROM items').get().n;
if (itemCount === 0) {
  require('./seed');
}

function validateSessionId(sessionId) {
  return typeof sessionId === 'string' && /^[a-zA-Z0-9_-]{8,64}$/.test(sessionId);
}

function validateItemId(itemId) {
  return typeof itemId === 'string' && /^food-\d{3}$/.test(itemId);
}

// GET /items — all items + which this session already voted on
app.get('/items', (req, res) => {
  const sessionId = req.query.sessionId;
  if (sessionId && !validateSessionId(sessionId)) {
    return res.status(400).json({ error: 'Invalid sessionId' });
  }

  const items = db.prepare('SELECT id, label, description, image_url FROM items ORDER BY id').all();

  let votedIds = [];
  if (sessionId) {
    votedIds = db
      .prepare('SELECT item_id FROM votes WHERE session_id = ?')
      .all(sessionId)
      .map((r) => r.item_id);
  }

  res.json({ items, votedIds, total: items.length });
});

// POST /vote — idempotent per (sessionId, itemId) via UNIQUE constraint
app.post('/vote', (req, res) => {
  const { itemId, choice, sessionId } = req.body ?? {};

  if (!validateSessionId(sessionId)) {
    return res.status(400).json({ error: 'Invalid sessionId' });
  }
  if (!validateItemId(itemId)) {
    return res.status(400).json({ error: 'Invalid itemId' });
  }
  if (choice !== 'yes' && choice !== 'no') {
    return res.status(400).json({ error: 'choice must be "yes" or "no"' });
  }

  const item = db.prepare('SELECT id FROM items WHERE id = ?').get(itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const existing = db
    .prepare('SELECT choice FROM votes WHERE session_id = ? AND item_id = ?')
    .get(sessionId, itemId);

  if (existing) {
    if (existing.choice === choice) {
      return res.json({ ok: true, duplicate: true, message: 'Already voted' });
    }
    // Allow changing vote: update counts by replacing choice
    db.prepare("UPDATE votes SET choice = ?, created_at = datetime('now') WHERE session_id = ? AND item_id = ?").run(
      choice,
      sessionId,
      itemId
    );
    return res.json({ ok: true, updated: true });
  }

  try {
    db.prepare('INSERT INTO votes (session_id, item_id, choice) VALUES (?, ?, ?)').run(
      sessionId,
      itemId,
      choice
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.json({ ok: true, duplicate: true });
    }
    throw err;
  }
});

// DELETE /vote — undo last vote for session (stretch)
app.delete('/vote', (req, res) => {
  const { sessionId } = req.body ?? {};
  if (!validateSessionId(sessionId)) {
    return res.status(400).json({ error: 'Invalid sessionId' });
  }

  const last = db
    .prepare(
      'SELECT id, item_id, choice FROM votes WHERE session_id = ? ORDER BY id DESC LIMIT 1'
    )
    .get(sessionId);

  if (!last) {
    return res.status(404).json({ error: 'No votes to undo' });
  }

  db.prepare('DELETE FROM votes WHERE id = ?').run(last.id);
  res.json({ ok: true, undone: { itemId: last.item_id, choice: last.choice } });
});

// GET /results — aggregate counts
app.get('/results', (req, res) => {
  const sort = req.query.sort || 'most-loved';
  const validSorts = ['most-loved', 'most-hated', 'most-controversial', 'most-votes'];
  if (!validSorts.includes(sort)) {
    return res.status(400).json({ error: 'Invalid sort parameter' });
  }

  const rows = db
    .prepare(
      `
    SELECT
      i.id,
      i.label,
      i.description,
      i.image_url,
      COALESCE(SUM(CASE WHEN v.choice = 'yes' THEN 1 ELSE 0 END), 0) AS yes_count,
      COALESCE(SUM(CASE WHEN v.choice = 'no' THEN 1 ELSE 0 END), 0) AS no_count,
      COUNT(v.id) AS total_votes
    FROM items i
    LEFT JOIN votes v ON v.item_id = i.id
    GROUP BY i.id
  `
    )
    .all()
    .map((r) => {
      const total = r.yes_count + r.no_count;
      const yesRate = total > 0 ? r.yes_count / total : 0;
      const controversy = total > 0 ? 1 - Math.abs(yesRate - 0.5) * 2 : 0;
      return { ...r, yes_rate: yesRate, controversy };
    });

  const sorted = [...rows].sort((a, b) => {
    switch (sort) {
      case 'most-hated':
        return a.yes_rate - b.yes_rate || b.total_votes - a.total_votes;
      case 'most-controversial':
        return b.controversy - a.controversy || b.total_votes - a.total_votes;
      case 'most-votes':
        return b.total_votes - a.total_votes;
      case 'most-loved':
      default:
        return b.yes_rate - a.yes_rate || b.total_votes - a.total_votes;
    }
  });

  res.json({ results: sorted, sort });
});

// GET /matches — user yes + global yes_rate > 60% (stretch)
app.get('/matches', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!validateSessionId(sessionId)) {
    return res.status(400).json({ error: 'Invalid sessionId' });
  }

  const threshold = 0.6;
  const rows = db
    .prepare(
      `
    SELECT
      i.id, i.label, i.description, i.image_url,
      COALESCE(SUM(CASE WHEN v.choice = 'yes' THEN 1 ELSE 0 END), 0) AS yes_count,
      COALESCE(SUM(CASE WHEN v.choice = 'no' THEN 1 ELSE 0 END), 0) AS no_count
    FROM items i
    INNER JOIN votes uv ON uv.item_id = i.id AND uv.session_id = ? AND uv.choice = 'yes'
    LEFT JOIN votes v ON v.item_id = i.id
    GROUP BY i.id
    HAVING CAST(yes_count AS REAL) / NULLIF(yes_count + no_count, 0) >= ?
  `
    )
    .all(sessionId, threshold)
    .map((r) => {
      const total = r.yes_count + r.no_count;
      return { ...r, yes_rate: total > 0 ? r.yes_count / total : 0 };
    });

  res.json({ matches: rows, threshold });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
