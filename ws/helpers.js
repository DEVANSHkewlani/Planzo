// Shared helper functions for routes and WebSocket

const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const JWT_SECRET = process.env.JWT_SECRET || 'planzo_secret_2026';

// WebSocket broadcast map: projectId -> Set of ws clients
const projectClients = new Map();
// Global set of all authenticated ws clients (for DM routing)
const allClients = new Set();

function registerClient(projectId, ws) {
  if (!projectClients.has(projectId)) projectClients.set(projectId, new Set());
  projectClients.get(projectId).add(ws);
}

function unregisterClient(projectId, ws) {
  if (projectClients.has(projectId)) projectClients.get(projectId).delete(ws);
}

function broadcast(projectId, data, excludeWs = null) {
  const clients = projectClients.get(projectId);
  if (!clients) return;
  const msg = JSON.stringify(data);
  clients.forEach(ws => {
    if (ws !== excludeWs && ws.readyState === 1) ws.send(msg);
  });
}

function broadcastAll(data) {
  projectClients.forEach(clients => {
    clients.forEach(ws => {
      if (ws.readyState === 1) ws.send(JSON.stringify(data));
    });
  });
}

function sendToUser(userId, data) {
  const msg = JSON.stringify(data);
  allClients.forEach(ws => {
    if (ws.userId === userId && ws.readyState === 1) {
      ws.send(msg);
    }
  });
}

// JWT middleware
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, phone, avatar FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// Role check helper
function requireRole(projectId, userId, roles) {
  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);
  if (!member) return false;
  return roles.includes(member.role);
}

// Log activity
function logActivity(projectId, taskId, userId, action, detail) {
  db.prepare('INSERT INTO activity_log (id, project_id, task_id, user_id, action, detail) VALUES (?, ?, ?, ?, ?, ?)')
    .run(uuidv4(), projectId, taskId || null, userId, action, detail || '');
  broadcast(projectId, { type: 'activity', projectId, action, detail });
}

// Create notification
function createNotification(userId, projectId, taskId, type, message) {
  const id = uuidv4();
  db.prepare('INSERT INTO notifications (id, user_id, project_id, task_id, type, message) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, userId, projectId || null, taskId || null, type, message);
  // Push via WS to the user's socket (search all projects they are in)
  projectClients.forEach((clients, pId) => {
    clients.forEach(ws => {
      if (ws.userId === userId && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'notification', notification: { id, type, message, project_id: projectId, task_id: taskId, read: 0, created_at: new Date().toISOString() } }));
      }
    });
  });
}

module.exports = { authenticate, requireRole, logActivity, createNotification, broadcast, broadcastAll, sendToUser, registerClient, unregisterClient, projectClients, allClients };
