// chat.js — Dynamic chat, friends list (toggleable, open/close, remove/chat)

const Chat = {
  activeChat: 'design-team',
  typingTimer: null,
  friendsVisible: true,

  friends: [
    { id: 'f1', name: 'Jordan Smith', online: true, lastMsg: 'The glassmorphic design is coming along...', time: '12:45 PM' },
    { id: 'f2', name: 'Alex Rivera', online: false, lastMsg: 'Did you see the new Planzo updates?', time: 'Yesterday' },
    { id: 'f3', name: 'Morgan Freeman', online: false, lastMsg: 'Sent an attachment: style_guide.pdf', time: 'Oct 12' },
    { id: 'f4', name: 'Sam Taylor', online: true, lastMsg: 'On it 👍', time: '11:30 AM' },
    { id: 'f5', name: 'Taylor Kim', online: true, lastMsg: 'Sounds good!', time: '10:00 AM' },
  ],

  init() {
    this._renderChatList();
    this._renderFriends();
    this._renderMessages();
    this._bindSend();
    this._bindSearch();
    this._bindFriendsToggle();
    this._bindAddFriend();
    this._scrollToBottom();
  },

  _renderChatList() {
    const list = document.getElementById('chat-list');
    if (!list) return;
    list.innerHTML = this.friends.map(f => `
      <div class="chat-item p-3.5 rounded-2xl ${f.id === 'f1' ? 'bg-surface-container-low border-l-4 border-primary-container' : 'hover:bg-surface-container-low/50'} flex gap-3 items-center cursor-pointer transition-all" data-id="${f.id}">
        <div class="relative shrink-0">
          <div class="w-10 h-10 rounded-2xl bg-surface-container-highest flex items-center justify-center font-bold text-sm">${f.name[0]}</div>
          <div class="absolute bottom-0 right-0 w-2.5 h-2.5 ${f.online ? 'bg-green-500' : 'bg-on-surface-variant'} border-2 border-surface-container-low rounded-2xl"></div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-baseline">
            <h3 class="font-semibold text-sm truncate">${f.name}</h3>
            <span class="text-[10px] text-on-surface-variant uppercase shrink-0 ml-1">${f.time}</span>
          </div>
          <p class="text-xs text-on-surface-variant truncate">${f.lastMsg}</p>
        </div>
      </div>`).join('');

    list.querySelectorAll('.chat-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const friend = this.friends.find(f => f.id === id);
        if (!friend) return;
        list.querySelectorAll('.chat-item').forEach(i => {
          i.classList.remove('bg-surface-container-low','border-l-4','border-primary-container');
        });
        item.classList.add('bg-surface-container-low','border-l-4','border-primary-container');
        const title = document.getElementById('chat-title');
        const subtitle = document.getElementById('chat-subtitle');
        if (title) title.textContent = friend.name;
        if (subtitle) subtitle.textContent = friend.online ? 'Online' : 'Offline';
        this.activeChat = id;
        this._renderMessages();
      });
    });
  },

  _renderFriends() {
    const list = document.getElementById('friends-list');
    const countEl = document.getElementById('online-count');
    if (!list) return;
    const online = this.friends.filter(f => f.online).length;
    if (countEl) countEl.textContent = `${online} Online`;

    list.innerHTML = this.friends.map(f => `
      <div class="friend-item flex items-center gap-2.5 p-2.5 rounded-2xl hover:bg-surface-container-high/60 transition-all cursor-pointer group relative" data-id="${f.id}">
        <div class="relative shrink-0">
          <div class="w-8 h-8 rounded-2xl bg-surface-container-highest flex items-center justify-center text-xs font-bold">${f.name[0]}</div>
          <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${f.online ? 'bg-green-500' : 'bg-on-surface-variant'} border-2 border-surface-container-low rounded-2xl"></div>
        </div>
        <span class="text-sm text-on-surface-variant group-hover:text-[#ff4500] transition-colors flex-1 truncate">${f.name}</span>
        <button class="friend-menu-btn material-symbols-outlined text-on-surface-variant/40 group-hover:text-on-surface-variant text-sm opacity-0 group-hover:opacity-100 transition-all">more_horiz</button>
      </div>`).join('');

    list.querySelectorAll('.friend-item').forEach(item => {
      item.querySelector('.friend-menu-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._showFriendMenu(item.dataset.id, e.currentTarget);
      });
      item.addEventListener('click', (e) => {
        if (e.target.closest('.friend-menu-btn')) return;
        const id = item.dataset.id;
        const friend = this.friends.find(f => f.id === id);
        if (!friend) return;
        const chatItem = document.querySelector(`.chat-item[data-id="${id}"]`);
        if (chatItem) chatItem.click();
      });
    });
  },

  _showFriendMenu(friendId, anchor) {
    document.getElementById('friend-ctx-menu')?.remove();
    const friend = this.friends.find(f => f.id === friendId);
    if (!friend) return;
    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.id = 'friend-ctx-menu';
    menu.className = 'fixed z-[300] bg-surface-container-high rounded-2xl border border-outline-variant/20 shadow-2xl overflow-hidden w-44';
    menu.style.top = rect.bottom + 4 + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    menu.innerHTML = `
      <button class="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-surface-container-highest transition-colors text-left" id="ctx-chat">
        <span class="material-symbols-outlined text-base text-primary">chat_bubble</span> Chat
      </button>
      <button class="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-surface-container-highest transition-colors text-left text-red-400" id="ctx-remove">
        <span class="material-symbols-outlined text-base">person_remove</span> Remove
      </button>`;
    document.body.appendChild(menu);

    menu.querySelector('#ctx-chat').onclick = () => {
      menu.remove();
      const chatItem = document.querySelector(`.chat-item[data-id="${friendId}"]`);
      if (chatItem) chatItem.click();
    };
    menu.querySelector('#ctx-remove').onclick = () => {
      menu.remove();
      this.friends = this.friends.filter(f => f.id !== friendId);
      this._renderFriends();
      this._renderChatList();
      App?.addNotification(`${friend.name} removed from friends.`);
    };

    setTimeout(() => document.addEventListener('click', function h(e) {
      if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', h); }
    }), 50);
  },

  _renderMessages() {
    const area = document.getElementById('messages-area');
    if (!area) return;
    const msgs = App?.messages?.['design-team'] || [];
    const existing = area.querySelectorAll('.msg-bubble');
    existing.forEach(e => e.remove());
    msgs.forEach(m => {
      const div = document.createElement('div');
      div.className = `msg-bubble flex gap-3 max-w-[80%] ${m.self ? 'self-end flex-row-reverse' : ''}`;
      div.innerHTML = m.self
        ? `<div class="w-7 h-7 rounded-2xl bg-primary-container flex items-center justify-center self-end shrink-0"><span class="text-[10px] font-bold text-white">ME</span></div>
           <div class="flex flex-col gap-1 items-end">
             <div class="message-bubble-out p-3.5 rounded-2xl rounded-br-none text-sm leading-relaxed">${this._fmt(m.text)}</div>
             <span class="text-[10px] text-on-surface-variant px-1">${m.time}</span>
           </div>`
        : `<div class="w-7 h-7 rounded-2xl bg-surface-container-highest flex items-center justify-center self-end shrink-0 text-xs font-bold">${m.sender[0]}</div>
           <div class="flex flex-col gap-1">
             <span class="text-[10px] text-on-surface-variant px-1">${m.sender}</span>
             <div class="message-bubble-in p-3.5 rounded-2xl rounded-bl-none text-sm leading-relaxed">${this._fmt(m.text)}</div>
           </div>`;
      area.appendChild(div);
    });
    this._scrollToBottom();
  },

  _bindSend() {
    const input = document.getElementById('msg-input');
    const btn = document.getElementById('send-btn');
    if (!input || !btn) return;
    btn.addEventListener('click', () => this._send(input));
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._send(input); } });
    input.addEventListener('input', () => this._showTyping());
  },

  _send(input) {
    const text = input.value.trim();
    if (!text) return;
    const msg = { sender: 'Me', text, time: this._now(), self: true };
    if (!App.messages['design-team']) App.messages['design-team'] = [];
    App.messages['design-team'].push(msg);
    this._renderMessages();
    input.value = '';
    App?.addActivity('You', 'sent a message in', 'Design Team');
    if (Math.random() > 0.4) setTimeout(() => this._simulateReply(), 1200 + Math.random() * 1800);
  },

  _simulateReply() {
    const replies = [
      { sender: 'Jordan Smith', text: 'Got it, will check shortly!' },
      { sender: 'Alex Rivera', text: 'Sounds good. Let me know if you need anything.' },
      { sender: 'Sam Taylor', text: 'On it 👍' },
    ];
    const r = replies[Math.floor(Math.random() * replies.length)];
    App.messages['design-team'].push({ sender: r.sender, text: r.text, time: this._now(), self: false });
    this._renderMessages();
  },

  _showTyping() {
    clearTimeout(this.typingTimer);
    const sub = document.getElementById('chat-subtitle');
    if (!sub) return;
    const orig = sub.dataset.orig || sub.textContent;
    sub.dataset.orig = orig;
    sub.textContent = 'You are typing...';
    this.typingTimer = setTimeout(() => { sub.textContent = orig; }, 1500);
  },

  _bindSearch() {
    document.getElementById('chat-search')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.chat-item').forEach(item => {
        const name = item.querySelector('h3')?.textContent.toLowerCase() || '';
        item.style.display = name.includes(q) || !q ? '' : 'none';
      });
    });
  },

  _bindFriendsToggle() {
    document.getElementById('friends-toggle')?.addEventListener('click', () => {
      const sidebar = document.getElementById('friends-sidebar');
      if (!sidebar) return;
      this.friendsVisible = !this.friendsVisible;
      sidebar.style.display = this.friendsVisible ? '' : 'none';
    });
  },

  _bindAddFriend() {
    document.getElementById('add-friend-btn')?.addEventListener('click', () => {
      const name = prompt('Enter friend name:');
      if (!name?.trim()) return;
      const id = 'f' + Date.now();
      this.friends.push({ id, name: name.trim(), online: false, lastMsg: 'New friend', time: 'Now' });
      this._renderFriends();
      this._renderChatList();
    });
  },

  _scrollToBottom() {
    const area = document.getElementById('messages-area');
    if (area) setTimeout(() => { area.scrollTop = area.scrollHeight; }, 50);
  },

  _fmt(text) {
    return text.replace(/@(\w+)/g, '<span class="text-[#ff4500] font-semibold">@$1</span>').replace(/#(\w+)/g, '<span class="text-[#ff4500] font-semibold">#$1</span>');
  },

  _now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
};

document.addEventListener('DOMContentLoaded', () => Chat.init());
