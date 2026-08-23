const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const db = require('../utils/db');

const router = express.Router();

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 10);
}

// POST /api/auth/register  { name, email, password, role }
// role must be 'student' or 'faculty'. Matches Section 4.2.1 (role-based login).
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  if (!['student', 'faculty'].includes(role)) {
    return res.status(400).json({ error: "role must be 'student' or 'faculty'" });
  }

  const data = db.read();
  const exists = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: uid('u'), name, email, passwordHash, role, createdAt: new Date().toISOString() };
  data.users.push(user);
  db.write(data);

  const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const data = db.read();
  const user = data.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

module.exports = router;
