// Centralized API helper with JWT auth for Planzo frontend
const API_BASE = '/api';

const Api = {
  // Auth token management
  getToken: () => localStorage.getItem('lw_token'),
  getUser: () => { try { return JSON.parse(localStorage.getItem('lw_user')); } catch { return null; } },
  setSession: (token, user) => { localStorage.setItem('lw_token', token); localStorage.setItem('lw_user', JSON.stringify(user)); },
  clearSession: () => { localStorage.removeItem('lw_token'); localStorage.removeItem('lw_user'); },
  isLoggedIn: () => !!Api.getToken(),

  // Base fetch helper
  async request(method, path, body = null, isFormData = false) {
    const headers = {};
    const token = Api.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData && body) headers['Content-Type'] = 'application/json';

    const options = { method, headers };
    if (body) options.body = isFormData ? body : JSON.stringify(body);

    const res = await fetch(API_BASE + path, options);
    if (res.status === 401) {
      Api.clearSession();
      window.location.href = '/auth.html';
      return null;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  get: (path) => Api.request('GET', path),
  post: (path, body) => Api.request('POST', path, body),
  put: (path, body) => Api.request('PUT', path, body),
  del: (path) => Api.request('DELETE', path),

  // Upload file
  async upload(path, formData) {
    const token = Api.getToken();
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  // Auth
  auth: {
    signup: (body) => Api.post('/auth/signup', body),
    login: (body) => Api.post('/auth/login', body),
    me: () => Api.get('/auth/me'),
    updateProfile: (body) => Api.put('/auth/me', body),
    changePassword: (body) => Api.put('/auth/password', body),
  },

  // Projects
  projects: {
    list: () => Api.get('/projects'),
    get: (id) => Api.get(`/projects/${id}`),
    create: (body) => Api.post('/projects', body),
    join: (code) => Api.post('/projects/join', { code }),
    update: (id, body) => Api.put(`/projects/${id}`, body),
    delete: (id) => Api.del(`/projects/${id}`),
    getMembers: (id) => Api.get(`/projects/${id}/members`),
    addMember: (id, body) => Api.post(`/projects/${id}/members`, body),
    changeMemberRole: (id, userId, role) => Api.put(`/projects/${id}/members/${userId}/role`, { role }),
    removeMember: (id, userId) => Api.del(`/projects/${id}/members/${userId}`),
    leave: (id) => Api.post(`/projects/${id}/leave`),
  },

  // Tasks
  tasks: {
    list: (projectId, filters = {}) => {
      const params = new URLSearchParams({ projectId, ...filters });
      return Api.get(`/tasks?${params}`);
    },
    get: (id) => Api.get(`/tasks/${id}`),
    create: (body) => Api.post('/tasks', body),
    update: (id, body) => Api.put(`/tasks/${id}`, body),
    moveStatus: (id, status) => Api.put(`/tasks/${id}/status`, { status }),
    delete: (id) => Api.del(`/tasks/${id}`),
    getNotes: (id) => Api.get(`/tasks/${id}/notes`),
    addNote: (id, content) => Api.post(`/tasks/${id}/notes`, { content }),
  },

  // Events
  events: {
    list: () => Api.get('/events'),
    create: (body) => Api.post('/events', body),
    update: (id, body) => Api.put(`/events/${id}`, body),
    delete: (id) => Api.del(`/events/${id}`),
  },

  // Chat
  chat: {
    get: (projectId, limit = 50) => Api.get(`/chat/${projectId}?limit=${limit}`),
    send: (projectId, content) => Api.post(`/chat/${projectId}`, { content }),
  },

  // Notifications
  notifications: {
    list: () => Api.get('/notifications'),
    unreadCount: () => Api.get('/notifications/unread-count'),
    markRead: (id) => Api.put(`/notifications/${id}/read`),
    markAllRead: () => Api.put('/notifications/read-all'),
    delete: (id) => Api.del(`/notifications/${id}`),
  },

  // Files
  files: {
    list: (taskId) => Api.get(`/files?taskId=${taskId}`),
    listByProject: (projectId) => Api.get(`/files/project/${projectId}`),
    upload: (taskId, formData) => Api.upload(`/files/upload?taskId=${taskId}`, formData),
    downloadUrl: (id) => `${API_BASE}/files/download/${id}`,
    delete: (id) => Api.del(`/files/${id}`),
  },

  // Activity
  activity: {
    get: (projectId, filters = {}) => {
      const params = new URLSearchParams(filters);
      return Api.get(`/activity/${projectId}?${params}`);
    },
  },

  // Analytics
  analytics: {
    get: (projectId) => Api.get(`/analytics/${projectId}`),
  },

  // Drawing
  drawing: {
    get: (projectId) => Api.get(`/drawing/${projectId}`),
    save: (projectId, data_json) => Api.put(`/drawing/${projectId}`, { data_json }),
  },

  // AI
  ai: {
    query: (query, projectId = null) => Api.post('/ai/query', { query, projectId }),
  },
};

// WebSocket manager
const WS = {
  ws: null,
  listeners: {},
  reconnectTimer: null,
  currentProject: null,

  connect() {
    const token = Api.getToken();
    if (!token) return;
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${proto}//${location.host}`);

    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({ type: 'auth', token }));
      if (this.currentProject) this.joinProject(this.currentProject);
    };

    this.ws.onmessage = (e) => {
      let data;
      try { data = JSON.parse(e.data); } catch { return; }
      const handlers = this.listeners[data.type] || [];
      handlers.forEach(h => h(data));
      const allHandlers = this.listeners['*'] || [];
      allHandlers.forEach(h => h(data));
    };

    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };
    this.ws.onerror = () => {};
  },

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.close();
  },

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  },

  on(type, handler) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
    return () => { this.listeners[type] = this.listeners[type].filter(h => h !== handler); };
  },

  joinProject(projectId) {
    this.currentProject = projectId;
    this.send({ type: 'join_project', projectId });
  },

  leaveProject() {
    if (this.currentProject) {
      this.send({ type: 'leave_project' });
      this.currentProject = null;
    }
  },

  sendTyping(projectId, userName) {
    this.send({ type: 'typing', projectId, userName });
  },

  stopTyping(projectId) {
    this.send({ type: 'stop_typing', projectId });
  },
};

// Auth guard - redirect to auth if not logged in
function requireAuth() {
  if (!Api.isLoggedIn()) {
    window.location.href = '/auth.html';
    return false;
  }
  return true;
}

// Format date/time helpers
function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function timeAgo(str) {
  const diff = Date.now() - new Date(str).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  return `${day}d ago`;
}

function deadlineStatus(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const d = new Date(deadline);
  const diff = d - now;
  if (diff < 0) return 'overdue';
  if (diff < 86400000) return 'today';
  if (diff < 86400000 * 3) return 'soon';
  return 'ok';
}

function priorityColor(priority) {
  return { low: '#6b7280', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }[priority] || '#6b7280';
}

function priorityLabel(priority) {
  return { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }[priority] || priority;
}

function avatarInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function avatarEl(user, size = 32) {
  if (user?.avatar) {
    return `<img src="${user.avatar}" class="rounded-full object-cover" style="width:${size}px;height:${size}px;" alt="${user.name}">`;
  }
  const colors = ['#ff4500', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
  const color = colors[(user?.name || '?').charCodeAt(0) % colors.length];
  return `<div class="rounded-full flex items-center justify-center text-white font-bold" style="width:${size}px;height:${size}px;background:${color};font-size:${Math.max(10, size/3)}px;">${avatarInitials(user?.name)}</div>`;
}

// Toast notifications
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  const colors = { success: '#10b981', error: '#ef4444', info: '#ff4500', warning: '#f59e0b' };
  const icons = { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' };
  const toast = document.createElement('div');
  toast.style.cssText = `
    background:#181818;border:1px solid ${colors[type]}33;color:#f0f0f0;
    padding:12px 16px;border-radius:12px;font-size:13px;font-family:'Martian Mono',monospace;
    display:flex;align-items:center;gap:8px;max-width:320px;
    box-shadow:0 8px 32px rgba(0,0,0,0.4);
    animation:slideInRight 0.3s ease;
  `;
  toast.innerHTML = `<span class="material-symbols-outlined" style="color:${colors[type]};font-size:18px;">${icons[type]}</span>${message}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'slideOutRight 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// Add toast animations to page
if (!document.getElementById('toast-styles')) {
  const s = document.createElement('style');
  s.id = 'toast-styles';
  s.textContent = `
    @keyframes slideInRight { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
    @keyframes slideOutRight { from { transform:translateX(0); opacity:1; } to { transform:translateX(100%); opacity:0; } }
  `;
  document.head.appendChild(s);
}
