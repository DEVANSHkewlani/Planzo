const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Init DB (runs schema creation)
require('./db/database');

const { registerClient, unregisterClient, broadcast, allClients } = require('./ws/helpers');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploads as static files (authenticated users access via /api/files/download/:id)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend as static files
app.use(express.static(path.join(__dirname, 'frontend')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/events', require('./routes/events'));
app.use('/api/files', require('./routes/files'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/drawing', require('./routes/drawing'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// WebSocket: handle connections
const jwt = require('jsonwebtoken');
const db = require('./db/database');
const JWT_SECRET = process.env.JWT_SECRET || 'planzo_secret_2026';

wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  ws.userId = null;
  ws.projectId = null;

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    switch (data.type) {
      case 'auth': {
        try {
          const payload = jwt.verify(data.token, JWT_SECRET);
          ws.userId = payload.id;
          allClients.add(ws);
          ws.send(JSON.stringify({ type: 'auth_ok', userId: payload.id }));
        } catch {
          ws.send(JSON.stringify({ type: 'auth_error' }));
        }
        break;
      }
      case 'join_project': {
        if (!ws.userId) return;
        // Verify membership
        const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(data.projectId, ws.userId);
        if (!member) return;

        // Leave old project room if any
        if (ws.projectId) unregisterClient(ws.projectId, ws);

        ws.projectId = data.projectId;
        registerClient(data.projectId, ws);
        ws.send(JSON.stringify({ type: 'joined_project', projectId: data.projectId }));

        // Announce presence
        broadcast(data.projectId, { type: 'user_online', userId: ws.userId }, ws);
        break;
      }
      case 'leave_project': {
        if (ws.projectId) {
          broadcast(ws.projectId, { type: 'user_offline', userId: ws.userId }, ws);
          unregisterClient(ws.projectId, ws);
          ws.projectId = null;
        }
        break;
      }
      case 'typing': {
        if (ws.projectId && ws.userId) {
          broadcast(ws.projectId, { type: 'typing', userId: ws.userId, userName: data.userName }, ws);
        }
        break;
      }
      case 'stop_typing': {
        if (ws.projectId && ws.userId) {
          broadcast(ws.projectId, { type: 'stop_typing', userId: ws.userId }, ws);
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    allClients.delete(ws);
    if (ws.projectId) {
      broadcast(ws.projectId, { type: 'user_offline', userId: ws.userId }, ws);
      unregisterClient(ws.projectId, ws);
    }
  });

  ws.on('error', () => {});
});

// Heartbeat to keep connections alive
const heartbeat = setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);
wss.on('close', () => clearInterval(heartbeat));

// Catch-all: serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Planzo running at http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from: ./frontend/`);
  console.log(`🗄️  Database: ./planzo.db`);
  console.log(`⚡ WebSocket ready\n`);
});
