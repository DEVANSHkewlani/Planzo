// ============================================================
// projectoverview.js — Full project overview: tabs, kanban,
// chat, files, analytics, feed, settings
// ============================================================

const ProjectOverview = {
  projectId: 'p1',
  currentRole: 'member',
  activeTab: 'tasks',
  activeChatConv: 'group',
  activeFolder: null,
  dragSrc: null,

  init() {
    const params = new URLSearchParams(window.location.search);
    this.projectId = params.get('pid') || 'p1';
    this.currentRole = this._getCurrentRole();
    this._renderHero();
    this._bindTabs();
    if (this.currentRole === 'admin') {
      document.getElementById('settings-tab-btn')?.classList.remove('hidden');
    }
    this._renderTasks();
  },

  _getProject() {
    return (App.projects || []).find(p => p.id === this.projectId) || App.projects[0];
  },

  _getCurrentRole() {
    const user = App.currentUser;
    const proj = this._getProject();
    if (!proj) return 'member';
    const member = proj.members.find(m =>
      m.username === user.username || m.name === user.name || m.id === user.id
    );
    return member ? member.role : 'member';
  },

  // ── Hero ──────────────────────────────────────────────────
  _renderHero() {
    const proj = this._getProject();
    if (!proj) return;
    const hero = document.getElementById('proj-hero');
    const title = document.getElementById('proj-header-title');
    if (title) title.textContent = proj.name;
    if (!hero) return;

    const statusColor = {
      'on-track': 'text-green-400 bg-green-500/10',
      'at-risk':  'text-yellow-400 bg-yellow-500/10',
      'urgent':   'text-red-400 bg-red-500/10',
      'active':   'text-green-400 bg-green-500/10',
      'planning': 'text-blue-400 bg-blue-500/10'
    };
    const sc = statusColor[proj.status] || 'text-on-surface-variant bg-surface-container-high';

    const memberAvatars = proj.members.map(m => {
      const roleBadge = m.role === 'admin' ? 'role-badge-admin' : m.role === 'manager' ? 'role-badge-manager' : 'role-badge-member';
      return `<div class="relative group/av cursor-default">
        <div class="w-10 h-10 rounded-2xl bg-surface-container-highest border-2 border-surface flex items-center justify-center text-xs font-bold">${m.name[0].toUpperCase()}</div>
        <span class="absolute -bottom-1 -right-1 text-[8px] font-bold px-1 py-0.5 rounded-2xl ${roleBadge}">${m.role[0].toUpperCase()}</span>
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest rounded-2xl text-[10px] whitespace-nowrap opacity-0 group-hover/av:opacity-100 transition-opacity pointer-events-none z-10">${m.name}</div>
      </div>`;
    }).join('');

    const teamMeta = proj.teamAccess && proj.teamName
      ? `<div class="flex items-center gap-3 flex-wrap">
          <span class="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span class="material-symbols-outlined text-sm text-gray-400">group</span>${proj.teamName}
          </span>
          <span class="flex items-center gap-1.5 text-xs font-mono text-primary-container bg-primary-container/10 px-2.5 py-1 rounded-2xl border border-primary-container/20">
            <span class="material-symbols-outlined text-sm">key</span>${proj.teamCode}
          </span>
        </div>`
      : '';

    const addMemberBtn = this.currentRole === 'admin'
      ? `<button id="hero-add-member" class="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container/15 text-primary-container border border-primary-container/30 rounded-2xl text-xs font-bold hover:bg-primary-container/25 transition-all">
          <span class="material-symbols-outlined text-sm">person_add</span>Add Member
        </button>`
      : '';

    hero.innerHTML = `
      <div class="glass rounded-2xl border border-outline-variant/10 p-6">
        <div class="flex flex-wrap justify-between items-start gap-4 mb-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span class="px-2.5 py-1 rounded-2xl text-[10px] font-bold tracking-widest uppercase bg-surface-container-highest text-on-surface-variant">${proj.category}</span>
              <span class="px-2.5 py-1 rounded-2xl text-[10px] font-bold tracking-widest uppercase ${sc}">${proj.status.replace('-',' ')}</span>
            </div>
            <h1 class="text-3xl font-extrabold tracking-tight text-on-surface mb-1">${proj.name}</h1>
            <p class="text-on-surface-variant text-sm font-light leading-relaxed max-w-xl">${proj.description || ''}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Completion</p>
            <p class="text-4xl font-extrabold text-primary-container">${proj.completion}%</p>
            <div class="w-24 h-1.5 bg-surface-container-highest rounded-2xl overflow-hidden mt-2 ml-auto">
              <div class="h-full bg-primary-container rounded-2xl" style="width:${proj.completion}%"></div>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-4 pt-4 border-t border-outline-variant/10">
          <div class="flex items-center gap-2 flex-wrap">
            ${memberAvatars}
            ${addMemberBtn}
          </div>
          <div class="flex flex-col gap-1.5 ml-auto">
            ${teamMeta}
            ${proj.deadline ? `<span class="flex items-center gap-1 text-xs text-on-surface-variant"><span class="material-symbols-outlined text-sm">calendar_today</span>Due ${new Date(proj.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>` : ''}
          </div>
        </div>
      </div>`;

    document.getElementById('hero-add-member')?.addEventListener('click', () => this._showAddMemberModal());
  },

  // ── Tabs ──────────────────────────────────────────────────
  _bindTabs() {
    document.querySelectorAll('#proj-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#proj-tabs .tab-btn').forEach(b => {
          b.classList.remove('active');
          b.classList.add('text-on-surface-variant');
        });
        btn.classList.add('active');
        btn.classList.remove('text-on-surface-variant');
        const tab = btn.dataset.tab;
        this.activeTab = tab;
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById('tab-' + tab)?.classList.remove('hidden');
        const renderers = {
          tasks:     () => this._renderTasks(),
          chat:      () => this._renderChat(),
          files:     () => this._renderFiles(),
          analytics: () => this._renderAnalytics(),
          feed:      () => this._renderFeed(),
          settings:  () => this._renderSettings(),
        };
        renderers[tab]?.();
      });
    });
  },

  // ── Tasks (Kanban) ────────────────────────────────────────
  _renderTasks() {
    const proj = this._getProject();
    const container = document.getElementById('tab-tasks');
    if (!container) return;
    const tasks = App.tasks[this.projectId] || { todo: [], inprogress: [], completed: [] };
    const canEdit = true; // all users can add tasks

    const addBtn = canEdit
      ? `<button class="col-add-btn flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary-container transition-colors font-bold">
          <span class="material-symbols-outlined text-base">add</span>Add Task
        </button>`
      : '';

    const colDef = [
      { key: 'todo',      label: 'To Do',       color: 'text-blue-400',   dot: 'bg-blue-400' },
      { key: 'inprogress',label: 'In Progress',  color: 'text-yellow-400', dot: 'bg-yellow-400' },
      { key: 'completed', label: 'Completed',    color: 'text-green-400',  dot: 'bg-green-400' },
    ];

    container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      ${colDef.map(col => {
        const colTasks = tasks[col.key] || [];
        return `<div class="kanban-col flex flex-col gap-3 glass rounded-2xl p-4 border border-outline-variant/10" data-col="${col.key}">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-2xl ${col.dot}"></span>
              <span class="text-sm font-bold ${col.color}">${col.label}</span>
              <span class="text-xs text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-2xl col-count">${colTasks.length}</span>
            </div>
            ${addBtn}
          </div>
          <div class="task-cards flex flex-col gap-3 min-h-[120px]">
            ${colTasks.map(t => this._taskCardHTML(t)).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`;

    // Bind add task buttons
    if (canEdit) {
      container.querySelectorAll('.col-add-btn').forEach((btn, i) => {
        btn.addEventListener('click', () => {
          const statusMap = ['todo', 'inprogress', 'completed'];
          // Pre-select this project and status in the modal
          Modals.showAddTask({ status: statusMap[i], _projectId: this.projectId });
        });
      });
    }

    // Also wire FAB to add task directly
    document.getElementById('fab-add')?.addEventListener('click', () => {
      Modals.showAddTask({ status: 'todo', _projectId: this.projectId });
    });

    // Bind task card clicks
    container.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('click', () => {
        const tid = card.dataset.tid;
        const allTasks = [...(tasks.todo||[]), ...(tasks.inprogress||[]), ...(tasks.completed||[])];
        const task = allTasks.find(t => t.id === tid);
        if (task) Modals.showTaskDetail(task);
      });
    });

    this._bindKanbanDragDrop(container, tasks);
  },

  _taskCardHTML(task) {
    const priorityDot = { high: 'bg-red-400', medium: 'bg-yellow-400', low: 'bg-green-400' };
    const dot = priorityDot[task.priority] || 'bg-yellow-400';
    return `<div class="task-card bg-surface-container/80 backdrop-blur-sm rounded-2xl p-4 border border-outline-variant/10 cursor-pointer hover:border-primary-container/30 hover:bg-surface-container transition-all" draggable="true" data-tid="${task.id}">
      <div class="flex items-start justify-between gap-2 mb-2">
        <span class="text-[10px] font-bold uppercase tracking-widest text-primary-container bg-primary-container/10 px-2 py-0.5 rounded-2xl">${task.tag || 'Task'}</span>
        <span class="w-2 h-2 rounded-2xl ${dot} shrink-0 mt-1" title="${task.priority} priority"></span>
      </div>
      <h3 class="text-sm font-bold text-on-surface mb-1 leading-snug">${task.title}</h3>
      <p class="text-xs text-on-surface-variant line-clamp-2 mb-3">${task.description || ''}</p>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          ${(task.assignees||[]).slice(0,3).map(a => `<div class="w-6 h-6 rounded-2xl bg-surface-container-highest border border-surface flex items-center justify-center text-[9px] font-bold">${a[0].toUpperCase()}</div>`).join('')}
          ${task.assignedTo ? `<span class="text-[10px] text-on-surface-variant ml-1 truncate max-w-[80px]">${task.assignedTo.split(',')[0]}</span>` : ''}
        </div>
        ${task.deadline ? `<span class="flex items-center gap-0.5 text-[10px] text-on-surface-variant"><span class="material-symbols-outlined text-xs">schedule</span>${task.deadline}</span>` : ''}
      </div>
    </div>`;
  },

  _bindKanbanDragDrop(container, tasks) {
    container.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('dragstart', e => {
        this.dragSrc = card;
        card.classList.add('opacity-40');
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('opacity-40');
        container.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('ring-2','ring-primary-container/40'));
      });
    });

    container.querySelectorAll('.kanban-col').forEach(col => {
      col.addEventListener('dragover', e => {
        e.preventDefault();
        col.classList.add('ring-2','ring-primary-container/40');
      });
      col.addEventListener('dragleave', () => col.classList.remove('ring-2','ring-primary-container/40'));
      col.addEventListener('drop', e => {
        e.preventDefault();
        col.classList.remove('ring-2','ring-primary-container/40');
        if (!this.dragSrc) return;
        const newCol = col.dataset.col;
        const tid = this.dragSrc.dataset.tid;
        const colKeys = ['todo','inprogress','completed'];
        let movedTask = null;
        colKeys.forEach(k => {
          const idx = (tasks[k]||[]).findIndex(t => t.id === tid);
          if (idx !== -1) { movedTask = tasks[k].splice(idx, 1)[0]; }
        });
        if (movedTask) {
          movedTask.status = newCol;
          if (!tasks[newCol]) tasks[newCol] = [];
          tasks[newCol].push(movedTask);
          App.addActivity(App.currentUser.name, 'moved task to', col.querySelector('.text-sm.font-bold')?.textContent || newCol);
          this._renderTasks();
        }
      });
    });
  },

  // ── Chat ──────────────────────────────────────────────────
  _renderChat() {
    const proj = this._getProject();
    const container = document.getElementById('tab-chat');
    if (!container || !proj) return;
    const msgs = proj.messages || { group: [], dm: {} };
    const user = App.currentUser;

    const dmList = proj.members
      .filter(m => m.id !== user.id && m.username !== user.username)
      .map(m => `<button class="member-dm flex items-center gap-3 px-3 py-2.5 rounded-2xl w-full text-left hover:bg-surface-container-highest/50 transition-all ${this.activeChatConv === m.id ? 'active bg-primary-container/10' : ''}" data-conv="${m.id}">
        <div class="w-8 h-8 rounded-2xl bg-surface-container-highest flex items-center justify-center text-xs font-bold shrink-0">${m.name[0].toUpperCase()}</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold truncate">${m.name}</p>
          <p class="text-[10px] text-on-surface-variant capitalize">${m.role}</p>
        </div>
      </button>`).join('');

    container.innerHTML = `<div class="flex gap-4 h-[520px]">
      <div class="w-52 shrink-0 flex flex-col gap-1 glass rounded-2xl p-3 border border-outline-variant/10 overflow-y-auto no-scrollbar">
        <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2 mb-1">Channels</p>
        <button class="member-dm flex items-center gap-3 px-3 py-2.5 rounded-2xl w-full text-left hover:bg-surface-container-highest/50 transition-all ${this.activeChatConv === 'group' ? 'active bg-primary-container/10' : ''}" data-conv="group">
          <div class="w-8 h-8 rounded-2xl bg-primary-container/20 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-primary-container text-sm">group</span>
          </div>
          <span class="text-sm font-semibold">Group Chat</span>
        </button>
        <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2 mt-3 mb-1">Direct Messages</p>
        ${dmList}
      </div>
      <div class="flex-1 flex flex-col glass rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div id="chat-header" class="px-5 py-3.5 border-b border-outline-variant/10 flex items-center gap-3">
          <div class="w-8 h-8 rounded-2xl bg-primary-container/20 flex items-center justify-center">
            <span class="material-symbols-outlined text-primary-container text-sm">group</span>
          </div>
          <div>
            <p class="text-sm font-bold">Group Chat</p>
            <p class="text-[10px] text-on-surface-variant">${proj.members.length} members</p>
          </div>
        </div>
        <div id="chat-messages" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 no-scrollbar"></div>
        <div class="p-3 border-t border-outline-variant/10 flex gap-2">
          <input id="chat-input" class="flex-1 bg-surface-container border-none rounded-2xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary-container/40 placeholder:text-zinc-600" placeholder="Type a message..." />
          <button id="chat-send" class="bg-primary-container text-white px-4 py-2.5 rounded-2xl text-sm font-bold hover:opacity-90 transition-opacity">
            <span class="material-symbols-outlined text-base">send</span>
          </button>
        </div>
      </div>
    </div>`;

    this._loadChatConversation(proj, msgs);

    container.querySelectorAll('.member-dm').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeChatConv = btn.dataset.conv;
        container.querySelectorAll('.member-dm').forEach(b => b.classList.remove('active','bg-primary-container/10'));
        btn.classList.add('active','bg-primary-container/10');
        this._loadChatConversation(proj, msgs);
      });
    });

    document.getElementById('chat-send')?.addEventListener('click', () => this._sendChatMessage(proj, msgs));
    document.getElementById('chat-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') this._sendChatMessage(proj, msgs); });
  },

  _loadChatConversation(proj, msgs) {
    const header = document.getElementById('chat-header');
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;
    const user = App.currentUser;
    let convMsgs = [];
    let headerHTML = '';

    if (this.activeChatConv === 'group') {
      convMsgs = msgs.group || [];
      headerHTML = `<div class="w-8 h-8 rounded-2xl bg-primary-container/20 flex items-center justify-center">
        <span class="material-symbols-outlined text-primary-container text-sm">group</span></div>
        <div><p class="text-sm font-bold">Group Chat</p><p class="text-[10px] text-on-surface-variant">${proj.members.length} members</p></div>`;
    } else {
      const member = proj.members.find(m => m.id === this.activeChatConv);
      convMsgs = (msgs.dm || {})[this.activeChatConv] || [];
      headerHTML = `<div class="w-8 h-8 rounded-2xl bg-surface-container-highest flex items-center justify-center text-xs font-bold">${member?.name[0]||'?'}</div>
        <div><p class="text-sm font-bold">${member?.name||'Member'}</p><p class="text-[10px] text-on-surface-variant capitalize">${member?.role||''}</p></div>`;
    }
    if (header) header.innerHTML = headerHTML;

    messagesEl.innerHTML = convMsgs.length
      ? convMsgs.map(m => {
          const isSelf = m.senderId === user.id || m.sender === user.name || m.sender === 'Me';
          return `<div class="flex gap-2.5 ${isSelf ? 'flex-row-reverse' : ''}">
            <div class="w-7 h-7 rounded-2xl bg-surface-container-highest flex items-center justify-center text-[10px] font-bold shrink-0">${m.sender[0].toUpperCase()}</div>
            <div class="max-w-[70%]">
              ${!isSelf ? `<p class="text-[10px] text-on-surface-variant mb-1 ml-1">${m.sender}</p>` : ''}
              <div class="${isSelf ? 'chat-msg-self' : 'chat-msg-other'} rounded-2xl px-4 py-2.5 text-sm">${m.text}</div>
              <p class="text-[9px] text-on-surface-variant mt-1 ${isSelf ? 'text-right mr-1' : 'ml-1'}">${m.time}</p>
            </div>
          </div>`;
        }).join('')
      : `<div class="flex-1 flex items-center justify-center text-on-surface-variant text-sm">No messages yet. Say hi!</div>`;

    messagesEl.scrollTop = messagesEl.scrollHeight;
  },

  _sendChatMessage(proj, msgs) {
    const input = document.getElementById('chat-input');
    if (!input?.value.trim()) return;
    const user = App.currentUser;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const msg = { id: 'm' + Date.now(), senderId: user.id || 'u1', sender: user.name || 'Me', text: input.value.trim(), time: now };
    if (this.activeChatConv === 'group') {
      if (!msgs.group) msgs.group = [];
      msgs.group.push(msg);
    } else {
      if (!msgs.dm) msgs.dm = {};
      if (!msgs.dm[this.activeChatConv]) msgs.dm[this.activeChatConv] = [];
      msgs.dm[this.activeChatConv].push(msg);
    }
    input.value = '';
    this._loadChatConversation(proj, msgs);
  },

  // ── Files ─────────────────────────────────────────────────
  _renderFiles() {
    const proj = this._getProject();
    const container = document.getElementById('tab-files');
    if (!container || !proj) return;
    const folders = ['All', ...(proj.folders || [])];
    if (!this.activeFolder) this.activeFolder = 'All';

    const fileIcons = { pdf: 'picture_as_pdf', fig: 'design_services', zip: 'folder_zip', svg: 'image', docx: 'description', png: 'image', jpg: 'image', default: 'insert_drive_file' };

    const filteredFiles = this.activeFolder === 'All'
      ? (proj.files || [])
      : (proj.files || []).filter(f => f.folder === this.activeFolder);

    container.innerHTML = `<div class="flex gap-4">
      <div class="w-44 shrink-0 flex flex-col gap-1 glass rounded-2xl p-3 border border-outline-variant/10">
        <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2 mb-1">Folders</p>
        ${folders.map(f => `<button class="folder-btn flex items-center gap-2 px-3 py-2 rounded-2xl text-sm text-left hover:bg-surface-container-highest/50 transition-all ${this.activeFolder === f ? 'bg-primary-container/10 text-primary-container font-bold' : 'text-on-surface-variant'}" data-folder="${f}">
          <span class="material-symbols-outlined text-base">${f === 'All' ? 'folder_open' : 'folder'}</span>${f}
        </button>`).join('')}
        <button id="add-folder-btn" class="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs text-on-surface-variant hover:bg-surface-container-highest/50 transition-all mt-2 border border-dashed border-outline-variant/30">
          <span class="material-symbols-outlined text-base">create_new_folder</span>New Folder
        </button>
      </div>
      <div class="flex-1 flex flex-col gap-3">
        <div id="file-drop-zone" class="file-drop-zone rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[100px]">
          <span class="material-symbols-outlined text-3xl text-on-surface-variant">cloud_upload</span>
          <p class="text-sm text-on-surface-variant">Drag & drop files here, or <label for="file-upload" class="text-primary-container font-bold cursor-pointer hover:underline">browse</label></p>
          <input type="file" id="file-upload" class="hidden" multiple />
        </div>
        <div id="files-list" class="flex flex-col gap-2">
          ${filteredFiles.length
            ? filteredFiles.map(f => `<div class="flex items-center gap-4 p-4 glass rounded-2xl border border-outline-variant/10 hover:border-outline-variant/30 transition-all">
                <span class="material-symbols-outlined text-primary-container text-2xl">${fileIcons[f.type] || fileIcons.default}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold truncate">${f.name}</p>
                  <p class="text-xs text-on-surface-variant">${f.size} &bull; ${f.uploadedBy} &bull; ${f.time}</p>
                </div>
                <button class="material-symbols-outlined text-on-surface-variant hover:text-primary-container transition-colors text-xl">download</button>
              </div>`).join('')
            : `<div class="text-center py-10 text-on-surface-variant text-sm">No files in this folder.</div>`}
        </div>
      </div>
    </div>`;

    container.querySelectorAll('.folder-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeFolder = btn.dataset.folder;
        this._renderFiles();
      });
    });

    document.getElementById('add-folder-btn')?.addEventListener('click', () => {
      const name = prompt('Folder name:');
      if (name?.trim()) {
        if (!proj.folders) proj.folders = [];
        proj.folders.push(name.trim());
        this.activeFolder = name.trim();
        this._renderFiles();
      }
    });

    const dropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('file-upload');

    const handleFiles = (fileList) => {
      Array.from(fileList).forEach(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        const newFile = {
          id: 'f' + Date.now() + Math.random(),
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          type: ext,
          folder: this.activeFolder === 'All' ? null : this.activeFolder,
          uploadedBy: App.currentUser.name,
          time: 'just now'
        };
        if (!proj.files) proj.files = [];
        proj.files.push(newFile);
        App.addActivity(App.currentUser.name, 'uploaded', file.name);
      });
      this._renderFiles();
    };

    dropZone?.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone?.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });
    fileInput?.addEventListener('change', e => handleFiles(e.target.files));
  },

  // ── Analytics ─────────────────────────────────────────────
  _renderAnalytics() {
    const proj = this._getProject();
    const container = document.getElementById('tab-analytics');
    if (!container || !proj) return;
    const totalHours = proj.members.reduce((a, m) => a + (m.hoursLogged || 0), 0);
    const avgTime = proj.totalTasks ? (totalHours / proj.totalTasks).toFixed(1) : '0';

    const stats = [
      { label: 'Completion', value: proj.completion + '%', sub: `${proj.completedTasks}/${proj.totalTasks} tasks done`, icon: 'donut_large', color: 'text-primary-container' },
      { label: 'Total Tasks', value: proj.totalTasks, sub: `${proj.totalTasks - proj.completedTasks} remaining`, icon: 'task_alt', color: 'text-gray-400' },
      { label: 'Active Members', value: proj.members.length, sub: 'Contributing', icon: 'group', color: 'text-green-400' },
      { label: 'Avg Task Time', value: avgTime + 'h', sub: 'Per task', icon: 'schedule', color: 'text-yellow-400' },
    ];

    container.innerHTML = `<div class="space-y-6 max-w-4xl">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${stats.map(s => `<div class="bg-surface-container-low/40 rounded-2xl p-5 border border-outline-variant/10">
          <div class="flex items-center gap-2 mb-3">
            <span class="material-symbols-outlined ${s.color} text-xl" style="font-variation-settings:'FILL' 1">${s.icon}</span>
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">${s.label}</p>
          </div>
          <p class="text-3xl font-extrabold ${s.color}">${s.value}</p>
          <p class="text-xs text-on-surface-variant mt-1">${s.sub}</p>
        </div>`).join('')}
      </div>
      <div class="bg-surface-container-low/40 rounded-2xl p-6 border border-outline-variant/10">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-bold">Overall Progress</p>
          <span class="text-primary-container font-extrabold">${proj.completion}%</span>
        </div>
        <div class="h-3 w-full bg-surface-container-highest rounded-2xl overflow-hidden">
          <div class="h-full bg-primary-container rounded-2xl transition-all" style="width:${proj.completion}%"></div>
        </div>
      </div>
      <div class="bg-surface-container-low/40 rounded-2xl p-6 border border-outline-variant/10">
        <p class="text-sm font-bold mb-4">Member Contributions</p>
        <div class="space-y-4">
          ${proj.members.map(m => {
            const pct = proj.totalTasks ? Math.round((m.tasksCompleted / proj.totalTasks) * 100) : 0;
            const roleBadge = m.role === 'admin' ? 'role-badge-admin' : m.role === 'manager' ? 'role-badge-manager' : 'role-badge-member';
            return `<div class="flex items-center gap-4">
              <div class="w-9 h-9 rounded-2xl bg-surface-container-highest flex items-center justify-center text-xs font-bold shrink-0">${m.name[0].toUpperCase()}</div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p class="text-sm font-semibold truncate">${m.name}</p>
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-2xl ${roleBadge}">${m.role}</span>
                </div>
                <div class="h-1.5 w-full bg-surface-container-highest rounded-2xl overflow-hidden">
                  <div class="h-full bg-primary-container rounded-2xl" style="width:${pct}%"></div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-xs font-bold text-on-surface">${m.tasksCompleted} tasks</p>
                <p class="text-[10px] text-on-surface-variant">${m.hoursLogged}h logged</p>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  },

  // ── Feed ──────────────────────────────────────────────────
  _renderFeed() {
    const proj = this._getProject();
    const container = document.getElementById('tab-feed');
    if (!container || !proj) return;
    const log = [...(proj.activityLog || [])];

    container.innerHTML = `<div class="max-w-2xl space-y-1">
      <div class="flex items-center justify-between mb-5">
        <p class="text-sm font-bold">Activity Timeline</p>
        <span class="text-xs text-on-surface-variant">${log.length} events</span>
      </div>
      ${log.length
        ? log.map((entry, i) => `<div class="flex gap-4 relative">
            <div class="flex flex-col items-center">
              <div class="timeline-dot ${entry.color || 'bg-primary-container'} mt-1"></div>
              ${i < log.length - 1 ? '<div class="w-px flex-1 bg-outline-variant/20 my-1"></div>' : ''}
            </div>
            <div class="pb-5 flex-1">
              <div class="flex items-start gap-3 glass rounded-2xl p-4 border border-outline-variant/10">
                <div class="w-8 h-8 rounded-2xl bg-surface-container-highest flex items-center justify-center text-xs font-bold shrink-0">${entry.user[0].toUpperCase()}</div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm"><span class="font-semibold">${entry.user}</span> <span class="text-on-surface-variant">${entry.action}</span> <span class="${entry.color || 'text-primary-container'} font-semibold">${entry.target}</span></p>
                  <p class="text-[10px] text-on-surface-variant mt-1">${entry.time}</p>
                </div>
                <span class="material-symbols-outlined text-on-surface-variant text-base shrink-0" style="font-variation-settings:'FILL' 1">${entry.icon || 'circle'}</span>
              </div>
            </div>
          </div>`).join('')
        : `<div class="text-center py-12 text-on-surface-variant text-sm">No activity yet.</div>`}
    </div>`;
  },

  // ── Settings (admin only) ─────────────────────────────────
  _renderSettings() {
    if (this.currentRole !== 'admin') return;
    const proj = this._getProject();
    const container = document.getElementById('tab-settings');
    if (!container || !proj) return;

    container.innerHTML = `<div class="max-w-2xl space-y-6">
      <div class="bg-surface-container-low/40 rounded-2xl p-6 border border-outline-variant/10 space-y-5">
        <p class="text-sm font-bold">Project Details</p>
        <div class="space-y-2">
          <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Project Name</label>
          <input id="settings-name" class="w-full bg-surface-container border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-container/40" value="${proj.name}" />
        </div>
        <div class="space-y-2">
          <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Description</label>
          <textarea id="settings-desc" class="w-full bg-surface-container border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-container/40 resize-none" rows="3">${proj.description || ''}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Category</label>
            <select id="settings-category" class="w-full bg-surface-container border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-container/40">
              ${['Marketing','Product','Design','Engineering','HR','DevOps','Internal'].map(c =>
                `<option ${proj.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Deadline</label>
            <input id="settings-deadline" type="date" class="w-full bg-surface-container border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-container/40" value="${proj.deadline || ''}" />
          </div>
        </div>
        <button id="settings-save" class="bg-primary-container text-white px-6 py-3 rounded-2xl text-sm font-bold hover:opacity-90 transition-opacity">Save Changes</button>
      </div>

      <div class="bg-surface-container-low/40 rounded-2xl p-6 border border-outline-variant/10 space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-sm font-bold">Members</p>
          <button id="settings-add-member" class="flex items-center gap-1.5 text-xs font-bold text-primary-container hover:underline">
            <span class="material-symbols-outlined text-sm">person_add</span>Add Member
          </button>
        </div>
        <div id="settings-members-list" class="space-y-3">
          ${proj.members.map(m => {
            const isCurrentAdmin = m.role === 'admin';
            return `<div class="flex items-center gap-3 p-3 bg-surface-container/50 rounded-2xl border border-outline-variant/10">
              <div class="w-9 h-9 rounded-2xl bg-surface-container-highest flex items-center justify-center text-xs font-bold shrink-0">${m.name[0].toUpperCase()}</div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold">${m.name}</p>
                <p class="text-xs text-on-surface-variant">@${m.username}</p>
              </div>
              <select class="member-role-select bg-surface-container border-none rounded-2xl px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary-container/40 ${isCurrentAdmin ? 'opacity-50 cursor-not-allowed' : ''}" data-uid="${m.id}" ${isCurrentAdmin ? 'disabled' : ''}>
                <option value="admin" ${m.role==='admin'?'selected':''}>Admin</option>
                <option value="manager" ${m.role==='manager'?'selected':''}>Manager</option>
                <option value="member" ${m.role==='member'?'selected':''}>Member</option>
              </select>
              ${!isCurrentAdmin ? `<button class="remove-member-btn material-symbols-outlined text-on-surface-variant hover:text-red-400 transition-colors text-xl" data-uid="${m.id}">person_remove</button>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="bg-red-500/5 rounded-2xl p-6 border border-red-500/20 space-y-3">
        <p class="text-sm font-bold text-red-400">Danger Zone</p>
        <p class="text-xs text-on-surface-variant">Deleting this project is permanent and cannot be undone.</p>
        <button id="settings-delete-project" class="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-2xl text-sm font-bold hover:bg-red-500/20 transition-all">
          <span class="material-symbols-outlined text-base">delete_forever</span>Delete Project
        </button>
      </div>
    </div>`;

    document.getElementById('settings-save')?.addEventListener('click', () => {
      proj.name = document.getElementById('settings-name').value.trim() || proj.name;
      proj.description = document.getElementById('settings-desc').value;
      proj.category = document.getElementById('settings-category').value;
      proj.deadline = document.getElementById('settings-deadline').value || null;
      const titleEl = document.getElementById('proj-header-title');
      if (titleEl) titleEl.textContent = proj.name;
      this._renderHero();
      App.addNotification(`Project "<strong>${proj.name}</strong>" settings updated.`, null, 'project');
    });

    container.querySelectorAll('.member-role-select').forEach(sel => {
      sel.addEventListener('change', () => {
        const uid = sel.dataset.uid;
        const member = proj.members.find(m => m.id === uid);
        if (member) {
          member.role = sel.value;
          App.addActivity(App.currentUser.name, 'changed role of', member.name);
        }
      });
    });

    container.querySelectorAll('.remove-member-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.uid;
        const idx = proj.members.findIndex(m => m.id === uid);
        if (idx !== -1) {
          const name = proj.members[idx].name;
          proj.members.splice(idx, 1);
          App.addActivity(App.currentUser.name, 'removed member', name);
          this._renderSettings();
          this._renderHero();
        }
      });
    });

    document.getElementById('settings-add-member')?.addEventListener('click', () => this._showAddMemberModal());

    document.getElementById('settings-delete-project')?.addEventListener('click', () => {
      if (confirm(`Delete "${proj.name}"? This cannot be undone.`)) {
        const idx = App.projects.findIndex(p => p.id === this.projectId);
        if (idx !== -1) App.projects.splice(idx, 1);
        window.location.href = 'projects.html';
      }
    });
  },

  // ── Add Member Modal ──────────────────────────────────────
  _showAddMemberModal() {
    const proj = this._getProject();
    const existing = document.getElementById('add-member-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'add-member-modal';
    modal.className = 'fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm';
    modal.innerHTML = `<div class="bg-surface-container-high w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden">
      <div class="px-6 py-5 flex justify-between items-center border-b border-outline-variant/10">
        <h2 class="text-lg font-bold">Add Member</h2>
        <button id="add-member-close" class="material-symbols-outlined text-on-surface-variant hover:bg-white/5 p-1.5 rounded-2xl">close</button>
      </div>
      <div class="px-6 py-5 space-y-4">
        <div class="space-y-2">
          <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Username or Email</label>
          <input id="add-member-input" class="w-full bg-surface-container border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-container/40 placeholder:text-zinc-600" placeholder="e.g. johndoe or john@example.com" />
        </div>
        <div class="space-y-2">
          <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Role</label>
          <select id="add-member-role" class="w-full bg-surface-container border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-container/40">
            <option value="member">Member</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button id="add-member-confirm" class="w-full bg-primary-container text-white py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity">Add Member</button>
      </div>
    </div>`;
    document.body.appendChild(modal);

    document.getElementById('add-member-close').onclick = () => modal.remove();
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    document.getElementById('add-member-confirm').onclick = () => {
      const input = document.getElementById('add-member-input').value.trim();
      const role = document.getElementById('add-member-role').value;
      if (!input) return;
      const newMember = {
        id: 'u' + Date.now(),
        name: input,
        username: input.toLowerCase().replace(/\s+/g,''),
        role,
        avatar: null,
        hoursLogged: 0,
        tasksCompleted: 0
      };
      if (!proj.members) proj.members = [];
      proj.members.push(newMember);
      if (proj.messages?.dm) proj.messages.dm[newMember.id] = [];
      App.addActivity(App.currentUser.name, 'added member', newMember.name);
      modal.remove();
      this._renderHero();
      if (this.activeTab === 'settings') this._renderSettings();
    };
  },
};

document.addEventListener('DOMContentLoaded', () => ProjectOverview.init());
