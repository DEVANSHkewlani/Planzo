const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const JWT_SECRET = process.env.JWT_SECRET || 'planzo_secret_2026';

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, email, phone || '', hash);

  const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
  const user = db.prepare('SELECT id, name, email, phone, avatar, created_at FROM users WHERE id = ?').get(id);
  res.json({ token, user });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const { password_hash, ...userSafe } = user;
  res.json({ token, user: userSafe });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { id } = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, phone, avatar, created_at FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});

// PUT /api/auth/me - update profile
router.put('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { id } = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const { name, phone, avatar } = req.body;
    db.prepare('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar = COALESCE(?, avatar) WHERE id = ?')
      .run(name || null, phone || null, avatar || null, id);
    const user = db.prepare('SELECT id, name, email, phone, avatar, created_at FROM users WHERE id = ?').get(id);
    res.json(user);
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});

// PUT /api/auth/password
router.put('/password', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { id } = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const { currentPassword, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) return res.status(400).json({ error: 'Current password incorrect' });
    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
    res.json({ success: true });
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});
// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
  // Always return success to prevent email enumeration
  if (!user) return res.json({ success: true, message: 'If that email is registered, a reset link has been generated.' });

  // Generate a short-lived reset token (15 min)
  const resetToken = jwt.sign({ id: user.id, email: user.email, purpose: 'password_reset' }, JWT_SECRET, { expiresIn: '15m' });

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const resetLink = `${baseUrl}/reset-password.html?token=${resetToken}`;

  try {
    // Simply return the reset link in the response since we aren't using email
    res.json({ success: true, resetLink, message: 'Reset link generated successfully.' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.purpose !== 'password_reset') return res.status(400).json({ error: 'Invalid reset token' });

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
    res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    res.status(400).json({ error: 'Invalid or expired reset token' });
  }
});

module.exports = router;
