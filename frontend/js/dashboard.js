// dashboard.js — Dynamic dashboard rendering

const Dashboard = {
  init() {
    this._renderProjects();
    this._renderHeatmap();
    this._bindSearch();
    this._bindViewAll();
    this._updateHeader();
  },

  _updateHeader() {
    const user = App?.currentUser;
    const projects = App?.projects || [];
    const el = document.getElementById('dash-project-count');
    if (el) el.textContent = projects.length;
    const welcome = document.getElementById('dash-welcome');
    if (welcome) welcome.textContent = `Welcome back, ${user?.name || 'there'}`;
    const subtitle = document.getElementById('dash-subtitle');
    if (subtitle) subtitle.innerHTML = `${user?.role || 'Team Member'} &bull; <span id="dash-project-count-inline">${projects.length}</span> active projects`;
  },

  _renderProjects() {
    const grid = document.getElementById('dash-project-grid');
    if (!grid) return;
    const projects = (App?.projects || []).filter(p => p.status === 'urgent' || p.status === 'at-risk' || p.status === 'on-track').slice(0, 4);
    const all = App?.projects || [];
    const display = all.slice(0, 4);
    grid.innerHTML = display.map(p => this._projectCardHTML(p)).join('');
    grid.querySelectorAll('.project-card').forEach((card) => {
      card.addEventListener('click', () => {
        window.location.href = 'projectoverview.html?pid=' + card.dataset.pid;
      });
    });
  },

  _projectCardHTML(p) {
    const statusColor = { 'on-track':'text-green-400','at-risk':'text-yellow-400','urgent':'text-red-400','active':'text-green-400','planning':'text-blue-400' };
    const barColor = { 'on-track':'bg-[#ff4500]','at-risk':'bg-yellow-500','urgent':'bg-[#ff4500]','active':'bg-[#ff4500]','planning':'bg-blue-500' };
    const sc = statusColor[p.status] || 'text-on-surface-variant';
    const bc = barColor[p.status] || 'bg-[#ff4500]';
    const teamMeta = p.teamAccess && p.teamName
      ? `<div class="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
          <span class="flex items-center gap-1 text-[10px] text-on-surface-variant" style="font-family:'Martian Mono',monospace">
            <span class="material-symbols-outlined text-sm text-gray-400">group</span>${p.teamName}
          </span>
          <span class="flex items-center gap-1 text-[10px] font-mono text-[#ff4500] bg-[#ff4500]/10 px-2 py-0.5 border border-[#ff4500]/20" style="font-family:'Martian Mono',monospace">
            <span class="material-symbols-outlined text-sm">key</span>${p.teamCode}
          </span>
        </div>`
      : '';
    return `<div class="project-card rounded-2xl p-5 border border-white/5 cursor-pointer bg-white/[0.02]" data-pid="${p.id}">
      <div class="flex justify-between items-start mb-3">
        <span class="text-[10px] font-bold tracking-widest uppercase ${sc}" style="font-family:'Martian Mono',monospace">${p.status.replace('-',' ')}</span>
        <span class="text-on-surface-variant text-[10px]" style="font-family:'Martian Mono',monospace">${p.deadline ? new Date(p.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : ''}</span>
      </div>
      <h3 class="text-xl font-normal mb-0.5" style="font-family:'Instrument Serif',serif">${p.name}</h3>
      <p class="text-on-surface-variant text-xs mb-4" style="font-family:'Martian Mono',monospace">${p.category}</p>
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center gap-1.5">
          ${p.members.slice(0,3).map(m => `<div class="w-6 h-6 bg-surface-container-highest border border-white/10 flex items-center justify-center text-[9px] font-bold">${(m.name||m)[0].toUpperCase()}</div>`).join('')}
          ${p.members.length > 3 ? `<div class="w-6 h-6 bg-surface-container-highest border border-white/10 flex items-center justify-center text-[9px] font-bold">+${p.members.length-3}</div>` : ''}
          <span class="text-[10px] text-on-surface-variant ml-1" style="font-family:'Martian Mono',monospace">${p.members.length} active</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-20 h-0.5 bg-surface-container-highest overflow-hidden">
            <div class="h-full ${bc}" style="width:${p.completion}%"></div>
          </div>
          <span class="text-xs text-on-surface-variant" style="font-family:'Martian Mono',monospace">${p.completion}%</span>
        </div>
      </div>
      ${teamMeta}
    </div>`;
  },

  _renderHeatmap() {
    const intensities = ['bg-white/10','bg-[#ff4500]/20','bg-[#ff4500]/40','bg-[#ff4500]/70','bg-[#ff4500]'];
    let total = 0;

    // Full heatmap (53 weeks × 7 days)
    const grid = document.getElementById('heatmap-grid');
    if (grid) {
      for (let i = 0; i < 53 * 7; i++) {
        const cell = document.createElement('div');
        const lvl = Math.floor(Math.random() * intensities.length);
        cell.className = 'heatmap-cell ' + intensities[lvl];
        if (lvl > 0) total += lvl * 3;
        grid.appendChild(cell);
      }
      const countEl = document.getElementById('heatmap-count');
      if (countEl) countEl.textContent = `${total.toLocaleString()} contributions in the last year`;
    }

    // Mini heatmap (26 weeks × 7 days)
    const mini = document.getElementById('mini-heatmap-grid');
    if (mini) {
      let miniTotal = 0;
      for (let i = 0; i < 26 * 7; i++) {
        const cell = document.createElement('div');
        const lvl = Math.floor(Math.random() * intensities.length);
        cell.className = 'rounded-[2px] aspect-square ' + intensities[lvl];
        if (lvl > 0) miniTotal += lvl * 3;
        mini.appendChild(cell);
      }
      const miniCount = document.getElementById('mini-heatmap-count');
      if (miniCount) miniCount.textContent = miniTotal.toLocaleString() + ' pts';
    }
  },

  _bindSearch() {
    const input = document.getElementById('dash-search');
    if (!input) return;
    input.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.project-card').forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        card.style.display = title.includes(q) || !q ? '' : 'none';
      });
    });
  },

  _bindViewAll() {
    document.getElementById('view-all-btn')?.addEventListener('click', () => { window.location.href = 'projects.html'; });
  },

  _bindAI() {
    document.getElementById('ai-fab')?.addEventListener('click', () => this._openAIPanel());
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
    document.getElementById('ai-send').onclick = () => this._handleAIQuery();
    document.getElementById('ai-input').addEventListener('keydown', e => { if (e.key === 'Enter') this._handleAIQuery(); });
  },

  _handleAIQuery() {
    const input = document.getElementById('ai-input');
    const msgs = document.getElementById('ai-messages');
    if (!input || !msgs || !input.value.trim()) return;
    const q = input.value.trim();
    const userMsg = document.createElement('div');
    userMsg.className = 'self-end bg-primary-container/20 rounded-2xl p-2.5 text-xs max-w-[80%]';
    userMsg.textContent = q;
    msgs.appendChild(userMsg);
    const reply = document.createElement('div');
    reply.className = 'bg-surface-container-low rounded-2xl p-2.5 text-xs';
    reply.textContent = this._aiReply(q);
    msgs.appendChild(reply);
    msgs.scrollTop = msgs.scrollHeight;
    input.value = '';
  },

  _aiReply(q) {
    const lower = q.toLowerCase();
    const projects = App?.projects || [];
    if (lower.includes('pending') || lower.includes('task')) {
      const total = projects.reduce((a, p) => a + (p.totalTasks - p.completedTasks), 0);
      return `You have ${total} pending tasks across ${projects.length} projects.`;
    }
    if (lower.includes('deadline') || lower.includes('due')) {
      const urgent = projects.filter(p => p.status === 'at-risk' || p.status === 'urgent');
      return urgent.length ? `${urgent.map(p => p.name).join(', ')} ${urgent.length > 1 ? 'are' : 'is'} at risk.` : 'No urgent deadlines right now.';
    }
    if (lower.includes('project')) {
      const top = [...projects].sort((a,b) => b.completion - a.completion)[0];
      return `You have ${projects.length} projects. Most complete: "${top?.name}" at ${top?.completion}%.`;
    }
    return "I can help with tasks, deadlines, and project status. Try asking about pending tasks or upcoming deadlines.";
  }
};

document.addEventListener('DOMContentLoaded', () => Dashboard.init());
