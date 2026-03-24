const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate } = require('../ws/helpers');

// GET /api/analytics/:projectId
router.get('/:projectId', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.projectId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const pid = req.params.projectId;

  // Task completion stats
  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status
  `).all(pid);

  // Priority distribution
  const priorityCounts = db.prepare(`
    SELECT priority, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY priority
  `).all(pid);

  // Per-member task counts
  const memberStats = db.prepare(`
    SELECT u.id, u.name, u.avatar,
      COUNT(t.id) as total_assigned,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN t.status = 'inprogress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    LEFT JOIN tasks t ON t.project_id = pm.project_id AND t.assignee_id = pm.user_id
    WHERE pm.project_id = ?
    GROUP BY u.id
    ORDER BY total_assigned DESC
  `).all(pid);

  // Tasks created over last 14 days
  const tasksPerDay = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count
    FROM tasks
    WHERE project_id = ? AND created_at >= date('now', '-14 days')
    GROUP BY day
    ORDER BY day
  `).all(pid);

  // Tasks completed over last 14 days
  const donePerDay = db.prepare(`
    SELECT date(updated_at) as day, COUNT(*) as count
    FROM tasks
    WHERE project_id = ? AND status = 'done' AND updated_at >= date('now', '-14 days')
    GROUP BY day
    ORDER BY day
  `).all(pid);

  // Overdue tasks (deadline passed, not done)
  const overdue = db.prepare(`
    SELECT t.*, u.name as assignee_name FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.project_id = ? AND t.deadline != '' AND t.deadline < date('now') AND t.status != 'done'
  `).all(pid);

  // Total messages
  const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE project_id = ?').get(pid);

  // Total files
  const fileCount = db.prepare('SELECT COUNT(*) as count FROM task_files tf JOIN tasks t ON tf.task_id = t.id WHERE t.project_id = ?').get(pid);

  res.json({
    statusCounts,
    priorityCounts,
    memberStats,
    tasksPerDay,
    donePerDay,
    overdue,
    messageCount: messageCount.count,
    fileCount: fileCount.count
  });
});

module.exports = router;
