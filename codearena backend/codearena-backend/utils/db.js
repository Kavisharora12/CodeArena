// Minimal file-based JSON "database".
// Your proposal (Section 4.3) names Firebase as the eventual database.
// For a local prototype, a JSON file on disk gives you the same
// collection shape (Users, Questions, Submissions) without needing
// a Firebase project, credentials, or internet access to run.
// Swapping this file for real Firebase calls later shouldn't require
// changing any of the route files, since they only ever call
// db.read() / db.write().

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db.json');

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], questions: [], submissions: [] }, null, 2));
  }
}

function read() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { read, write };
