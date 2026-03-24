// ============================================================
// modals.js — All shared modal/panel logic
// ============================================================

const Modals = {

  // ── FAB Add Menu ──────────────────────────────────────────
  showAddMenu() {
    const existing = document.getElementById('add-menu');
    if (existing) { existing.remove(); return; }
    const menu = document.createElement('div');
    menu.id = 'add-menu';
    menu.className = 'fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] bg-surface-container-high/95 backdrop-blur-2xl rounded-2xl border border-outline-variant/20 shadow-2xl p-2 flex flex-col gap-1 w-56';
    menu.innerHTML = `
      <button id="menu-add-task" class="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-surface-container-highest transition-all text-sm font-semibold text-left">
        <span class="material-symbols-outlined text-primary-container">task_alt</span>Add Task
      </button>
      <button id="menu-add-project" class="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-surface-container-highest transition-all text-sm font-semibold text-left">
        <span class="material-symbols-outlined text-gray-400">folder_open</span>New Project
      </button>
      <button id="menu-join-project" class="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-surface-container-highest transition-all text-sm font-semibold text-left">
        <span class="material-symbols-outlined text-primary">link</span>Join Project
      </button>
    `;
    document.body.appendChild(menu);
    document.getElementById('menu-add-task').onclick = () => { menu.remove(); this.showAddTask(); };
    document.getElementById('menu-add-project').onclick = () => { menu.remove(); this.showAddProject(); };
    document.getElementById('menu-join-project').onclick = () => { menu.remove(); this.showJoinProject(); };
    setTimeout(() => document.addEventListener('click', function h(e) {
      if (!menu.contains(e.target) && !e.target.closest('#fab-add')) { menu.remove(); document.removeEventListener('click', h); }
    }), 100);
  },

  // ── Task Detail Slide-over ────────────────────────────────
  showTaskDetail(task) {
    document.getElementById('task-panel')?.remove();
    const priorityColor = { high: 'text-red-400 bg-red-500/10', medium: 'text-yellow-400 bg-yellow-500/10', low: 'text-green-400 bg-green-500/10' };
    const statusLabel = { todo: 'To Do', inprogress: 'In Progress', done: 'Completed' };
    const pc = priorityColor[task.priority] || priorityColor.medium;

    const panel = document.createElement('div');
    panel.id = 'task-panel';
    panel.className = 'fixed inset-0 z-[250] flex';
    panel.innerHTML = `
      <div id="task-panel-backdrop" class="flex-1 bg-black/50 backdrop-blur-sm"></div>
      <div class="w-full max-w-md h-full bg-surface-container/95 backdrop-blur-2xl border-l border-outline-variant/20 flex flex-col overflow-hidden shadow-[-40px_0_80px_rgba(0,0,0,0.4)] transform transition-transform duration-300">
        <div class="px-7 py-6 flex justify-between items-start border-b border-outline-variant/10 bg-surface-container-high/30">
          <div class="flex-1 pr-4">
            <span class="text-[10px] font-bold tracking-[0.2em] uppercase text-primary-container block mb-2">${statusLabel[task.status] || 'Task'} / ${task.tag || 'General'}</span>
            <h2 class="text-2xl font-extrabold text-on-surface tracking-tight leading-tight">${task.title}</h2>
          </div>
          <button id="task-panel-close" class="material-symbols-outlined text-on-surface-variant hover:bg-white/5 p-2 rounded-2xl transition-all shrink-0">close</button>
        </div>
        <div class="flex-1 overflow-y-auto px-7 py-6 space-y-8">
          <section class="space-y-3">
            <h4 class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Description</h4>
            <p class="text-on-surface-variant leading-relaxed font-light text-sm">${task.description || 'No description provided.'}</p>
          </section>
          <div class="grid grid-cols-2 gap-6 py-6 border-y border-outline-variant/10">
            <section class="space-y-2">
              <h4 class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Priority</h4>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-xs font-bold ${pc}">
                <span class="w-1.5 h-1.5 rounded-2xl bg-current"></span>${task.priority || 'medium'}
              </span>
            </section>
            <section class="space-y-2">
              <h4 class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Status</h4>
              <span class="text-sm font-semibold text-on-surface">${statusLabel[task.status] || 'To Do'}</span>
            </section>
            <section class="space-y-2">
              <h4 class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Deadline</h4>
              <div class="flex items-center gap-1.5 text-primary text-sm font-bold">
                <span class="material-symbols-outlined text-base">calendar_today</span>
                ${task.deadline || 'No deadline'}
              </div>
            </section>
            <section class="space-y-2">
              <h4 class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Assignees</h4>
              <div class="flex -space-x-2">
                ${(task.assignees||[]).map(a => `<div class="w-8 h-8 rounded-2xl bg-surface-container-highest border-2 border-surface flex items-center justify-center text-[10px] font-bold">${a[0].toUpperCase()}</div>`).join('')}
              </div>
            </section>
          </div>
          <section class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Notes</h4>
              <button class="text-xs font-bold text-primary hover:underline">Add Note</button>
            </div>
            <div class="bg-white/5 p-4 rounded-2xl border border-white/5 text-xs text-on-surface-variant italic">Click to add your thoughts...</div>
          </section>
        </div>
        <div class="p-6 border-t border-outline-variant/10 bg-surface-container-high/30 flex gap-3">
          ${task.status !== 'done'
            ? `<button id="task-complete-btn" class="flex-1 bg-primary-container text-white font-bold py-3 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all text-sm">Mark as Completed</button>`
            : `<button class="flex-1 bg-surface-container-highest text-on-surface-variant font-bold py-3 rounded-2xl text-sm cursor-default">Completed ✓</button>`}
          <button id="task-edit-btn" class="px-5 py-3 rounded-2xl border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-highest transition-all text-sm font-bold">Edit</button>
        </div>
      </div>`;
    document.body.appendChild(panel);

    document.getElementById('task-panel-close').onclick = () => panel.remove();
    document.getElementById('task-panel-backdrop').onclick = () => panel.remove();
    document.getElementById('task-complete-btn')?.addEventListener('click', () => {
      task.status = 'done';
      App.addNotification(`Task "<strong>${task.title}</strong>" marked as completed.`, null, 'task');
      panel.remove();
    });
    document.getElementById('task-edit-btn')?.addEventListener('click', () => {
      panel.remove();
      this.showAddTask(task);
    });
  },

  // ── Add / Edit Task Modal ─────────────────────────────────
  showAddTask(existing = null) {
    this._closeOverlay();
    const projects = App?.projects || [];
    // Support hint object { status, _projectId } passed from kanban col buttons
    const hintProjectId = existing?._projectId || null;
    const hintStatus = existing?.status || 'todo';
    const isEdit = !!(existing && existing.title); // only a real edit if it has a title

    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm';
    overlay.innerHTML = `
      <div class="bg-surface-container-high w-full max-w-2xl rounded-2xl shadow-2xl border border-outline-variant/20 flex flex-col max-h-[90vh] overflow-hidden">
        <div class="px-8 py-6 flex justify-between items-center border-b border-outline-variant/10">
          <div>
            <h2 class="text-2xl font-bold tracking-tight">${isEdit ? 'Edit Task' : 'New Task'}</h2>
            <p class="text-on-surface-variant text-sm mt-0.5">${isEdit ? 'Update task details' : 'Add a new action item to your project'}</p>
          </div>
          <button id="modal-close" class="material-symbols-outlined text-on-surface-variant hover:bg-white/5 p-2 rounded-2xl">close</button>
        </div>
        <form id="task-form" class="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Task Name</label>
            <input id="task-title-input" value="${isEdit ? (existing?.title||'') : ''}" class="w-full bg-surface-container-lowest border-none rounded-2xl px-5 py-3.5 text-base font-medium text-white focus:ring-2 focus:ring-primary-container placeholder:text-zinc-600 transition-all" placeholder="e.g. Architect brand guidelines" required />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Description</label>
            <textarea id="task-desc-input" class="w-full bg-surface-container-lowest border-none rounded-2xl px-5 py-3.5 text-sm text-on-surface focus:ring-2 focus:ring-primary-container placeholder:text-zinc-600 resize-none transition-all" placeholder="Detail the core objectives..." rows="3">${isEdit ? (existing?.description||'') : ''}</textarea>
          </div>
          <div class="grid grid-cols-2 gap-5">
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Priority</label>
              <div class="relative">
                <select id="task-priority-input" class="w-full appearance-none bg-surface-container-lowest border-none rounded-2xl px-5 py-3.5 text-on-surface focus:ring-2 focus:ring-primary-container transition-all cursor-pointer">
                  <option value="low" ${existing?.priority==='low'?'selected':''}>Low</option>
                  <option value="medium" ${!isEdit||existing?.priority==='medium'?'selected':''}>Medium</option>
                  <option value="high" ${existing?.priority==='high'?'selected':''}>High</option>
                </select>
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">expand_more</span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Deadline</label>
              <div class="relative">
                <input id="task-deadline-input" type="date" value="${existing?.deadline||''}" class="w-full bg-surface-container-lowest border-none rounded-2xl px-5 py-3.5 text-on-surface focus:ring-2 focus:ring-primary-container transition-all" />
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">calendar_today</span>
              </div>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Project</label>
            <div class="relative">
              <select id="task-project-input" class="w-full appearance-none bg-surface-container-lowest border-none rounded-2xl px-5 py-3.5 text-on-surface focus:ring-2 focus:ring-primary-container transition-all cursor-pointer">
                ${projects.map(p => `<option value="${p.id}" ${p.id === hintProjectId ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>
              <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">expand_more</span>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Tags</label>
            <div class="flex flex-wrap gap-2" id="tag-list">
              ${['Interface','Engineering','Marketing','Design'].map(t =>
                `<span class="tag-chip px-3 py-1.5 bg-white/5 border border-white/10 text-zinc-400 text-xs font-bold rounded-2xl cursor-pointer hover:bg-primary-container/20 hover:text-primary-container hover:border-primary-container/30 transition-all">${t}</span>`
              ).join('')}
              <button type="button" class="px-3 py-1.5 bg-white/5 text-zinc-500 rounded-2xl text-xs hover:bg-white/10 transition-all"><span class="material-symbols-outlined text-sm">add</span></button>
            </div>
          </div>
        </form>
        <div class="px-8 py-5 bg-surface-container-high/50 flex justify-end gap-4 items-center border-t border-outline-variant/10">
          <button id="modal-discard" class="text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Discard</button>
          <button id="modal-confirm" class="bg-primary-container px-8 py-3.5 rounded-2xl text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary-container/20 hover:opacity-90 active:scale-95 transition-all">${isEdit ? 'Save Changes' : 'Create Task'}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('bg-primary-container/20') || chip.classList.toggle('text-primary-container') || chip.classList.toggle('border-primary-container/30'));
    });

    document.getElementById('modal-close').onclick = () => this._closeOverlay();
    document.getElementById('modal-discard').onclick = () => this._closeOverlay();
    overlay.addEventListener('click', e => { if (e.target === overlay) this._closeOverlay(); });

    document.getElementById('modal-confirm').addEventListener('click', () => {
      const title = document.getElementById('task-title-input').value.trim();
      if (!title) return;
      const pid = document.getElementById('task-project-input').value;
      const newTask = {
        id: (isEdit && existing?.id) ? existing.id : 't' + Date.now(),
        title,
        description: document.getElementById('task-desc-input').value,
        priority: document.getElementById('task-priority-input').value,
        deadline: document.getElementById('task-deadline-input').value || null,
        status: isEdit ? (existing?.status || hintStatus) : hintStatus,
        tag: 'General',
        assignees: ['u1'],
      };
      if (!isEdit) {
        if (!App.tasks[pid]) App.tasks[pid] = { todo:[], inprogress:[], completed:[] };
        const col = newTask.status === 'inprogress' ? 'inprogress' : newTask.status === 'completed' ? 'completed' : 'todo';
        App.tasks[pid][col].push(newTask);
        App.addNotification(`Task "<strong>${title}</strong>" created.`, null, 'task');
      } else {
        Object.assign(existing, newTask);
        App.addNotification(`Task "<strong>${title}</strong>" updated.`, null, 'task');
      }
      this._closeOverlay();
      // Re-render whichever kanban is active
      if (typeof ProjectOverview !== 'undefined') ProjectOverview._renderTasks();
      else if (typeof renderKanban === 'function') renderKanban();
    });
  },

  // ── Add Project Modal ─────────────────────────────────────
  showAddProject() {
    this._closeOverlay();
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm';
    overlay.innerHTML = `
      <div class="bg-surface-container-high w-full max-w-xl rounded-2xl shadow-2xl border border-outline-variant/20 flex flex-col max-h-[90vh] overflow-hidden">
        <div class="px-8 py-6 flex justify-between items-center border-b border-outline-variant/10">
          <div>
            <h2 class="text-2xl font-bold tracking-tight">New Project</h2>
            <p class="text-on-surface-variant text-sm mt-0.5">Define your workspace parameters</p>
          </div>
          <button id="modal-close" class="material-symbols-outlined text-on-surface-variant hover:bg-white/5 p-2 rounded-2xl">close</button>
        </div>
        <div class="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Project Name</label>
            <input id="proj-name" class="w-full bg-surface-container-lowest border-none rounded-2xl px-5 py-3.5 text-base font-medium text-white focus:ring-2 focus:ring-primary-container placeholder:text-zinc-600 transition-all" placeholder="e.g. Brand Identity Refresh" required />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Vision Statement</label>
            <textarea id="proj-desc" class="w-full bg-surface-container-lowest border-none rounded-2xl px-5 py-3.5 text-sm text-on-surface focus:ring-2 focus:ring-primary-container placeholder:text-zinc-600 resize-none transition-all" placeholder="A brief description of the project goals..." rows="2"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-5">
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Category</label>
              <div class="relative">
                <select id="proj-category" class="w-full appearance-none bg-surface-container-lowest border-none rounded-2xl px-5 py-3.5 text-on-surface focus:ring-2 focus:ring-primary-container transition-all cursor-pointer">
                  <option>Marketing</option><option>Product</option><option>Design</option>
                  <option>Engineering</option><option>HR</option><option>DevOps</option><option>Internal</option>
                </select>
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">expand_more</span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Deadline</label>
              <div class="relative">
                <input id="proj-deadline" type="date" class="w-full bg-surface-container-lowest border-none rounded-2xl px-5 py-3.5 text-on-surface focus:ring-2 focus:ring-primary-container transition-all" />
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">calendar_today</span>
              </div>
            </div>
          </div>
          <div class="p-4 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center justify-between">
            <div class="flex gap-3 items-center">
              <span class="material-symbols-outlined text-zinc-500">hub</span>
              <div>
                <h3 class="text-sm font-medium">Team Access</h3>
                <p class="text-xs text-zinc-500 font-light">Shared editing permissions</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input checked id="proj-team-access" class="sr-only peer" type="checkbox"/>
              <div class="w-9 h-5 bg-white/10 rounded-2xl peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-2xl after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container peer-checked:after:bg-white"></div>
            </label>
          </div>
          <div id="team-name-field" class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Team Name</label>
            <input id="proj-team-name" class="w-full bg-surface-container-lowest border-none rounded-2xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-primary-container placeholder:text-zinc-600 transition-all" placeholder="e.g. Design Squad" />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Invite Members</label>
            <div class="flex gap-3">
              <input id="proj-invite" class="flex-1 bg-surface-container-lowest border-none rounded-2xl px-5 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary-container placeholder:text-zinc-600 transition-all" placeholder="Invite by email or username..." />
              <button type="button" class="px-4 py-3 bg-primary-container/20 text-primary-container rounded-2xl text-xs font-bold hover:bg-primary-container/30 transition-all">Invite</button>
            </div>
          </div>
        </div>
        <div class="px-8 py-5 bg-surface-container-high/50 flex justify-end gap-4 items-center border-t border-outline-variant/10">
          <button id="modal-discard" class="text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Discard</button>
          <button id="modal-confirm" class="bg-primary-container px-8 py-3.5 rounded-2xl text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary-container/20 hover:opacity-90 active:scale-95 transition-all">Create Project</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    // Toggle team name field visibility
    const teamToggle = document.getElementById('proj-team-access');
    const teamNameField = document.getElementById('team-name-field');
    const syncTeamField = () => {
      teamNameField.style.display = teamToggle.checked ? '' : 'none';
    };
    syncTeamField();
    teamToggle.addEventListener('change', syncTeamField);

    document.getElementById('modal-close').onclick = () => this._closeOverlay();
    document.getElementById('modal-discard').onclick = () => this._closeOverlay();
    overlay.addEventListener('click', e => { if (e.target === overlay) this._closeOverlay(); });

    document.getElementById('modal-confirm').addEventListener('click', () => {
      const name = document.getElementById('proj-name').value.trim();
      if (!name) return;
      const teamAccess = document.getElementById('proj-team-access').checked;
      const teamName = teamAccess ? (document.getElementById('proj-team-name').value.trim() || null) : null;
      const teamCode = teamAccess ? ('TEAM-' + Math.random().toString(36).substring(2,8).toUpperCase()) : null;
      const proj = {
        id: 'p' + Date.now(),
        name,
        category: document.getElementById('proj-category').value,
        status: 'planning',
        completion: 0,
        totalTasks: 0,
        completedTasks: 0,
        deadline: document.getElementById('proj-deadline').value || null,
        members: ['u1'],
        teamAccess,
        teamName,
        teamCode,
      };
      App.projects.push(proj);
      App.addNotification(`Project "<strong>${name}</strong>" created.`, 'projects.html', 'project');
      this._closeOverlay();
      if (typeof Projects !== 'undefined') Projects._renderProjects();
      if (typeof Dashboard !== 'undefined') Dashboard._renderProjects();
    });
  },

  // ── Join Project Modal ────────────────────────────────────
  showJoinProject() {
    this._closeOverlay();
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm';
    overlay.innerHTML = `
      <div class="bg-surface-container-high w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden">
        <div class="px-7 py-6 flex justify-between items-center border-b border-outline-variant/10">
          <div>
            <h2 class="text-xl font-bold tracking-tight">Join a Project</h2>
            <p class="text-on-surface-variant text-sm mt-0.5">Enter a code or paste a link</p>
          </div>
          <button id="modal-close" class="material-symbols-outlined text-on-surface-variant hover:bg-white/5 p-2 rounded-2xl">close</button>
        </div>
        <div class="px-7 py-6 space-y-5">
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Project Code or Link</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-base">link</span>
              <input id="join-code" class="w-full bg-surface-container-lowest border-none rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-primary-container placeholder:text-zinc-600 transition-all" placeholder="e.g. TEAM-ABC123 or https://..." />
            </div>
          </div>
          <div class="p-4 bg-primary-container/5 border border-primary-container/20 rounded-2xl text-xs text-on-surface-variant leading-relaxed">
            <span class="material-symbols-outlined text-primary-container text-sm align-middle mr-1">info</span>
            Ask your project owner for the invite code or link. Codes look like <span class="font-mono text-primary-container">TEAM-XXXXXX</span>.
          </div>
          <button id="modal-confirm" class="w-full bg-primary-container text-white py-3.5 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary-container/20 hover:opacity-90 active:scale-95 transition-all">Join Project</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById('modal-close').onclick = () => this._closeOverlay();
    overlay.addEventListener('click', e => { if (e.target === overlay) this._closeOverlay(); });

    document.getElementById('modal-confirm').addEventListener('click', () => {
      const code = document.getElementById('join-code').value.trim();
      if (!code) return;
      App.addNotification(`Joined project with code: <strong>${code}</strong>`, 'projectoverview.html', 'project');
      this._closeOverlay();
      window.location.href = 'projectoverview.html';
    });
  },

  _closeOverlay() { document.getElementById('modal-overlay')?.remove(); }
};

document.addEventListener('DOMContentLoaded', () => {
  // Wire up all create/join buttons across pages
  document.getElementById('create-btn')?.addEventListener('click', () => Modals.showAddProject());
  document.getElementById('join-btn')?.addEventListener('click', () => Modals.showJoinProject());
  document.getElementById('fab-add')?.addEventListener('click', () => Modals.showAddMenu());
});
