// ============================================================
// app.js — Shared state, navigation, data store, mock data
// ============================================================

const App = {
  // Load user from localStorage, fall back to default
  get currentUser() {
    try {
      const stored = localStorage.getItem('lw_user');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return { id: 'u1', name: 'Alex', role: 'Senior Product Architect', avatar: null };
  },

  logout() {
    localStorage.removeItem('lw_user');
    window.location.href = 'auth.html';
  },

  projects: [
    {
      id: 'p1', name: 'Global Brand Evolution', category: 'Marketing', status: 'on-track',
      completion: 74, totalTasks: 56, completedTasks: 42, deadline: '2024-12-24',
      description: 'A focused initiative to transition our core workspace into a high-fidelity glassmorphic environment.',
      teamAccess: true, teamName: 'Brand Squad', teamCode: 'TEAM-GBE001',
      adminId: 'u1',
      members: [
        { id: 'u1', name: 'Alex Rivera',   username: 'alexr',   role: 'admin',   avatar: null, hoursLogged: 42, tasksCompleted: 18 },
        { id: 'u2', name: 'Jordan Smith',  username: 'jordans', role: 'manager', avatar: null, hoursLogged: 31, tasksCompleted: 12 },
        { id: 'u3', name: 'Sam Chen',      username: 'samchen', role: 'member',  avatar: null, hoursLogged: 24, tasksCompleted: 8  },
        { id: 'u4', name: 'Priya Nair',    username: 'priyan',  role: 'member',  avatar: null, hoursLogged: 19, tasksCompleted: 4  },
      ],
      files: [
        { id: 'f1', name: 'style_guide.pdf',    size: '2.4 MB', type: 'pdf',  folder: null,       uploadedBy: 'Alex Rivera',  time: '2 days ago' },
        { id: 'f2', name: 'wireframes_v3.fig',  size: '8.1 MB', type: 'fig',  folder: null,       uploadedBy: 'Jordan Smith', time: '5 days ago' },
        { id: 'f3', name: 'brand_assets.zip',   size: '14 MB',  type: 'zip',  folder: 'Assets',   uploadedBy: 'Sam Chen',    time: '1 week ago' },
        { id: 'f4', name: 'logo_final.svg',     size: '0.3 MB', type: 'svg',  folder: 'Assets',   uploadedBy: 'Priya Nair',  time: '1 week ago' },
        { id: 'f5', name: 'meeting_notes.docx', size: '0.1 MB', type: 'docx', folder: 'Docs',     uploadedBy: 'Alex Rivera',  time: '3 days ago' },
      ],
      folders: ['Assets', 'Docs'],
      activityLog: [
        { userId: 'u1', user: 'Alex Rivera',  icon: 'task_alt',    action: 'created task',    target: 'Audit component library',          time: '2 min ago',  color: 'text-[#ff4500]' },
        { userId: 'u2', user: 'Jordan Smith', icon: 'swap_horiz',  action: 'moved task to',   target: 'In Progress',                      time: '15 min ago', color: 'text-gray-400' },
        { userId: 'u3', user: 'Sam Chen',     icon: 'upload_file', action: 'uploaded',        target: 'brand_assets.zip',                 time: '1 hr ago',   color: 'text-green-400' },
        { userId: 'u1', user: 'Alex Rivera',  icon: 'check_circle',action: 'completed task',  target: 'Core Color Palette Lockdown',      time: '2 hr ago',   color: 'text-green-400' },
        { userId: 'u4', user: 'Priya Nair',   icon: 'person_add',  action: 'joined project',  target: 'Global Brand Evolution',           time: '5 hr ago',   color: 'text-gray-400' },
        { userId: 'u2', user: 'Jordan Smith', icon: 'edit',        action: 'edited task',     target: 'Define Glassmorphism elevation',    time: '1 day ago',  color: 'text-yellow-400' },
      ],
      messages: {
        group: [
          { id: 'm1', senderId: 'u2', sender: 'Jordan Smith', text: "Hey team! I've been experimenting with the new glassmorphism tokens.", time: '12:45 PM' },
          { id: 'm2', senderId: 'u1', sender: 'Alex Rivera',  text: "I love it. Can we push the opacity a bit lower on the sidebars?",     time: '12:48 PM' },
          { id: 'm3', senderId: 'u3', sender: 'Sam Chen',     text: "Agreed. I'll update the tailwind config. @everyone check the new branch by EOD.", time: '12:52 PM' },
        ],
        dm: {
          u2: [ { id: 'd1', senderId: 'u2', sender: 'Jordan Smith', text: 'Hey, can you review my PR when you get a chance?', time: '10:30 AM' } ],
          u3: [],
          u4: [],
        }
      }
    },
    { id: 'p2', name: 'Ethereal v2 UI Framework', category: 'Internal', status: 'at-risk', completion: 32, totalTasks: 25, completedTasks: 8, deadline: '2024-11-30', description: 'Rebuilding the UI framework from scratch with new design tokens.', teamAccess: true, teamName: 'UI Core', teamCode: 'TEAM-ETH002', adminId: 'u1', members: [ { id: 'u1', name: 'Alex Rivera', username: 'alexr', role: 'admin', avatar: null, hoursLogged: 20, tasksCompleted: 5 }, { id: 'u2', name: 'Jordan Smith', username: 'jordans', role: 'member', avatar: null, hoursLogged: 15, tasksCompleted: 3 } ], files: [], folders: [], activityLog: [], messages: { group: [], dm: {} } },
    { id: 'p3', name: 'Team Expansion', category: 'HR', status: 'active', completion: 90, totalTasks: 10, completedTasks: 9, deadline: '2024-10-31', description: 'Hiring and onboarding new team members.', teamAccess: false, teamName: null, teamCode: null, adminId: 'u2', members: [ { id: 'u2', name: 'Jordan Smith', username: 'jordans', role: 'admin', avatar: null, hoursLogged: 10, tasksCompleted: 9 }, { id: 'u3', name: 'Sam Chen', username: 'samchen', role: 'member', avatar: null, hoursLogged: 8, tasksCompleted: 0 } ], files: [], folders: [], activityLog: [], messages: { group: [], dm: {} } },
    { id: 'p4', name: 'Mobile App Refresh', category: 'Product', status: 'active', completion: 58, totalTasks: 20, completedTasks: 12, deadline: '2024-12-01', description: 'Refreshing the mobile app UI and UX.', teamAccess: true, teamName: 'Mobile Crew', teamCode: 'TEAM-MOB004', adminId: 'u1', members: [ { id: 'u1', name: 'Alex Rivera', username: 'alexr', role: 'admin', avatar: null, hoursLogged: 30, tasksCompleted: 10 }, { id: 'u4', name: 'Priya Nair', username: 'priyan', role: 'manager', avatar: null, hoursLogged: 22, tasksCompleted: 2 } ], files: [], folders: [], activityLog: [], messages: { group: [], dm: {} } },
    { id: 'p5', name: 'Cloud Infrastructure', category: 'DevOps', status: 'planning', completion: 12, totalTasks: 30, completedTasks: 4, deadline: '2025-02-01', description: 'Setting up cloud infrastructure for scalable deployment.', teamAccess: false, teamName: null, teamCode: null, adminId: 'u1', members: [ { id: 'u1', name: 'Alex Rivera', username: 'alexr', role: 'admin', avatar: null, hoursLogged: 8, tasksCompleted: 4 } ], files: [], folders: [], activityLog: [], messages: { group: [], dm: {} } },
  ],

  tasks: {
    p1: {
      todo: [
        { id: 't1', title: 'Audit existing component library', tag: 'Research', description: 'Review current Atomic Design system for accessibility gaps and color contrast violations.', assignees: ['u2'], assignedTo: 'Jordan Smith', comments: 2, files: 1, deadline: null, priority: 'medium', status: 'todo' },
        { id: 't2', title: 'Define Glassmorphism elevation layers', tag: 'Priority', description: 'Create a standardized stacking logic for nested glass panels (Level 0 to Level 4).', assignees: ['u1','u3'], assignedTo: 'Alex Rivera, Sam Chen', comments: 0, files: 0, deadline: 'Tomorrow', priority: 'high', status: 'todo' },
      ],
      inprogress: [
        { id: 't3', title: 'Epilogue Typography Scale Integration', tag: 'Design', description: 'Updating all Tailwind configurations to use the new editorial spacing and weight ratios.', assignees: ['u1'], assignedTo: 'Alex Rivera', progress: 66, deadline: '2024-10-24', priority: 'high', status: 'inprogress' },
      ],
      completed: [
        { id: 't4', title: 'Market analysis for Liquid Workspace', tag: 'Planning', description: 'Benchmarking against competitors in the high-end productivity space.', assignees: ['u2'], assignedTo: 'Jordan Smith', deadline: null, priority: 'low', status: 'done' },
        { id: 't5', title: 'Core Color Palette Lockdown', tag: 'Branding', description: 'Finalize the primary, secondary, and tertiary color tokens for the design system.', assignees: ['u3'], assignedTo: 'Sam Chen', deadline: null, priority: 'medium', status: 'done' },
      ]
    }
  },

  notifications: [
    { id: 'n1', icon: 'person_add', iconBg: 'bg-gray-500/10 text-gray-400', title: 'Task assigned to you', body: 'You were assigned <strong>Design System Review</strong> by Leo Vance.', time: '15m ago', unread: true, link: 'projectoverview.html', tag: 'Core Platform', type: 'task' },
    { id: 'n2', icon: 'schedule', iconBg: 'bg-error-container/40 text-red-400', title: 'Deadline approaching', body: 'Project <strong>Brand Identity V2</strong> is due in less than 24 hours.', time: '3h ago', unread: true, link: 'projects.html', tag: 'Marketing', type: 'project', urgent: true },
    { id: 'n3', icon: 'chat_bubble', iconBg: 'bg-primary/10 text-primary', title: 'New chat message', body: 'New update in <strong>Mobile App Sprint</strong> regarding asset delivery.', time: '1h ago', unread: false, link: 'chat.html', tag: 'Project Chat', type: 'chat' },
    { id: 'n4', icon: 'check_circle', iconBg: 'bg-green-500/10 text-green-400', title: 'Task completed', body: '<strong>Core Color Palette Lockdown</strong> was marked as done by Sam.', time: '2h ago', unread: false, link: 'projectoverview.html', tag: 'Branding', type: 'task' },
    { id: 'n5', icon: 'group_add', iconBg: 'bg-gray-500/10 text-gray-400', title: 'New team member', body: 'Jordan Smith joined <strong>Global Brand Evolution</strong>.', time: '5h ago', unread: false, link: 'projects.html', tag: 'Marketing', type: 'project' },
  ],

  messages: {
    'design-team': [
      { id: 'm1', sender: 'Jordan Smith', text: "Hey team! I've been experimenting with the new glassmorphism tokens.", time: '12:45 PM', self: false },
      { id: 'm2', sender: 'Me', text: "I love it. Can we push the opacity a bit lower on the sidebars?", time: '12:48 PM', self: true },
      { id: 'm3', sender: 'Alex Rivera', text: "Agreed. I'll update the tailwind config. @everyone please check the new branch by EOD.", time: '12:52 PM', self: false },
    ]
  },

  events: [
    { id: 'e1', title: 'Creative Sync', day: 1, startHour: 10, endHour: 11.5, color: 'primary-container', location: 'Design Team' },
    { id: 'e2', title: 'Project Delta', day: 3, startHour: 11, endHour: 12, color: 'gray', location: 'Room 402' },
    { id: 'e3', title: 'Client Review', day: 2, startHour: 14, endHour: 15, color: 'primary', location: 'Video Call' },
  ],

  activityLog: [
    { user: 'Jordan', action: 'moved task', target: 'Audit component library', to: 'In Progress', time: '2 min ago' },
    { user: 'Alex', action: 'commented on', target: 'Typography Scale Integration', to: null, time: '15 min ago' },
    { user: 'Sam', action: 'uploaded file to', target: 'Global Brand Evolution', to: null, time: '1 hr ago' },
  ],

  pages: { chat:'chat.html', projects:'projects.html', calendar:'calendar.html', draw:'draw.html', dashboard:'dashboard.html', projectoverview:'projectoverview.html' },

  navigate(page) { if (this.pages[page]) window.location.href = this.pages[page]; },

  addActivity(user, action, target, to = null) {
    this.activityLog.unshift({ user, action, target, to, time: 'just now' });
  },

  addNotification(msg, link = null, type = 'info') {
    this.notifications.unshift({ id: 'n' + Date.now(), icon: 'notifications', iconBg: 'bg-primary/10 text-primary', title: 'New notification', body: msg, time: 'just now', unread: true, link: link || '#', tag: '', type });
    this._renderNotificationBadge();
  },

  get unreadCount() { return this.notifications.filter(n => n.unread).length; },

  _renderNotificationBadge() {
    document.querySelectorAll('.notif-btn').forEach(btn => {
      let badge = btn.querySelector('.notif-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notif-badge absolute -top-1 -right-1 w-4 h-4 bg-primary-container rounded-2xl text-[9px] flex items-center justify-center text-white font-bold pointer-events-none';
        btn.style.position = 'relative';
        btn.appendChild(badge);
      }
      const count = this.unreadCount;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  init() {
    // Auth guard — redirect to login if not authenticated
    // (skip guard on index/auth pages)
    const page = window.location.pathname.split('/').pop();
    if (!['index.html', 'auth.html', ''].includes(page) && !localStorage.getItem('lw_user')) {
      window.location.href = 'auth.html';
      return;
    }
    this._bindNav();
    this._bindNotifButtons();
    this._renderNotificationBadge();
    this._bindFAB();
  },

  _bindNav() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); this.navigate(el.dataset.nav); });
    });
  },

  _bindNotifButtons() {
    document.querySelectorAll('.notif-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); this._toggleNotifPanel(); });
    });
  },

  _bindFAB() {
    document.getElementById('fab-add')?.addEventListener('click', () => Modals.showAddMenu());
    document.getElementById('ai-fab')?.addEventListener('click', () => this._openAIPanel());
  },

  _toggleNotifPanel() {
    const existing = document.getElementById('notif-panel');
    if (existing) { existing.remove(); return; }
    this._showNotifPanel();
  },

  _showNotifPanel() {
    const panel = document.createElement('div');
    panel.id = 'notif-panel';
    panel.className = 'fixed top-16 right-4 z-[300] w-96 max-h-[80vh] bg-surface-container-high/95 backdrop-blur-2xl rounded-2xl border border-outline-variant/20 shadow-2xl flex flex-col overflow-hidden';

    const filterBtns = ['All','Unread','Tasks','Projects'].map((f,i) =>
      `<button data-filter="${f.toLowerCase()}" class="notif-filter px-3 py-1 rounded-2xl text-xs font-bold transition-all ${i===0?'bg-primary-container text-white':'text-on-surface-variant hover:bg-surface-container-highest'}">${f}</button>`
    ).join('');

    panel.innerHTML = `
      <div class="px-5 pt-5 pb-3 border-b border-outline-variant/10 flex justify-between items-center">
        <div>
          <h3 class="font-bold text-base">Notifications</h3>
          <p class="text-xs text-on-surface-variant mt-0.5">${this.unreadCount} unread</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="mark-all-read" class="text-xs text-primary hover:underline font-semibold">Mark all read</button>
          <button id="notif-close" class="material-symbols-outlined text-on-surface-variant text-sm hover:text-on-surface p-1">close</button>
        </div>
      </div>
      <div class="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-outline-variant/10">${filterBtns}</div>
      <div id="notif-list" class="overflow-y-auto flex-1 divide-y divide-outline-variant/10"></div>
    `;
    document.body.appendChild(panel);

    this._renderNotifList('all');

    panel.querySelectorAll('.notif-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.notif-filter').forEach(b => { b.className = b.className.replace('bg-primary-container text-white','text-on-surface-variant hover:bg-surface-container-highest'); });
        btn.className = btn.className.replace('text-on-surface-variant hover:bg-surface-container-highest','bg-primary-container text-white');
        this._renderNotifList(btn.dataset.filter);
      });
    });

    document.getElementById('notif-close').onclick = () => panel.remove();
    document.getElementById('mark-all-read').onclick = () => {
      this.notifications.forEach(n => n.unread = false);
      this._renderNotificationBadge();
      this._renderNotifList('all');
      panel.querySelector('p').textContent = '0 unread';
    };

    setTimeout(() => document.addEventListener('click', function h(e) {
      if (!panel.contains(e.target) && !e.target.closest('.notif-btn')) { panel.remove(); document.removeEventListener('click', h); }
    }), 100);
  },

  _renderNotifList(filter) {
    const list = document.getElementById('notif-list');
    if (!list) return;
    let items = this.notifications;
    if (filter === 'unread') items = items.filter(n => n.unread);
    else if (filter === 'tasks') items = items.filter(n => n.type === 'task');
    else if (filter === 'projects') items = items.filter(n => n.type === 'project');

    if (!items.length) {
      list.innerHTML = `<div class="p-8 text-center text-on-surface-variant text-sm">No notifications</div>`;
      return;
    }

    list.innerHTML = items.map(n => `
      <div data-notif-id="${n.id}" class="notif-item flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-surface-container-highest/60 transition-all ${n.unread ? 'bg-primary-container/5' : ''}">
        <div class="relative shrink-0">
          <div class="w-12 h-12 rounded-2xl ${n.iconBg} flex items-center justify-center">
            <span class="material-symbols-outlined text-xl" style="font-variation-settings:'FILL' 1">${n.icon}</span>
          </div>
          ${n.unread ? '<div class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary-container rounded-2xl border-2 border-surface-container-high"></div>' : ''}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start gap-2 mb-0.5">
            <h4 class="font-bold text-sm ${n.urgent ? 'text-red-400' : 'text-on-surface'} flex items-center gap-1.5">
              ${n.title}
              ${n.urgent ? '<span class="px-1.5 py-0.5 text-[9px] bg-red-600/20 text-red-500 rounded-2xl border border-red-600/30 font-black uppercase">Urgent</span>' : ''}
            </h4>
            <span class="text-[10px] text-on-surface-variant shrink-0 uppercase tracking-wider">${n.time}</span>
          </div>
          <p class="text-xs text-on-surface-variant leading-relaxed">${n.body}</p>
          ${n.tag ? `<span class="mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-bold tracking-tighter uppercase">${n.tag}</span>` : ''}
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.notifId;
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
          notif.unread = false;
          this._renderNotificationBadge();
          document.getElementById('notif-panel')?.remove();
          if (notif.link && notif.link !== '#') window.location.href = notif.link;
        }
      });
    });
  },

  _openAIPanel() {
    if (document.getElementById('ai-panel')) { document.getElementById('ai-panel').remove(); return; }
    const panel = document.createElement('div');
    panel.id = 'ai-panel';
    panel.className = 'fixed bottom-28 right-4 z-[100] w-72 bg-surface-container-high/95 backdrop-blur-xl rounded-2xl border border-outline-variant/20 shadow-2xl flex flex-col overflow-hidden';
    panel.innerHTML = `
      <div class="p-3.5 border-b border-outline-variant/10 flex justify-between items-center">
        <span class="font-bold text-sm flex items-center gap-2"><span class="material-symbols-outlined text-[#ff4500] text-base" style="font-variation-settings:'FILL' 1">smart_toy</span>AI Assistant</span>
        <button id="ai-close" class="material-symbols-outlined text-on-surface-variant text-sm">close</button>
      </div>
      <div id="ai-messages" class="p-3.5 flex flex-col gap-2.5 max-h-56 overflow-y-auto text-xs">
        <div class="bg-surface-container-low rounded-2xl p-3">Hi! Ask me about your projects, tasks, or deadlines.</div>
      </div>
      <div class="p-3 border-t border-outline-variant/10 flex gap-2">
        <input id="ai-input" class="flex-1 bg-surface-container-low border-none rounded-2xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary/30" placeholder="Ask anything..." />
        <button id="ai-send" class="bg-primary-container text-white px-3 py-2 rounded-2xl text-xs font-bold">Send</button>
      </div>`;
    document.body.appendChild(panel);
    document.getElementById('ai-close').onclick = () => panel.remove();
    const send = () => {
      const input = document.getElementById('ai-input');
      const msgs = document.getElementById('ai-messages');
      if (!input?.value.trim()) return;
      const q = input.value.trim();
      msgs.innerHTML += `<div class="self-end bg-primary-container/20 rounded-2xl p-2.5 text-xs max-w-[80%] ml-auto">${q}</div>`;
      const projects = App?.projects || [];
      let reply = "I can help with tasks, deadlines, and project status.";
      const lower = q.toLowerCase();
      if (lower.includes('task') || lower.includes('pending')) {
        const total = projects.reduce((a,p) => a + (p.totalTasks - p.completedTasks), 0);
        reply = `You have ${total} pending tasks across ${projects.length} projects.`;
      } else if (lower.includes('deadline') || lower.includes('due')) {
        const urgent = projects.filter(p => p.status === 'at-risk' || p.status === 'urgent');
        reply = urgent.length ? `${urgent.map(p=>p.name).join(', ')} ${urgent.length>1?'are':'is'} at risk.` : 'No urgent deadlines right now.';
      } else if (lower.includes('project')) {
        const top = [...projects].sort((a,b) => b.completion - a.completion)[0];
        reply = `You have ${projects.length} projects. Most complete: "${top?.name}" at ${top?.completion}%.`;
      }
      msgs.innerHTML += `<div class="bg-surface-container-low rounded-2xl p-2.5 text-xs">${reply}</div>`;
      msgs.scrollTop = msgs.scrollHeight;
      input.value = '';
    };
    document.getElementById('ai-send').onclick = send;
    document.getElementById('ai-input').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
