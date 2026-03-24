const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../ws/helpers');

// Get all events for current user
router.get('/', authenticate, (req, res) => {
  try {
    const events = db.prepare(`SELECT * FROM events WHERE user_id = ?`).all(req.user.id);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create event
router.post('/', authenticate, (req, res) => {
  try {
    const { title, description, start_time, end_time, is_all_day } = req.body;
    if (!title || !start_time || !end_time) return res.status(400).json({ error: 'Missing fields' });
    
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO events (id, user_id, title, description, start_time, end_time, is_all_day)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, req.user.id, title, description || '', start_time, end_time, is_all_day ? 1 : 0);
    
    const newEvent = db.prepare(`SELECT * FROM events WHERE id = ?`).get(id);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/:id', authenticate, (req, res) => {
  try {
    const { title, description, start_time, end_time, is_all_day } = req.body;
    const stmt = db.prepare(`
      UPDATE events 
      SET title = COALESCE(?, title), 
          description = COALESCE(?, description),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          is_all_day = COALESCE(?, is_all_day)
      WHERE id = ? AND user_id = ?
    `);
    
    const allDayVal = is_all_day !== undefined ? (is_all_day ? 1 : 0) : null;
    
    const info = stmt.run(title, description, start_time, end_time, allDayVal, req.params.id, req.user.id);
    
    if (info.changes === 0) return res.status(404).json({ error: 'Event not found or unauthorized' });
    const updated = db.prepare(`SELECT * FROM events WHERE id = ?`).get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete event
router.delete('/:id', authenticate, (req, res) => {
  try {
    const info = db.prepare(`DELETE FROM events WHERE id = ? AND user_id = ?`).run(req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Event not found or unauthorized' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
