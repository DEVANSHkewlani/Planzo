const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate } = require('../ws/helpers');

// GET /api/activity/:projectId
router.get('/:projectId', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.projectId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const { userId, taskId, limit = 50 } = req.query;
  let query = `
    SELECT a.*, u.name as user_name, u.avatar as user_avatar, t.title as task_title
    FROM activity_log a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN tasks t ON a.task_id = t.id
    WHERE a.project_id = ?
  `;
  const params = [req.params.projectId];
  if (userId) { query += ' AND a.user_id = ?'; params.push(userId); }
  if (taskId) { query += ' AND a.task_id = ?'; params.push(taskId); }
  query += ' ORDER BY a.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  const logs = db.prepare(query).all(...params);
  res.json(logs);
});

module.exports = router;
