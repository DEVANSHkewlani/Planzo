// projects.js — Dynamic project grid + modals

const Projects = {
  init() {
    this._renderProjects();
    this._bindCreate();
    this._bindJoin();
    document.getElementById('load-more-btn')?.addEventListener('click', () => {
      const btn = document.getElementById('load-more-btn');
      if (btn) { btn.querySelector('span:first-child').textContent = 'No more projects'; btn.disabled = true; }
    });
    document.getElementById('fab-add')?.addEventListener('click', () => this._showCreateModal());
  },

  _renderProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    const projects = App?.projects || [];
    if (!projects.length) { grid.innerHTML = '<p class="text-on-surface-variant text-sm col-span-12">No projects yet.</p>'; return; }

    const statusColor = { 'on-track':'text-green-400 bg-green-500/10','at-risk':'text-yellow-400 bg-yellow-500/10','urgent':'text-red-400 bg-red-500/10','active':'text-green-400 bg-green-500/10','planning':'text-blue-400 bg-blue-500/10' };
    const barColor = { 'on-track':'bg-[#ff4500]','at-risk':'bg-yellow-500','urgent':'bg-[#ff4500]','active':'bg-[#ff4500]','planning':'bg-blue-500' };

    grid.innerHTML = projects.map((p, i) => {
      const span = i === 0 ? 'md:col-span-8' : 'md:col-span-4';
      const statusColor = { 'on-track':'text-green-400','at-risk':'text-yellow-400','urgent':'text-red-400','active':'text-green-400','planning':'text-blue-400' };
      const barColor = { 'on-track':'bg-[#ff4500]','at-risk':'bg-yellow-500','urgent':'bg-[#ff4500]','active':'bg-[#ff4500]','planning':'bg-blue-500' };
      const sc = statusColor[p.status] || 'text-on-surface-variant';
      const bc = barColor[p.status] || 'bg-[#ff4500]';
      const minH = i === 0 ? 'min-h-[280px]' : '';
      const teamMeta = p.teamAccess && p.teamName
        ? `<div class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/5">
            <span class="flex items-center gap-1 text-[10px] text-on-surface-variant">
              <span class="material-symbols-outlined text-sm text-gray-400">group</span>${p.teamName}
            </span>
            <span class="flex items-center gap-1 text-[10px] font-mono text-[#ff4500] bg-[#ff4500]/10 px-2 py-0.5 border border-[#ff4500]/20">
              <span class="material-symbols-outlined text-sm">key</span>${p.teamCode}
            </span>
          </div>`
        : '';
      return `<div class="project-card ${span} rounded-2xl bg-white/[0.02] border border-white/5 p-6 flex flex-col justify-between hover:bg-white/[0.04] hover:border-[#ff4500]/20 transition-all duration-200 cursor-pointer ${minH}" data-pid="${p.id}">
        <div class="flex justify-between items-start mb-4">
          <div class="space-y-2">
            <span class="text-[10px] tracking-widest uppercase font-bold text-on-surface-variant">${p.category}</span>
            <h2 class="${i===0?'text-2xl':'text-lg'} font-normal" style="font-family:'Instrument Serif',serif">${p.name}</h2>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-widest ${sc}">${p.status.replace('-',' ')}</span>
        </div>
        <div class="space-y-3 mt-auto">
          <div class="flex justify-between text-xs">
            <span class="text-on-surface-variant">Completion</span>
            <span class="text-[#ff4500] font-bold">${p.completion}%</span>
          </div>
          <div class="h-0.5 w-full bg-surface-container-highest overflow-hidden">
            <div class="h-full ${bc}" style="width:${p.completion}%"></div>
          </div>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-1">
              ${p.members.slice(0,3).map(m => `<div class="w-6 h-6 bg-surface-container-highest border border-white/10 flex items-center justify-center text-[9px] font-bold">${(m.name||m)[0].toUpperCase()}</div>`).join('')}
              ${p.members.length > 3 ? `<div class="w-6 h-6 bg-surface-container-highest border border-white/10 flex items-center justify-center text-[9px] font-bold">+${p.members.length-3}</div>` : ''}
              <span class="text-[10px] text-on-surface-variant ml-1">${p.members.length} active</span>
            </div>
            <span class="text-xs text-on-surface-variant">${p.completedTasks}/${p.totalTasks} tasks</span>
          </div>
          ${teamMeta}
        </div>
      </div>`;
    }).join('');

    grid.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', () => { window.location.href = 'projectoverview.html?pid=' + card.dataset.pid; });
    });
  },

  _bindCreate() {
    document.getElementById('create-btn')?.addEventListener('click', () => Modals.showAddProject());
  },

  _bindJoin() {
    document.getElementById('join-btn')?.addEventListener('click', () => Modals.showJoinProject());
  },

  _showCreateModal() { Modals.showAddProject(); },
  _showJoinModal() { Modals.showJoinProject(); },
};

document.addEventListener('DOMContentLoaded', () => Projects.init());
