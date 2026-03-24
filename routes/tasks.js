const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, logActivity, createNotification, broadcast } = require('../ws/helpers');

// GET /api/tasks?projectId=xxx
router.get('/', authenticate, (req, res) => {
  const { projectId, status, priority, assigneeId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId required' });

  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  let query = `
    SELECT t.*, 
      u.name as assignee_name, u.avatar as assignee_avatar,
      c.name as creator_name,
      (SELECT COUNT(*) FROM task_files WHERE task_id = t.id) as file_count,
      (SELECT COUNT(*) FROM task_notes WHERE task_id = t.id) as note_count
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users c ON t.creator_id = c.id
    WHERE t.project_id = ?
  `;
  const params = [projectId];

  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  if (assigneeId) { query += ' AND t.assignee_id = ?'; params.push(assigneeId); }
  query += ' ORDER BY t.created_at DESC';

  const tasks = db.prepare(query).all(...params);
  res.json(tasks);
});

// GET /api/tasks/:id
router.get('/:id', authenticate, (req, res) => {
  const task = db.prepare(`
    SELECT t.*, 
      u.name as assignee_name, u.avatar as assignee_avatar,
      c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users c ON t.creator_id = c.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) return res.status(404).json({ error: 'Task not found' });

  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  res.json(task);
});

// POST /api/tasks - admin/manager can create
router.post('/', authenticate, (req, res) => {
  const { projectId, title, description, priority, tags, assigneeId, deadline } = req.body;
  if (!projectId || !title) return res.status(400).json({ error: 'projectId and title required' });

  const member = db.prepare("SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role IN ('admin', 'manager')").get(projectId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Only admins and managers can create tasks' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO tasks (id, project_id, title, description, priority, tags, creator_id, assignee_id, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, projectId, title, description || '', priority || 'medium', JSON.stringify(tags || []), req.user.id, assigneeId || null, deadline || '');

  logActivity(projectId, id, req.user.id, 'task_created', `${req.user.name} created task "${title}"`);

  if (assigneeId && assigneeId !== req.user.id) {
    createNotification(assigneeId, projectId, id, 'task_assigned', `${req.user.name} assigned you "${title}"`);
  }

  const task = db.prepare('SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = ?').get(id);
  broadcast(projectId, { type: 'task_created', task });
  res.json(task);
});

// PUT /api/tasks/:id - edit task
router.put('/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const me = db.prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ? AND role IN ('admin', 'manager')").get(task.project_id, req.user.id);
  if (!me) return res.status(403).json({ error: 'Only admins and managers can edit tasks' });

  const { title, description, priority, tags, assigneeId, deadline } = req.body;

  // Manager/admin can reassign; member can only assign (not reassign manager's tasks unless they are manager+)
  if (assigneeId !== undefined && assigneeId !== task.assignee_id) {
    const oldAssigneeRole = task.assignee_id ? db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, task.assignee_id) : null;
    const canReassign = ['admin', 'manager'].includes(me.role) || !oldAssigneeRole;
    if (!canReassign) return res.status(403).json({ error: 'Members cannot reassign tasks already assigned to managers' });
  }

  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      priority = COALESCE(?, priority),
      tags = COALESCE(?, tags),
      assignee_id = ?,
      deadline = COALESCE(?, deadline),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(title || null, description || null, priority || null, tags ? JSON.stringify(tags) : null, 
    assigneeId !== undefined ? (assigneeId || null) : task.assignee_id, deadline || null, req.params.id);

  logActivity(task.project_id, req.params.id, req.user.id, 'task_updated', `${req.user.name} updated "${title || task.title}"`);

  if (assigneeId && assigneeId !== task.assignee_id && assigneeId !== req.user.id) {
    createNotification(assigneeId, task.project_id, req.params.id, 'task_assigned', `${req.user.name} assigned you "${title || task.title}"`);
  }

  const updated = db.prepare('SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = ?').get(req.params.id);
  broadcast(task.project_id, { type: 'task_updated', task: updated });
  res.json(updated);
});

// PUT /api/tasks/:id/status - move task status
router.put('/:id/status', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const me = db.prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ? AND role IN ('admin', 'manager')").get(task.project_id, req.user.id);
  if (!me) return res.status(403).json({ error: 'Only admins and managers can move tasks' });

  const { status } = req.body;
  if (!['todo', 'inprogress', 'done'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  db.prepare("UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);

  const statusLabel = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' }[status];
  logActivity(task.project_id, req.params.id, req.user.id, 'status_changed', `${req.user.name} moved "${task.title}" to ${statusLabel}`);

  if (task.assignee_id && task.assignee_id !== req.user.id) {
    createNotification(task.assignee_id, task.project_id, req.params.id, 'task_moved', `"${task.title}" was moved to ${statusLabel}`);
  }
  if (task.creator_id !== req.user.id && task.creator_id !== task.assignee_id) {
    createNotification(task.creator_id, task.project_id, req.params.id, 'task_moved', `"${task.title}" was moved to ${statusLabel}`);
  }

  const updated = db.prepare('SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = ?').get(req.params.id);
  broadcast(task.project_id, { type: 'task_moved', task: updated });
  res.json(updated);
});

// DELETE /api/tasks/:id - admin/manager only
router.delete('/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const me = db.prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ? AND role IN ('admin', 'manager')").get(task.project_id, req.user.id);
  if (!me) return res.status(403).json({ error: 'Admin / Manager only' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  logActivity(task.project_id, null, req.user.id, 'task_deleted', `${req.user.name} deleted task "${task.title}"`);
  broadcast(task.project_id, { type: 'task_deleted', taskId: req.params.id });
  res.json({ success: true });
});

// GET /api/tasks/:id/notes
router.get('/:id/notes', authenticate, (req, res) => {
  const task = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });
  const notes = db.prepare('SELECT n.*, u.name as author_name, u.avatar as author_avatar FROM task_notes n JOIN users u ON n.user_id = u.id WHERE n.task_id = ? ORDER BY n.created_at').all(req.params.id);
  res.json(notes);
});

// POST /api/tasks/:id/notes
router.post('/:id/notes', authenticate, (req, res) => {
  const task = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  const id = uuidv4();
  db.prepare('INSERT INTO task_notes (id, task_id, user_id, content) VALUES (?, ?, ?, ?)').run(id, req.params.id, req.user.id, content);
  logActivity(task.project_id, req.params.id, req.user.id, 'note_added', `${req.user.name} added a note`);
  const note = db.prepare('SELECT n.*, u.name as author_name, u.avatar as author_avatar FROM task_notes n JOIN users u ON n.user_id = u.id WHERE n.id = ?').get(id);
  
  // Real-time sync for notes to all project members
  broadcast(task.project_id, { type: 'note_added', note, taskId: req.params.id });
  
  res.json(note);
});

module.exports = router;
