const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, broadcast } = require('../ws/helpers');

// GET /api/drawing/:projectId
router.get('/:projectId', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.projectId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  let drawing = db.prepare('SELECT * FROM drawing_data WHERE project_id = ?').get(req.params.projectId);
  if (!drawing) {
    const id = uuidv4();
    db.prepare('INSERT INTO drawing_data (id, project_id, data_json) VALUES (?, ?, ?)').run(id, req.params.projectId, '[]');
    drawing = db.prepare('SELECT * FROM drawing_data WHERE project_id = ?').get(req.params.projectId);
  }
  res.json(drawing);
});

// PUT /api/drawing/:projectId
router.put('/:projectId', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.projectId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const { data_json } = req.body;
  db.prepare("UPDATE drawing_data SET data_json = ?, updated_at = datetime('now') WHERE project_id = ?").run(JSON.stringify(data_json || []), req.params.projectId);
  broadcast(req.params.projectId, { type: 'drawing_updated' });
  res.json({ success: true });
});

module.exports = router;
