const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const db = require('../utils/db');

const router = express.Router();

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 10);
}

// POST /api/submissions — student only.
// Matches Section 5.1: the browser runs the code and computes the verdict;
// the backend's job is just to record it, not re-run the code itself.
// Body: { questionId, code, passed, total, accepted, results }
router.post('/', requireAuth, requireRole('student'), (req, res) => {
  const { questionId, code, passed, total, accepted, results } = req.body || {};

  if (!questionId || typeof code !== 'string' || typeof passed !== 'number' || typeof total !== 'number') {
    return res.status(400).json({ error: 'questionId, code, passed, and total are required' });
  }

  const data = db.read();
  const question = data.questions.find(q => q.id === questionId);
  if (!question) return res.status(404).json({ error: 'Question not found' });

  const submission = {
    id: uid('s'),
    questionId,
    studentId: req.user.id,
    studentName: req.user.name,
    code,
    passed,
    total,
    accepted: !!accepted,
    results: results || [],
    submittedAt: new Date().toISOString()
  };
  data.submissions.push(submission);
  db.write(data);
  res.status(201).json({ submission });
});

// GET /api/submissions/me — student's own submission history
router.get('/me', requireAuth, requireRole('student'), (req, res) => {
  const data = db.read();
  const mine = data.submissions
    .filter(s => s.studentId === req.user.id)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.json({ submissions: mine });
});

// GET /api/submissions?questionId=... — faculty view of submissions for a question
router.get('/', requireAuth, requireRole('faculty'), (req, res) => {
  const data = db.read();
  const { questionId } = req.query;
  const list = questionId
    ? data.submissions.filter(s => s.questionId === questionId)
    : data.submissions;
  res.json({ submissions: list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)) });
});

module.exports = router;
