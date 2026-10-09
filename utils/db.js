const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'economy.json');

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
  get(userId) {
    if (!cache[userId]) {
      cache[userId] = { balance: 100, lastDaily: 0, lastWork: 0 };
    }
    return cache[userId];
  },
  save() {
    save();
  },
  all() {
    return cache;
  },
};