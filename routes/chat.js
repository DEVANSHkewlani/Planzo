const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, sendToUser, broadcast } = require('../ws/helpers');

// ─── Direct Messaging ───

// Get all teammates (users sharing any project)
router.get('/users', authenticate, (req, res) => {
  const users = db.prepare(`
    SELECT DISTINCT u.id, u.name, u.avatar 
    FROM project_members pm1
    JOIN project_members pm2 ON pm1.project_id = pm2.project_id
    JOIN users u ON pm2.user_id = u.id
    WHERE pm1.user_id = ? AND u.id != ?
  `).all(req.user.id, req.user.id);
  res.json(users);
});

// Get direct messages with another user
router.get('/direct/:otherUserId', authenticate, (req, res) => {
  const share = db.prepare(`
    SELECT 1 FROM project_members pm1
    JOIN project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = ? AND pm2.user_id = ? LIMIT 1
  `).get(req.user.id, req.params.otherUserId);
  
  if (!share) return res.status(403).json({ error: 'No shared teams' });

  const limit = parseInt(req.query.limit) || 50;
  
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM direct_messages m
    JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at DESC
    LIMIT ?
  `).all(req.user.id, req.params.otherUserId, req.params.otherUserId, req.user.id, limit).reverse();
  
  res.json(messages);
});

// Send direct message
router.post('/direct/:otherUserId', authenticate, (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });

  const share = db.prepare(`
    SELECT 1 FROM project_members pm1
    JOIN project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = ? AND pm2.user_id = ? LIMIT 1
  `).get(req.user.id, req.params.otherUserId);
  if (!share) return res.status(403).json({ error: 'No shared teams' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO direct_messages (id, sender_id, receiver_id, content) 
    VALUES (?, ?, ?, ?)
  `).run(id, req.user.id, req.params.otherUserId, content.trim());
  
  const msg = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM direct_messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(id);

  sendToUser(req.params.otherUserId, { type: 'dm_message', message: msg, otherUserId: req.user.id });
  sendToUser(req.user.id, { type: 'dm_message', message: msg, otherUserId: req.params.otherUserId });
  
  res.json(msg);
});

// ─── Project Chat (backward-compatible for project overview) ───

// GET /api/chat/:projectId
router.get('/:projectId', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.projectId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const limit = parseInt(req.query.limit) || 50;
  const before = req.query.before;

  let query = `
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.project_id = ?
  `;
  const params = [req.params.projectId];
  if (before) { query += ' AND m.created_at < ?'; params.push(before); }
  query += ' ORDER BY m.created_at DESC LIMIT ?';
  params.push(limit);

  const messages = db.prepare(query).all(...params).reverse();
  res.json(messages);
});

// POST /api/chat/:projectId
router.post('/:projectId', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.projectId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });

  const id = uuidv4();
  db.prepare('INSERT INTO messages (id, project_id, user_id, content) VALUES (?, ?, ?, ?)').run(id, req.params.projectId, req.user.id, content.trim());

  const message = db.prepare('SELECT m.*, u.name as sender_name, u.avatar as sender_avatar FROM messages m JOIN users u ON m.user_id = u.id WHERE m.id = ?').get(id);

  // Handle @mentions
  const mentions = content.match(/@(\w+)/g);
  if (mentions) {
    const members = db.prepare('SELECT u.id, u.name FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?').all(req.params.projectId);
    mentions.forEach(mention => {
      const name = mention.slice(1).toLowerCase();
      const mentioned = members.find(m => m.name.toLowerCase().replace(/\s+/g, '') === name || m.name.toLowerCase().startsWith(name));
      if (mentioned && mentioned.id !== req.user.id) {
        const { createNotification } = require('../ws/helpers');
        createNotification(mentioned.id, req.params.projectId, null, 'mention', `${req.user.name} mentioned you in chat`);
      }
    });
  }

  broadcast(req.params.projectId, { type: 'chat_message', message });
  res.json(message);
});

module.exports = router;
