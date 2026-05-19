/**
 * API end-to-end smoke tests — run with server on :3001
 * Usage: node scripts/e2e-api.test.js
 */
const BASE = process.env.API_URL || 'http://localhost:3001';
const SESSION = 'e2etest_session_01';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

async function json(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function run() {
  console.log('\n=== API E2E Tests ===\n');

  // Health
  const health = await json('/health');
  assert(health.res.ok && health.body.ok, 'GET /health');

  // Items — 104 total
  const items = await json(`/items?sessionId=${SESSION}`);
  assert(items.res.ok, 'GET /items status');
  assert(items.body.total >= 100, `GET /items has 100+ items (${items.body.total})`);
  assert(Array.isArray(items.body.items) && items.body.items[0]?.label, 'GET /items shape');
  const firstId = items.body.items[0].id;

  // Vote yes
  const vote1 = await json('/vote', {
    method: 'POST',
    body: JSON.stringify({ itemId: firstId, choice: 'yes', sessionId: SESSION }),
  });
  assert(vote1.res.status === 201 || vote1.body.ok, 'POST /vote yes');

  // Dedup — same vote again
  const voteDup = await json('/vote', {
    method: 'POST',
    body: JSON.stringify({ itemId: firstId, choice: 'yes', sessionId: SESSION }),
  });
  assert(voteDup.body.duplicate || voteDup.body.ok, 'POST /vote dedup same choice');

  // Change vote
  const voteChange = await json('/vote', {
    method: 'POST',
    body: JSON.stringify({ itemId: firstId, choice: 'no', sessionId: SESSION }),
  });
  assert(voteChange.body.updated || voteChange.body.ok, 'POST /vote change choice');

  // Items — votedIds includes first
  const items2 = await json(`/items?sessionId=${SESSION}`);
  assert(items2.body.votedIds.includes(firstId), 'GET /items votedIds after vote');

  // Invalid vote rejected
  const bad = await json('/vote', {
    method: 'POST',
    body: JSON.stringify({ itemId: 'bad-id', choice: 'yes', sessionId: SESSION }),
  });
  assert(bad.res.status === 400, 'POST /vote rejects invalid itemId');

  // Results
  const results = await json('/results?sort=most-loved');
  assert(results.res.ok && results.body.results.length >= 100, 'GET /results');
  const row = results.body.results.find((r) => r.id === firstId);
  assert(row && row.no_count >= 1, 'GET /results reflects vote');

  // Matches (may be empty)
  const matches = await json(`/matches?sessionId=${SESSION}`);
  assert(matches.res.ok && Array.isArray(matches.body.matches), 'GET /matches');

  // Undo
  const undo = await json('/vote', {
    method: 'DELETE',
    body: JSON.stringify({ sessionId: SESSION }),
  });
  assert(undo.body.ok && undo.body.undone?.itemId === firstId, 'DELETE /vote undo');

  const items3 = await json(`/items?sessionId=${SESSION}`);
  assert(!items3.body.votedIds.includes(firstId), 'GET /items after undo');

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
