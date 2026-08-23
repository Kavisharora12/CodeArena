const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const db = require('../utils/db');

const router = express.Router();

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 10);
}

// Strip hidden test cases before a question ever reaches a student's
// list view. This is the server-side half of the Section 10 mitigation:
// hidden cases should only leave the backend at the moment of an
// actual submission, not just because a student opened the page.
function toStudentSafe(q) {
  return {
    ...q,
    testCases: q.testCases.filter(tc => !tc.hidden)
  };
}

// GET /api/questions — list all questions.
// Students get public test cases only; faculty see everything.
router.get('/', requireAuth, (req, res) => {
  const data = db.read();
  const questions = req.user.role === 'faculty'
    ? data.questions
    : data.questions.map(toStudentSafe);
  res.json({ questions });
});

// GET /api/questions/:id — single question, same visibility rule as above.
router.get('/:id', requireAuth, (req, res) => {
  const data = db.read();
  const q = data.questions.find(q => q.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });
  res.json({ question: req.user.role === 'faculty' ? q : toStudentSafe(q) });
});

// GET /api/questions/:id/for-submission — full test cases (public + hidden),
// for a student who is actively submitting and needs to evaluate their code.
// NOTE: this is exactly the trade-off flagged in Section 10 of the proposal —
// because evaluation runs client-side, hidden cases have to reach the
// browser at submission time, so a determined student could inspect them
// via dev tools. Real hardening (server-side sandboxed execution) is
// deferred to a later phase, as your document already states.
router.get('/:id/for-submission', requireAuth, requireRole('student'), (req, res) => {
  const data = db.read();
  const q = data.questions.find(q => q.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });
  res.json({ question: q });
});

// POST /api/questions — faculty only. Body: { title, description, testCases: [{input, output, hidden}] }
router.post('/', requireAuth, requireRole('faculty'), (req, res) => {
  const { title, description, testCases } = req.body || {};

  if (!title || !Array.isArray(testCases) || testCases.length === 0) {
    return res.status(400).json({ error: 'title and at least one test case are required' });
  }
  for (const tc of testCases) {
    if (typeof tc.input !== 'string' || typeof tc.output !== 'string') {
      return res.status(400).json({ error: 'Each test case needs input and output as JSON strings' });
    }
    try { JSON.parse(tc.input); JSON.parse(tc.output); }
    catch (e) { return res.status(400).json({ error: 'Test case input/output must be valid JSON' }); }
  }

  const data = db.read();
  const question = {
    id: uid('q'),
    title,
    description: description || '',
    testCases: testCases.map(tc => ({ input: tc.input, output: tc.output, hidden: !!tc.hidden })),
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  data.questions.push(question);
  db.write(data);
  res.status(201).json({ question });
});

// DELETE /api/questions/:id — faculty only
router.delete('/:id', requireAuth, requireRole('faculty'), (req, res) => {
  const data = db.read();
  const exists = data.questions.some(q => q.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Question not found' });
  data.questions = data.questions.filter(q => q.id !== req.params.id);
  db.write(data);
  res.status(204).send();
});

module.exports = router;
