const fs = require('fs');
const path = require('path');
const db = require('./db');
const items = require('./seed-data');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const jsonPath = path.join(dataDir, 'items.json');
fs.writeFileSync(jsonPath, JSON.stringify(items, null, 2));

// Votes reference items — clear votes first to satisfy FK constraint
db.exec('DELETE FROM votes');
db.exec('DELETE FROM items');
const insert = db.prepare(
  'INSERT INTO items (id, label, description, image_url) VALUES (@id, @label, @description, @image_url)'
);
const insertMany = db.transaction((rows) => {
  for (const row of rows) insert.run(row);
});
insertMany(items);

const { seedDemoVotes, NUM_VOTERS } = require('./seed-votes');
const voteCount = seedDemoVotes();

console.log(`Seeded ${items.length} items to SQLite and ${jsonPath}`);
console.log(`Seeded ${voteCount} demo votes (${NUM_VOTERS} simulated voters for Results)`);
