const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, logActivity } = require('../ws/helpers');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/files?taskId=xxx
router.get('/', authenticate, (req, res) => {
  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: 'taskId required' });
  const task = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const files = db.prepare(`
    SELECT f.*, u.name as uploader_name FROM task_files f
    JOIN users u ON f.uploader_id = u.id
    WHERE f.task_id = ?
    ORDER BY f.created_at DESC
  `).all(taskId);
  res.json(files);
});

// GET /api/files/project/:projectId - all files in a project
router.get('/project/:projectId', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.projectId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const files = db.prepare(`
    SELECT f.*, u.name as uploader_name, t.title as task_title
    FROM task_files f
    JOIN users u ON f.uploader_id = u.id
    JOIN tasks t ON f.task_id = t.id
    WHERE t.project_id = ?
    ORDER BY f.created_at DESC
  `).all(req.params.projectId);
  res.json(files);
});

// POST /api/files/upload?taskId=xxx
router.post('/upload', authenticate, upload.single('file'), (req, res) => {
  const { taskId } = req.query;
  if (!taskId || !req.file) return res.status(400).json({ error: 'taskId and file required' });

  const task = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const id = uuidv4();
  db.prepare('INSERT INTO task_files (id, task_id, uploader_id, filename, original_name, mimetype, size) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, taskId, req.user.id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size);

  logActivity(task.project_id, taskId, req.user.id, 'file_uploaded', `${req.user.name} uploaded "${req.file.originalname}"`);

  const file = db.prepare('SELECT f.*, u.name as uploader_name FROM task_files f JOIN users u ON f.uploader_id = u.id WHERE f.id = ?').get(id);
  res.json(file);
});

// GET /api/files/download/:id
router.get('/download/:id', authenticate, (req, res) => {
  const file = db.prepare('SELECT f.*, t.project_id FROM task_files f JOIN tasks t ON f.task_id = t.id WHERE f.id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(file.project_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const filePath = path.join(__dirname, '../uploads', file.filename);
  res.download(filePath, file.original_name);
});

// DELETE /api/files/:id
router.delete('/:id', authenticate, (req, res) => {
  const file = db.prepare('SELECT f.*, t.project_id FROM task_files f JOIN tasks t ON f.task_id = t.id WHERE f.id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(file.project_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });
  if (file.uploader_id !== req.user.id && member.role !== 'admin') return res.status(403).json({ error: 'Can only delete your own files' });

  db.prepare('DELETE FROM task_files WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
