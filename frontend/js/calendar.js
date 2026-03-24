// calendar.js — Fully dynamic calendar

const Calendar = {
  weekOffset: 0,
  baseMonday: new Date(2024, 9, 14),
  events: [],

  init() {
    this.events = (App?.events || []).map(e => ({ ...e }));
    this._render();
    document.getElementById('cal-prev')?.addEventListener('click', () => { this.weekOffset--; this._render(); });
    document.getElementById('cal-next')?.addEventListener('click', () => { this.weekOffset++; this._render(); });
    document.getElementById('add-event-fab')?.addEventListener('click', () => this._showAddModal());
  },

  _getMonday() {
    const d = new Date(this.baseMonday);
    d.setDate(d.getDate() + this.weekOffset * 7);
    return d;
  },

  _render() {
    const monday = this._getMonday();
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const title = document.getElementById('cal-title');
    if (title) title.textContent = `${months[monday.getMonth()]} ${monday.getFullYear()}`;

    this._renderWeekHeader(monday);
    this._renderTimeSlots(monday);
    this._renderMiniCal(monday);
    this._renderUpcoming();
  },

  _renderWeekHeader(monday) {
    const header = document.getElementById('week-header');
    if (!header) return;
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const today = new Date();
    header.innerHTML = `<div class="p-3 border-r border-outline-variant/10"></div>` +
      days.map((d, i) => {
        const date = new Date(monday);
        date.setDate(date.getDate() + i);
        const isToday = date.toDateString() === today.toDateString();
        return `<div class="p-3 text-center border-r border-outline-variant/10 last:border-r-0">
          <span class="block text-[10px] ${isToday ? 'text-primary' : 'text-outline-variant'} uppercase tracking-widest">${d}</span>
          <span class="text-lg font-bold ${isToday ? 'text-primary' : ''}">${date.getDate()}</span>
        </div>`;
      }).join('');
  },

  _renderTimeSlots(monday) {
    const container = document.getElementById('time-slots');
    if (!container) return;
    const hours = [8,9,10,11,12,13,14,15,16,17,18];
    container.innerHTML = hours.map(h => {
      const label = h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`;
      return `<div class="grid grid-cols-8 h-20 border-b border-outline-variant/5 relative" data-hour="${h}">
        <div class="p-2 text-[10px] text-right pr-3 text-outline-variant">${label}</div>
        <div class="col-span-7 relative"></div>
      </div>`;
    }).join('');

    // Render events
    this.events.forEach(ev => {
      const row = container.querySelector(`[data-hour="${Math.floor(ev.startHour)}"]`);
      if (!row) return;
      const cell = row.querySelector('.col-span-7');
      if (!cell) return;
      const dayPct = ((ev.day - 1) / 7) * 100;
      const widthPct = (1 / 7) * 100 - 1;
      const evEl = document.createElement('div');
      evEl.className = 'absolute top-1 bottom-1 rounded-lg border-l-4 p-2 cursor-pointer hover:opacity-90 transition-opacity z-10';
      evEl.style.cssText = `left:${dayPct}%;width:${widthPct}%;background:rgba(53,53,52,0.7);backdrop-filter:blur(12px);border-color:${ev.color === 'primary-container' ? '#ff4500' : ev.color === 'tertiary' ? '#9ca3af' : '#ff4500'}`;
      evEl.innerHTML = `<h4 class="text-xs font-bold leading-tight truncate">${ev.title}</h4><span class="text-[9px] text-on-surface-variant">${ev.location}</span>`;
      evEl.addEventListener('click', () => this._showEventDetail(ev));
      cell.appendChild(evEl);
    });
  },

  _renderMiniCal(monday) {
    const grid = document.getElementById('mini-calendar');
    const label = document.getElementById('mini-cal-label');
    if (!grid) return;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = monday.getMonth();
    const year = monday.getFullYear();
    if (label) label.textContent = `${months[month].toUpperCase()} ${year}`;

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow = firstDay.getDay();
    const today = new Date();

    const headers = ['S','M','T','W','T','F','S'].map(d => `<div class="text-outline-variant">${d}</div>`).join('');
    let cells = '';
    for (let i = 0; i < startDow; i++) cells += `<div class="py-1.5 text-outline-variant/30">${new Date(year, month, -startDow + i + 1).getDate()}</div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = new Date(year, month, d).toDateString() === today.toDateString();
      cells += `<div class="py-1.5 cursor-pointer hover:text-primary transition-colors ${isToday ? 'bg-primary-container text-white rounded-2xl font-bold' : ''}">${d}</div>`;
    }
    grid.innerHTML = headers + cells;
  },

  _renderUpcoming() {
    const list = document.getElementById('upcoming-list');
    if (!list) return;
    const colors = { 'primary-container': 'border-[#ff4500]', 'tertiary': 'border-[#9ca3af]', 'primary': 'border-[#ff4500]' };
    list.innerHTML = this.events.slice(0, 4).map(ev => `
      <div class="p-2.5 bg-surface-container-low rounded-2xl border-l-4 ${colors[ev.color] || 'border-primary-container'} cursor-pointer hover:bg-surface-container-high transition-colors" onclick="">
        <p class="text-xs font-bold">${ev.title}</p>
        <p class="text-[10px] text-on-surface-variant">${ev.startHour}:00 – ${ev.endHour}:00</p>
      </div>`).join('');
  },

  _showAddModal() {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm';
    overlay.innerHTML = `<div class="bg-surface-container-high rounded-2xl p-7 w-full max-w-sm mx-4 border border-outline-variant/20 shadow-2xl">
      <div class="flex justify-between items-center mb-5">
        <h2 class="font-bold text-base">New Event</h2>
        <button class="ev-close material-symbols-outlined text-on-surface-variant text-sm">close</button>
      </div>
      <div class="flex flex-col gap-3">
        <input id="ev-title" class="bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30" placeholder="Event title" />
        <input id="ev-location" class="bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30" placeholder="Location or link" />
        <div class="flex gap-2">
          <input id="ev-start" type="number" min="0" max="23" class="flex-1 bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30" placeholder="Start hour (e.g. 10)" />
          <input id="ev-end" type="number" min="0" max="23" class="flex-1 bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary/30" placeholder="End hour (e.g. 11)" />
        </div>
        <select id="ev-day" class="bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-0">
          <option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option>
          <option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="7">Sunday</option>
        </select>
        <button id="ev-confirm" class="bg-primary-container text-white rounded-2xl py-3 font-bold text-sm hover:opacity-90 transition-opacity">Add Event</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.ev-close').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('ev-confirm').onclick = () => {
      const title = document.getElementById('ev-title')?.value.trim();
      if (!title) return;
      const ev = {
        id: 'e' + Date.now(), title,
        location: document.getElementById('ev-location')?.value || '',
        startHour: parseInt(document.getElementById('ev-start')?.value) || 10,
        endHour: parseInt(document.getElementById('ev-end')?.value) || 11,
        day: parseInt(document.getElementById('ev-day')?.value) || 1,
        color: 'primary-container'
      };
      this.events.push(ev);
      App?.addActivity('You', 'created event', title);
      overlay.remove();
      this._render();
    };
  },

  _showEventDetail(ev) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm';
    overlay.innerHTML = `<div class="bg-surface-container-high rounded-2xl p-7 w-full max-w-xs mx-4 border border-outline-variant/20 shadow-2xl">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-bold text-base">${ev.title}</h2>
        <button class="ev-close material-symbols-outlined text-on-surface-variant text-sm">close</button>
      </div>
      <div class="space-y-2 text-sm text-on-surface-variant">
        ${ev.location ? `<p><span class="material-symbols-outlined text-sm align-middle mr-1">location_on</span>${ev.location}</p>` : ''}
        <p><span class="material-symbols-outlined text-sm align-middle mr-1">schedule</span>${ev.startHour}:00 – ${ev.endHour}:00</p>
      </div>
      <button class="mt-5 w-full bg-primary-container/20 text-primary rounded-2xl py-2.5 text-sm font-bold hover:bg-primary-container/30 transition-colors ev-close">Close</button>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelectorAll('.ev-close').forEach(b => b.onclick = () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }
};

document.addEventListener('DOMContentLoaded', () => Calendar.init());
