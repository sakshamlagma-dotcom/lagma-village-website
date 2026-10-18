(() => {
  'use strict';

  if (document.body.dataset.page !== 'service-detail' || new URLSearchParams(location.search).get('id') !== 'chat') return;

  const key = 'todo_chat_sessions_v2';
  const settingsKey = 'todo_voice_settings_v2';
  const state = {
    sessions: normalizeSessions(read(key, [])),
    sessionId: null,
    messages: [],
    controller: null,
    recognition: null,
    listening: false,
    liveMode: false,
    speaking: false,
    nearBottom: true,
  };
  const settings = Object.assign({ language: 'hi-IN', rate: 1, autoSpeak: false }, read('todo_voiceSettings', {}), read(settingsKey, {}));
  const iconPaths = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
    moon: '<path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    send: '<path d="m21 3-7.2 18-3.9-7.1L3 10.1 21 3Z"/><path d="m10 14 5-5"/>',
    stop: '<rect x="7" y="7" width="10" height="10" rx="2"/>',
    mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3m-3 0h6"/>',
    volume: '<path d="M4 10v4h3l4 3V7l-4 3H4Z"/><path d="M15 9a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12"/>',
    paperclip: '<path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
    copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    arrowDown: '<path d="M12 5v14m-6-6 6 6 6-6"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  };
  function icon(name, label = '') {
    const title = label ? `<title>${escapeHtml(label)}</title>` : '';
    return `<svg class="ui-icon" aria-hidden="${label ? 'false' : 'true'}" focusable="false" viewBox="0 0 24 24" role="${label ? 'img' : 'presentation'}">${title}${iconPaths[name] || ''}</svg>`;
  }

  function read(name, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(name));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }
  function write(name, value) {
    try { localStorage.setItem(name, JSON.stringify(value)); } catch { /* storage is optional */ }
  }
  function normalizeSessions(input) {
    if (!Array.isArray(input)) return [];
    return input.filter((session) => session && typeof session.id === 'string' && typeof session.title === 'string')
      .slice(0, 30)
      .map((session) => ({
        id: session.id,
        title: session.title.slice(0, 80),
        updatedAt: Number(session.updatedAt) || Date.now(),
        messages: (Array.isArray(session.messages) ? session.messages : [])
          .filter((message) => message && ['user', 'assistant'].includes(message.role) && typeof message.text === 'string')
          .slice(-60)
          .map((message) => ({ role: message.role, text: message.text.slice(0, 8000), id: typeof message.id === 'string' ? message.id : makeId() })),
      }));
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  function inlineMarkdown(value) {
    return escapeHtml(value)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }
  function markdown(value) {
    const source = String(value || '').replace(/\r\n/g, '\n');
    const blocks = [];
    const withTokens = source.replace(/```([\w+-]*)\n?([\s\S]*?)```/g, (_, language, code) => {
      const token = `@@CODE_${blocks.length}@@`;
      blocks.push(`<div class="code-block"><div class="code-head"><span>${escapeHtml(language || 'code')}</span><button type="button" data-copy-code="${encodeURIComponent(code.trim())}">Copy</button></div><pre><code>${escapeHtml(code.trim())}</code></pre></div>`);
      return token;
    });
    return withTokens.split(/\n{2,}/).map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^@@CODE_\d+@@$/.test(trimmed)) return blocks[Number(trimmed.match(/\d+/)[0])];
      const lines = trimmed.split('\n');
      if (lines.every((line) => /^[-*]\s+/.test(line))) return `<ul>${lines.map((line) => `<li>${inlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`;
      if (/^#{1,3}\s/.test(trimmed)) return trimmed.split('\n').map((line) => `<h${line.match(/^#+/)[0].length}>${inlineMarkdown(line.replace(/^#+\s+/, ''))}</h${line.match(/^#+/)[0].length}>`).join('');
      return `<p>${inlineMarkdown(trimmed).replace(/\n/g, '<br>')}</p>`;
    }).join('');
  }
  function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
  function activeSession() { return state.sessions.find((session) => session.id === state.sessionId); }
  function persist() {
    const session = activeSession();
    if (session) {
      session.messages = state.messages.slice(-60);
      session.updatedAt = Date.now();
    }
    write(key, state.sessions.slice(0, 30));
  }
  function createSession() {
    if (state.controller) { toast('Stop the current response before starting a new chat.'); return; }
    if (state.sessions.length >= 30 && !window.confirm('This browser keeps up to 30 conversations. Starting a new chat will remove the oldest one. Continue?')) return;
    const session = { id: makeId(), title: 'New conversation', updatedAt: Date.now(), messages: [] };
    state.sessions.unshift(session);
    if (state.sessions.length > 30) state.sessions.pop();
    state.sessionId = session.id;
    state.messages = [];
    persist();
    renderMessages();
    renderHistory();
  }
  function selectSession(id) {
    if (state.controller) { toast('Stop the current response before switching chats.'); return; }
    const session = state.sessions.find((item) => item.id === id);
    if (!session) return;
    state.sessionId = id;
    state.messages = session.messages.slice();
    renderMessages();
    renderHistory();
    closeHistory();
  }
  function build() {
    const page = document.querySelector('#pageContent');
    if (!page) return;
    document.body.classList.add('chat-experience-page');
    page.innerHTML = `
      <main class="chat-app" aria-label="TODO AI chat">
        <header class="chat-header">
          <button class="chat-icon-button mobile-history-button" id="historyButton" type="button" aria-label="Open chat history" aria-expanded="false">${icon('menu')}</button>
          <div class="chat-brand"><span class="chat-brand-mark">T</span><div><strong>TODO AI</strong><span><i class="brand-status"></i> Think. Ask. Create.</span></div></div>
          <div class="chat-header-actions"><span class="connection-status" id="connectionStatus"><i></i><span>Checking connection</span></span><button class="chat-icon-button" id="themeButton" type="button" aria-label="Toggle theme">${icon('moon')}</button><button class="chat-icon-button header-new-chat" id="headerNewChat" type="button" aria-label="Start a new chat">${icon('plus')}</button></div>
        </header>
        <div class="chat-workspace"><aside class="tools-rail" aria-label="Chat tools"><button class="rail-action active" type="button" data-prompt="Help me write something clearly"><span>Write</span></button><button class="rail-action" type="button" data-prompt="Explain this topic simply"><span>Study</span></button><button class="rail-action" type="button" data-prompt="Give me five creative ideas"><span>Ideas</span></button><button class="rail-action" type="button" data-prompt="Translate this into Hindi"><span>Translate</span></button></aside><section class="chat-scroll" id="chatScroll" aria-live="polite"><div class="chat-content" id="chatMessages"></div><button class="jump-button" id="jumpButton" type="button">${icon('arrowDown')}<span>New messages</span></button></section><aside class="tools-panel" id="toolsPanel" aria-label="Assistant tools"><section class="live-card"><span class="tool-kicker">BROWSER VOICE</span><h2>Voice chat</h2><p>Uses browser speech recognition and spoken replies. Availability depends on your browser.</p><button class="live-start-button" type="button" data-open-live>${icon('mic')}<span>Start voice chat</span></button></section><section class="quick-actions"><div class="panel-heading"><h2>Quick Actions</h2><button type="button" aria-label="More quick actions" disabled>${icon('more')}</button></div><div class="quick-action-grid"><button type="button" data-prompt="Write polished content for me"><span class="tool-icon">${icon('copy')}</span><span>Writing</span></button><button type="button" data-prompt="Generate clean code for this task"><span class="tool-icon">${icon('copy')}</span><span>Code</span></button><button type="button" data-prompt="Give me five creative ideas"><span class="tool-icon">${icon('plus')}</span><span>Ideas</span></button><button type="button" data-prompt="Create a short quiz with answers about this topic"><span class="tool-icon">${icon('search')}</span><span>Quiz</span></button></div></section><section class="recent-tools"><div class="panel-heading"><h2>Recent Chats</h2><button id="clearRecentButton" type="button">Clear all</button></div><div id="recentToolsList"></div></section></aside></div>
        <section class="chat-composer-wrap"><div class="attachment-preview" id="attachmentPreview" hidden></div><div class="talk-live-banner" id="liveBanner" hidden><span class="pulse-dot"></span><span>Voice listening…</span><button id="stopLiveButton" type="button">Stop</button></div><form class="chat-composer" id="chatForm"><input id="fileInput" type="file" hidden multiple accept="image/*,.txt,.md,.pdf"><button class="composer-button" id="attachButton" type="button" aria-label="Attach a file">${icon('paperclip')}</button><textarea id="chatInput" rows="1" maxlength="6000" placeholder="Ask anything…" aria-label="Message TODO AI"></textarea><button class="composer-button mic-button" id="micButton" type="button" aria-label="Use microphone">${icon('mic')}</button><button class="talk-live-button" id="liveButton" type="button">${icon('volume')}<span>Voice</span></button><button class="send-button" id="sendButton" type="submit" aria-label="Send message">${icon('send')}</button></form><p class="composer-note">AI can make mistakes. Check important information. Attachments are not supported yet.</p></section>
        <nav class="chat-bottom-nav" aria-label="Chat navigation"><button class="active" type="button" data-nav="chat">${icon('send')}<span>Chat</span></button><button type="button" data-nav="history">${icon('search')}<span>History</span></button><button type="button" data-nav="tools">${icon('plus')}<span>Tools</span></button><button type="button" data-nav="settings">${icon('more')}<span>Settings</span></button></nav>
        <aside class="history-drawer" id="historyDrawer" aria-hidden="true"><div class="drawer-brand"><span class="chat-brand-mark">T</span><div><strong>TODO AI</strong><small>Think. Ask. Create.</small></div><button class="chat-icon-button drawer-menu-button" type="button" aria-label="Toggle navigation">${icon('menu')}</button></div><nav class="drawer-nav" aria-label="Assistant navigation"><button class="active" type="button" data-drawer-action="chat">${icon('send')}<span>Chat</span></button><button type="button" data-drawer-action="voice">${icon('mic')}<span>Voice Chat</span></button><button type="button" data-drawer-action="create">${icon('plus')}<span>Create</span></button><button type="button" data-drawer-action="history">${icon('search')}<span>History</span></button><button type="button" data-drawer-action="settings">${icon('more')}<span>Settings</span></button></nav><div class="drawer-head"><strong>Recent conversations</strong><button class="chat-icon-button" id="closeHistoryButton" type="button" aria-label="Close history">${icon('close')}</button></div><button class="new-chat-button" id="newChatButton" type="button">${icon('plus')}<span>New conversation</span></button><label class="history-search"><span aria-hidden="true">${icon('search')}</span><input id="historySearch" type="search" placeholder="Search chats" aria-label="Search chat history"></label><div id="historyList"></div><div class="premium-promo"><span>TODO AI Pro</span><strong>Unlock your creative flow</strong><button type="button" disabled>Explore plan</button></div><div class="drawer-footer"><button type="button" id="drawerThemeButton">Dark mode</button><span>TODO AI v1.0</span></div></aside>
        <div class="drawer-backdrop" id="drawerBackdrop" hidden></div>
      </main>`;
    const promo = page.querySelector('.premium-promo');
    if (promo) promo.innerHTML = '<span>ON THIS DEVICE</span><strong>Your chats stay in this browser</strong><small>History is local and is not synced to an account.</small>';
    page.querySelector('.drawer-menu-button')?.remove();
    page.querySelectorAll('.chat-brand-mark').forEach((mark) => {
      mark.innerHTML = '<img src="assets/icons/logo.svg" alt="" aria-hidden="true">';
    });
    wire();
  }
  function wire() {
    document.querySelector('#historyButton').onclick = openHistory;
    document.querySelector('#closeHistoryButton').onclick = closeHistory;
    document.querySelector('#drawerBackdrop').onclick = closeHistory;
    document.querySelector('#newChatButton').onclick = () => { createSession(); closeHistory(); };
    document.querySelector('#headerNewChat').onclick = createSession;
    document.querySelector('#themeButton').onclick = toggleTheme;
    document.querySelector('#historySearch').addEventListener('input', renderHistory);
    document.querySelector('#drawerThemeButton').onclick = toggleTheme;
    document.querySelectorAll('[data-drawer-action]').forEach((button) => button.onclick = () => {
      const action = button.dataset.drawerAction;
      if (action === 'voice') document.querySelector('#liveButton').click();
      if (action === 'create') { closeHistory(); document.querySelector('#chatInput').focus(); }
      if (action === 'settings') location.href = 'settings.html';
      if (action === 'history') document.querySelector('#historySearch').focus();
      if (action === 'chat') closeHistory();
    });
    document.querySelectorAll('[data-open-live]').forEach((button) => button.onclick = () => document.querySelector('#liveButton').click());
    document.querySelectorAll('.quick-action-grid [data-prompt]').forEach((button) => button.onclick = () => {
      document.querySelector('#toolsPanel').classList.remove('open');
      document.querySelector('#chatInput').value = button.dataset.prompt;
      autoSize();
      document.querySelector('#chatInput').focus();
    });
    document.querySelectorAll('.tools-rail [data-prompt]').forEach((button) => button.onclick = () => {
      document.querySelector('#chatInput').value = button.dataset.prompt;
      autoSize();
      document.querySelector('#chatInput').focus();
    });
    document.querySelector('#clearRecentButton').onclick = () => {
      if (state.controller) { toast('Stop the current response before clearing history.'); return; }
      if (!window.confirm('Delete all saved conversations from this browser? This cannot be undone.')) return;
      state.sessions = [];
      state.sessionId = null;
      state.messages = [];
      write(key, []);
      createSession();
    };
    document.querySelector('#chatForm').onsubmit = (event) => { event.preventDefault(); send(); };
    document.querySelector('#chatInput').addEventListener('input', autoSize);
    document.querySelector('#chatInput').addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } });
    document.querySelector('#attachButton').onclick = () => toast('File and image analysis is not available yet. No file was uploaded.');
    document.querySelector('#fileInput').onchange = handleFiles;
    document.querySelector('#micButton').onclick = toggleRecognition;
    document.querySelector('#liveButton').onclick = toggleLive;
    document.querySelector('#stopLiveButton').onclick = stopLive;
    document.querySelector('#jumpButton').onclick = () => scrollToBottom(true);
    document.querySelectorAll('[data-nav="chat"]').forEach((button) => button.onclick = () => document.querySelector('#chatInput').focus());
    document.querySelectorAll('[data-nav="history"]').forEach((button) => button.onclick = openHistory);
    document.querySelectorAll('[data-nav="tools"]').forEach((button) => button.onclick = () => document.querySelector('#toolsPanel').classList.toggle('open'));
    document.querySelectorAll('[data-nav="settings"]').forEach((button) => button.onclick = () => { location.href = 'settings.html'; });
    document.querySelector('#chatScroll').addEventListener('scroll', () => {
      const box = document.querySelector('#chatScroll');
      state.nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
      document.querySelector('#jumpButton').hidden = state.nearBottom;
    });
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    document.querySelector('#chatMessages').addEventListener('click', handleMessageAction);
    updateConnection();
  }
  function renderMessages() {
    const box = document.querySelector('#chatMessages');
    if (!box) return;
    if (!state.messages.length) {
      box.innerHTML = `<div class="welcome-state"><div class="welcome-orb">T</div><p class="eyebrow">YOUR EVERYDAY AI</p><h1>Hello, Saksham <span>👋</span></h1><p class="welcome-copy">What would you like to create today? Ask in Hindi, English, or Hinglish.</p><div class="suggestions"><button type="button" data-prompt="Mere liye aaj ka simple productivity plan banao">Plan my day</button><button type="button" data-prompt="Is concept ko simple Hindi mein samjhao">Explain a concept</button><button type="button" data-prompt="Ek professional email draft karo">Write an email</button></div></div>`;
      box.querySelectorAll('[data-prompt]').forEach((button) => button.onclick = () => { document.querySelector('#chatInput').value = button.dataset.prompt; autoSize(); document.querySelector('#chatInput').focus(); });
    } else {
      box.innerHTML = state.messages.map((message, index) => `<article class="message-row ${message.role === 'user' ? 'user-message' : 'assistant-message'}" data-index="${index}"><div class="message-avatar">${message.role === 'user' ? 'You' : 'T'}</div><div class="message-column"><div class="message-bubble">${message.pending ? '<span class="typing-indicator" aria-label="TODO AI is typing"><i></i><i></i><i></i></span>' : message.role === 'assistant' ? markdown(message.text) : escapeHtml(message.text).replace(/\n/g, '<br>')}</div>${message.pending ? '<div class="message-status">TODO AI is thinking…</div>' : `<div class="message-actions"><span>${message.role === 'assistant' ? 'TODO AI' : 'You'}</span>${message.role === 'assistant' ? `<button type="button" data-action="speak" aria-label="Read response aloud">${icon('volume')}</button>${message.error ? '<button type="button" data-action="retry">Retry</button>' : ''}` : ''}<button type="button" data-action="copy" aria-label="Copy response">${icon('copy')}</button></div>`}</div></article>`).join('');
      scrollToBottom(false);
    }
  }
  function renderHistory() {
    const list = document.querySelector('#historyList');
    if (!list) return;
    const query = document.querySelector('#historySearch')?.value.trim().toLowerCase() || '';
    const sessions = state.sessions.filter((session) => !query || `${session.title} ${session.messages.map((message) => message.text).join(' ')}`.toLowerCase().includes(query));
    list.innerHTML = sessions.length ? sessions.map((session) => `<div class="history-item-wrap"><button type="button" class="history-item ${session.id === state.sessionId ? 'active' : ''}" data-session="${session.id}"><span>${escapeHtml(session.title)}</span><small>${new Date(session.updatedAt).toLocaleDateString()}</small></button><span class="history-item-actions"><button type="button" data-rename="${session.id}" aria-label="Rename ${escapeHtml(session.title)}">Rename</button><button type="button" data-delete="${session.id}" aria-label="Delete ${escapeHtml(session.title)}">Delete</button><button type="button" data-export="${session.id}" aria-label="Export ${escapeHtml(session.title)}">Export</button></span></div>`).join('') : '<p class="empty-history">No matching conversations.</p>';
    list.querySelectorAll('[data-session]').forEach((button) => button.onclick = () => selectSession(button.dataset.session));
    list.querySelectorAll('[data-rename]').forEach((button) => button.onclick = () => renameSession(button.dataset.rename));
    list.querySelectorAll('[data-delete]').forEach((button) => button.onclick = () => deleteSession(button.dataset.delete));
    list.querySelectorAll('[data-export]').forEach((button) => button.onclick = () => exportSession(button.dataset.export));
    const recent = document.querySelector('#recentToolsList');
    if (recent) {
      recent.innerHTML = state.sessions.slice(0, 3).map((session) => `<button type="button" class="tool-recent-item" data-session="${session.id}"><span>${escapeHtml(session.title)}</span><small>${new Date(session.updatedAt).toLocaleDateString()}</small></button>`).join('') || '<p class="empty-history">No recent chats yet.</p>';
      recent.querySelectorAll('[data-session]').forEach((button) => button.onclick = () => selectSession(button.dataset.session));
    }
  }
  function renameSession(id) {
    if (state.controller) { toast('Stop the current response before editing history.'); return; }
    const session = state.sessions.find((item) => item.id === id);
    if (!session) return;
    const title = window.prompt('Conversation name:', session.title);
    if (title === null || !title.trim()) return;
    session.title = title.trim().slice(0, 80);
    write(key, state.sessions);
    renderHistory();
  }
  function deleteSession(id) {
    if (state.controller) { toast('Stop the current response before editing history.'); return; }
    const session = state.sessions.find((item) => item.id === id);
    if (!session || !window.confirm(`Delete “${session.title}” from this browser?`)) return;
    state.sessions = state.sessions.filter((item) => item.id !== id);
    if (state.sessionId === id) {
      state.sessionId = null;
      state.messages = [];
      if (state.sessions.length) selectSession(state.sessions[0].id);
      else createSession();
    }
    write(key, state.sessions);
    renderHistory();
  }
  function exportSession(id) {
    const session = state.sessions.find((item) => item.id === id);
    if (!session) return;
    const format = window.prompt('Export format: type md or txt', 'md');
    if (!format || !['md', 'txt'].includes(format.trim().toLowerCase())) return;
    const markdownText = `# ${session.title}\n\n${session.messages.map((message) => `## ${message.role === 'user' ? 'You' : 'TODO AI'}\n\n${message.text}`).join('\n\n---\n\n')}`;
    const extension = format.trim().toLowerCase();
    const content = extension === 'txt' ? `${session.title}\n\n${session.messages.map((message) => `${message.role === 'user' ? 'You' : 'TODO AI'}:\n${message.text}`).join('\n\n')}` : markdownText;
    const url = URL.createObjectURL(new Blob([content], { type: extension === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${session.title.replace(/[^\p{L}\p{N}-]+/gu, '-').slice(0, 60) || 'conversation'}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }
  function openHistory() { document.querySelector('#historyDrawer').setAttribute('aria-hidden', 'false'); document.querySelector('#drawerBackdrop').hidden = false; document.querySelector('#historyButton').setAttribute('aria-expanded', 'true'); }
  function closeHistory() { document.querySelector('#historyDrawer').setAttribute('aria-hidden', 'true'); document.querySelector('#drawerBackdrop').hidden = true; document.querySelector('#historyButton').setAttribute('aria-expanded', 'false'); }
  function autoSize() { const input = document.querySelector('#chatInput'); input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 140)}px`; }
  function scrollToBottom(force) { const box = document.querySelector('#chatScroll'); if (force || state.nearBottom) requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; }); }
  function updateConnection() { const online = navigator.onLine; document.querySelector('#connectionStatus').classList.toggle('offline', !online); document.querySelector('#connectionStatus span').textContent = online ? 'Internet connected' : 'Offline'; }
  function toggleTheme() { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; const stored = read('todo_settings', {}); const preferences = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}; preferences.theme = next; write('todo_settings', preferences); document.querySelector('#themeButton').innerHTML = icon(next === 'dark' ? 'sun' : 'moon'); document.querySelector('#themeButton').setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} mode`); document.querySelector('#drawerThemeButton').textContent = next === 'dark' ? 'Light mode' : 'Dark mode'; document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#11151d' : '#6c5ce7'); }
  function handleFiles(event) { const files = Array.from(event.target.files || []).slice(0, 4); const preview = document.querySelector('#attachmentPreview'); preview.hidden = !files.length; preview.innerHTML = files.map((file) => `<span>${escapeHtml(file.name)} <button type="button" data-remove-file="${escapeHtml(file.name)}" aria-label="Remove ${escapeHtml(file.name)}">${icon('close')}</button></span>`).join(''); preview.querySelectorAll('[data-remove-file]').forEach((button) => button.onclick = () => { event.target.value = ''; preview.hidden = true; preview.innerHTML = ''; }); }
  async function send() {
    if (state.controller) { state.controller.abort(); return; }
    const input = document.querySelector('#chatInput');
    const prompt = input.value.trim();
    if (!prompt || !navigator.onLine) { if (!navigator.onLine) toast('You are offline. Reconnect to send a message.'); return; }
    if (!state.sessionId) createSession();
    state.messages.push({ role: 'user', text: prompt, id: makeId() });
    const session = activeSession();
    if (session && session.title === 'New conversation') session.title = prompt.slice(0, 42);
    input.value = ''; autoSize(); renderMessages(); renderHistory(); persist(); setGenerating(true);
    const assistant = { role: 'assistant', text: '', id: makeId(), pending: true, prompt };
    state.messages.push(assistant); renderMessages();
    state.controller = new AbortController();
    try {
      const response = await fetch(`${location.hostname.endsWith('github.io') ? 'https://lagma-village-ai.onrender.com' : ''}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' }, body: JSON.stringify({ messages: state.messages.filter((item) => !item.pending).slice(-20).map(({ role, text }) => ({ role, text })) }), signal: state.controller.signal });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'AI response unavailable.');
      }
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamComplete = false;
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() || '';
          for (const event of events) {
            const line = event.split(/\r?\n/).find((item) => item.startsWith('data:'));
            if (!line) continue;
            let data;
            try {
              data = JSON.parse(line.slice(5).trim());
            } catch { /* Ignore malformed stream events. */ }
            if (!data) continue;
            if (data.error) throw new Error(data.error);
            if (data.text) { assistant.text += data.text; assistant.pending = false; renderMessages(); persist(); }
            if (data.done === true) streamComplete = true;
          }
          if (done) break;
        }
        if (!assistant.text || !streamComplete) throw new Error('The response ended unexpectedly. Please retry.');
      } else {
        const data = await response.json();
        assistant.text = data.reply || '';
        if (!assistant.text) throw new Error('The AI returned an empty response. Please retry.');
      }
      if ((state.liveMode || settings.autoSpeak) && assistant.text) speak(assistant.text);
    } catch (error) {
      if (error.name !== 'AbortError') {
        assistant.text = error.message.includes('GEMINI_API_KEY')
          ? 'AI service is not configured on this local server yet.\n\nAdd `GEMINI_API_KEY` to a local `.env` file, restart the server, and try again. Your key stays server-side and is never sent to the browser.'
          : `Sorry, ${error.message}`;
        assistant.error = true;
      }
      else if (assistant.text) {
        assistant.text += '\n\n(Generation stopped.)';
        assistant.error = true;
      } else state.messages = state.messages.filter((message) => message !== assistant);
    } finally {
      assistant.pending = false; state.controller = null; setGenerating(false); persist(); renderMessages();
    }
  }
  function setGenerating(active) { const button = document.querySelector('#sendButton'); button.classList.toggle('stop', active); button.innerHTML = icon(active ? 'stop' : 'send'); button.setAttribute('aria-label', active ? 'Stop generating' : 'Send message'); }
  function handleMessageAction(event) {
    const copyCode = event.target.closest('[data-copy-code]');
    if (copyCode) { navigator.clipboard?.writeText(decodeURIComponent(copyCode.dataset.copyCode)); copyCode.textContent = 'Copied'; return; }
    const button = event.target.closest('[data-action]'); if (!button) return;
    const row = button.closest('.message-row'); const message = state.messages[Number(row.dataset.index)];
    if (button.dataset.action === 'retry') {
      const prompt = message.prompt;
      const index = state.messages.indexOf(message);
      if (index > 0) state.messages.splice(index - 1, 2);
      persist(); renderMessages();
      document.querySelector('#chatInput').value = prompt || '';
      autoSize();
      send();
      return;
    }
    if (button.dataset.action === 'copy') { navigator.clipboard?.writeText(message.text); button.textContent = 'Copied'; }
    if (button.dataset.action === 'speak') speak(message.text);
  }
  function speechCtor() { return window.SpeechRecognition || window.webkitSpeechRecognition; }
  function toggleRecognition() {
    const Recognition = speechCtor();
    if (!Recognition) { toast('Voice input is not supported in this browser.'); return; }
    if (state.listening) { state.recognition.stop(); return; }
    const input = document.querySelector('#chatInput'); state.recognition = new Recognition(); state.recognition.lang = settings.language; state.recognition.interimResults = true; state.recognition.continuous = false; state.listening = true; document.querySelector('#micButton').classList.add('active');
    state.recognition.onresult = (event) => { input.value = Array.from(event.results).map((result) => result[0].transcript).join(''); autoSize(); };
    state.recognition.onerror = (event) => { toast(event.error === 'not-allowed' ? 'Microphone permission was denied.' : 'Voice input failed. Try again.'); stopRecognition(); };
    state.recognition.onend = () => {
      const shouldSend = state.liveMode && input.value.trim();
      stopRecognition();
      if (shouldSend) send();
    };
    state.recognition.start();
  }
  function stopRecognition() { state.listening = false; document.querySelector('#micButton')?.classList.remove('active'); }
  function toggleLive() { if (state.liveMode) stopLive(); else { if (!speechCtor() || !('speechSynthesis' in window)) { toast('Talk Live needs Web Speech support.'); return; } state.liveMode = true; document.querySelector('#liveBanner').hidden = false; toggleRecognition(); } }
  function stopLive() { state.liveMode = false; stopRecognition(); speechSynthesis.cancel(); document.querySelector('#liveBanner').hidden = true; }
  function speak(text) { if (!('speechSynthesis' in window)) { toast('Text-to-speech is not supported here.'); return; } speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = settings.language; utterance.rate = settings.rate; speechSynthesis.speak(utterance); }
  function toast(message) { const node = document.querySelector('#toast') || Object.assign(document.body.appendChild(document.createElement('div')), { id: 'toast' }); node.textContent = message; node.className = 'toast show'; setTimeout(() => node.classList.remove('show'), 2600); }
  function init() {
    state.sessionId = state.sessions[0]?.id || null;
    state.messages = activeSession()?.messages?.slice() || [];
    build(); renderMessages(); renderHistory();
    if (!state.sessionId) createSession();
    const dark = document.documentElement.dataset.theme === 'dark';
    document.querySelector('#themeButton').innerHTML = icon(dark ? 'sun' : 'moon');
    document.querySelector('#themeButton').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
    document.querySelector('#drawerThemeButton').textContent = dark ? 'Light mode' : 'Dark mode';
  }
  init();
})();
