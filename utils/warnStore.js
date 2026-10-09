const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'warnings.json');

let cache = {};
try {
  cache = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} catch (e) {
  cache = {};
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(cache, null, 2));
}

module.exports = {
  getAll() {
    if (!cache) cache = {};
    return cache;
  },
  add(userId, reason, modTag, date) {
    if (!cache[userId]) cache[userId] = [];
    cache[userId].push({ reason, mod: modTag, date });
    save();
  },
  list(userId) {
    return cache[userId] || [];
  },
  reset(userId) {
    cache[userId] = [];
    save();
  },
};