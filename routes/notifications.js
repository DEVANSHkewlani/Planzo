const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate } = require('../ws/helpers');

// GET /api/notifications
router.get('/', authenticate, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const notifications = db.prepare(`
    SELECT n.*, p.name as project_name
    FROM notifications n
    LEFT JOIN projects p ON n.project_id = p.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT ?
  `).all(req.user.id, limit);
  res.json(notifications);
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, (req, res) => {
  const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(req.user.id);
  res.json({ count: result.count });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticate, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
