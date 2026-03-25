const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, logActivity, createNotification, broadcast } = require('../ws/helpers');

// GET /api/projects - get all projects for logged in user
router.get('/', authenticate, (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, t.name as team_name, t.code as team_code, pm.role,
      u.name as creator_name,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_tasks,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status != 'done') as pending_tasks,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
    FROM projects p
    JOIN teams t ON p.team_id = t.id
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON p.creator_id = u.id
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json(projects);
});

// GET /api/projects/:id
router.get('/:id', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member of this project' });

  const project = db.prepare(`
    SELECT p.*, t.name as team_name, t.code as team_code, pm.role,
      u.name as creator_name,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_tasks,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status != 'done') as pending_tasks
    FROM projects p
    JOIN teams t ON p.team_id = t.id
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON p.creator_id = u.id
    WHERE p.id = ?
  `).get(req.user.id, req.params.id);

  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// POST /api/projects - create project + team
router.post('/', authenticate, (req, res) => {
  const { name, description, teamName, deadline } = req.body;
  if (!name || !teamName) return res.status(400).json({ error: 'Project name and team name are required' });

  const teamId = uuidv4();
  const projectId = uuidv4();

  // Generate unique team code
  let code;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (db.prepare('SELECT id FROM teams WHERE code = ?').get(code));

  db.prepare('INSERT INTO teams (id, name, code, creator_id) VALUES (?, ?, ?, ?)').run(teamId, teamName, code, req.user.id);
  db.prepare('INSERT INTO projects (id, name, description, team_id, creator_id, deadline) VALUES (?, ?, ?, ?, ?, ?)').run(projectId, name, description || '', teamId, req.user.id, deadline || '');
  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(projectId, req.user.id, 'admin');
  db.prepare('INSERT INTO drawing_data (id, project_id) VALUES (?, ?)').run(uuidv4(), projectId);

  logActivity(projectId, null, req.user.id, 'project_created', `Project "${name}" was created`);
  const project = db.prepare('SELECT p.*, t.name as team_name, t.code as team_code FROM projects p JOIN teams t ON p.team_id = t.id WHERE p.id = ?').get(projectId);
  res.json(project);
});

// POST /api/projects/join - join by team code
router.post('/join', authenticate, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Team code is required' });

  const team = db.prepare('SELECT * FROM teams WHERE code = ?').get(code.toUpperCase());
  if (!team) return res.status(404).json({ error: 'Invalid team code' });

  const project = db.prepare('SELECT * FROM projects WHERE team_id = ?').get(team.id);
  if (!project) return res.status(404).json({ error: 'No project found for this team' });

  const existing = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(project.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already a member of this project' });

  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(project.id, req.user.id, 'member');
  logActivity(project.id, null, req.user.id, 'member_joined', `${req.user.name} joined the project`);
  
  // Notify admin
  const admin = db.prepare("SELECT user_id FROM project_members WHERE project_id = ? AND role = 'admin'").get(project.id);
  if (admin) createNotification(admin.user_id, project.id, null, 'member_joined', `${req.user.name} joined project "${project.name}"`);

  res.json({ project });
});

// PUT /api/projects/:id
router.put('/:id', authenticate, (req, res) => {
  const member = db.prepare("SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = 'admin'").get(req.params.id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Admin only' });

  const { name, description, deadline } = req.body;
  db.prepare('UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), deadline = COALESCE(?, deadline) WHERE id = ?')
    .run(name || null, description || null, deadline || null, req.params.id);
  res.json({ success: true });
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, (req, res) => {
  const member = db.prepare("SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = 'admin'").get(req.params.id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Admin only' });

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  broadcast(req.params.id, { type: 'project_deleted', projectId: req.params.id }); 
  res.json({ success: true });
});

// GET /api/projects/:id/members
router.get('/:id/members', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar, pm.role, pm.joined_at
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY CASE pm.role WHEN 'admin' THEN 0 WHEN 'manager' THEN 1 ELSE 2 END, u.name
  `).all(req.params.id);
  res.json(members);
});

// POST /api/projects/:id/members - add member (admin only)
router.post('/:id/members', authenticate, (req, res) => {
  const me = db.prepare("SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = 'admin'").get(req.params.id, req.user.id);
  if (!me) return res.status(403).json({ error: 'Admin only' });

  const { email, role } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const existing = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, user.id);
  if (existing) return res.status(409).json({ error: 'Already a member' });

  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(req.params.id, user.id, role || 'member');

  const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(req.params.id);
  createNotification(user.id, req.params.id, null, 'added_to_project', `You were added to project "${project.name}" as ${role || 'member'}`);
  broadcast(req.params.id, { type: 'member_added', userId: user.id });
  logActivity(req.params.id, null, req.user.id, 'member_added', `${req.user.name} added ${user.name} as ${role || 'member'}`);

  res.json({ success: true });
});

// PUT /api/projects/:id/members/:userId/role - change role (admin only)
router.put('/:id/members/:userId/role', authenticate, (req, res) => {
  const me = db.prepare("SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = 'admin'").get(req.params.id, req.user.id);
  if (!me) return res.status(403).json({ error: 'Admin only' });

  const { role } = req.body;
  if (!['admin', 'manager', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  db.prepare('UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?').run(role, req.params.id, req.params.userId);
  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.params.userId);
  logActivity(req.params.id, null, req.user.id, 'role_changed', `${req.user.name} changed ${user?.name}'s role to ${role}`);
  res.json({ success: true });
});

// DELETE /api/projects/:id/members/:userId - remove member (admin only)
router.delete('/:id/members/:userId', authenticate, (req, res) => {
  const me = db.prepare("SELECT * FROM project_members WHERE project_id = ? AND role = 'admin' AND user_id = ?").get(req.params.id, req.user.id);
  if (!me) return res.status(403).json({ error: 'Admin only' });
  if (req.params.userId === req.user.id) return res.status(400).json({ error: "Can't remove yourself" });

  const removedUser = db.prepare('SELECT name FROM users WHERE id = ?').get(req.params.userId);
  // Unassign their tasks
  const unassigned = db.prepare('SELECT id, title FROM tasks WHERE project_id = ? AND assignee_id = ?').all(req.params.id, req.params.userId);
  db.prepare('UPDATE tasks SET assignee_id = NULL WHERE project_id = ? AND assignee_id = ?').run(req.params.id, req.params.userId);

  // Notify all admins/managers about unassigned tasks
  if (unassigned.length > 0) {
    const managers = db.prepare("SELECT user_id FROM project_members WHERE project_id = ? AND role IN ('admin','manager')").all(req.params.id);
    managers.forEach(m => {
      createNotification(m.user_id, req.params.id, null, 'tasks_unassigned',
        `${removedUser?.name} was removed. ${unassigned.length} task(s) are now unassigned.`);
    });
    logActivity(req.params.id, null, req.user.id, 'tasks_unassigned', `${unassigned.length} task(s) unassigned after removing ${removedUser?.name}`);
  }

  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
  createNotification(req.params.userId, req.params.id, null, 'removed_from_project', `You were removed from this project`);
  logActivity(req.params.id, null, req.user.id, 'member_removed', `${req.user.name} removed ${removedUser?.name}`);
  broadcast(req.params.id, { type: 'member_removed', userId: req.params.userId });

  res.json({ success: true, unassignedCount: unassigned.length });
});

// POST /api/projects/:id/leave - leave a project (any member/manager)
router.post('/:id/leave', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member of this project' });

  // Prevent the sole admin from leaving
  if (member.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as cnt FROM project_members WHERE project_id = ? AND role = 'admin'").get(req.params.id);
    if (adminCount.cnt <= 1) {
      return res.status(400).json({ error: 'You are the only admin. Transfer admin rights before leaving.' });
    }
  }

  // Unassign tasks assigned to this user
  const unassigned = db.prepare('SELECT id, title FROM tasks WHERE project_id = ? AND assignee_id = ?').all(req.params.id, req.user.id);
  db.prepare('UPDATE tasks SET assignee_id = NULL WHERE project_id = ? AND assignee_id = ?').run(req.params.id, req.user.id);

  // Notify admins/managers about unassigned tasks
  if (unassigned.length > 0) {
    const managers = db.prepare("SELECT user_id FROM project_members WHERE project_id = ? AND role IN ('admin','manager') AND user_id != ?").all(req.params.id, req.user.id);
    managers.forEach(m => {
      createNotification(m.user_id, req.params.id, null, 'tasks_unassigned',
        `${req.user.name} left the project. ${unassigned.length} task(s) are now unassigned.`);
    });
  }

  // Remove user from project
  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.user.id);

  // Notify admins
  const admins = db.prepare("SELECT user_id FROM project_members WHERE project_id = ? AND role IN ('admin','manager')").all(req.params.id);
  admins.forEach(a => {
    createNotification(a.user_id, req.params.id, null, 'member_left', `${req.user.name} left the project`);
  });

  logActivity(req.params.id, null, req.user.id, 'member_left', `${req.user.name} left the project`);
  broadcast(req.params.id, { type: 'member_removed', userId: req.user.id });

  res.json({ success: true, unassignedCount: unassigned.length });
});

module.exports = router;
