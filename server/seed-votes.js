/**
 * Adds demo votes from many fake users so Results looks populated.
 * Safe to re-run: only removes votes from demo_voter_* sessions.
 */
const db = require('./db');

const NUM_VOTERS = 120;
const DEMO_PREFIX = 'demo_voter_';

function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedDemoVotes() {
  const items = db.prepare('SELECT id FROM items ORDER BY id').all();
  if (items.length === 0) {
    console.warn('No items in DB — run seed.js first');
    return 0;
  }

  db.prepare(`DELETE FROM votes WHERE session_id LIKE '${DEMO_PREFIX}%'`).run();

  const insert = db.prepare(
    'INSERT INTO votes (session_id, item_id, choice) VALUES (?, ?, ?)'
  );
  const rng = mulberry32(42);

  let count = 0;
  const insertMany = db.transaction(() => {
    for (const { id: itemId } of items) {
      // Each dish gets its own "popularity" between ~20% and ~90% yes
      const yesRate = 0.2 + rng() * 0.7;
      for (let v = 0; v < NUM_VOTERS; v++) {
        const sessionId = `${DEMO_PREFIX}${String(v + 1).padStart(3, '0')}`;
        const choice = rng() < yesRate ? 'yes' : 'no';
        insert.run(sessionId, itemId, choice);
        count++;
      }
    }
  });
  insertMany();

  return count;
}

if (require.main === module) {
  const n = seedDemoVotes();
  console.log(`Seeded ${n} demo votes (${NUM_VOTERS} voters × items in DB)`);
}

module.exports = { seedDemoVotes, NUM_VOTERS };
