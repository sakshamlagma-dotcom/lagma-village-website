(() => {
  'use strict';

  if (document.body.dataset.page !== 'service-detail' || new URLSearchParams(location.search).get('id') !== 'chat') return;

  const key = 'todo_chat_sessions_v2';
  const settingsKey = 'todo_voice_settings_v2';
  const state = {
    sessions: read(key, []),
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
    const session = { id: makeId(), title: 'New conversation', updatedAt: Date.now(), messages: [] };
    state.sessions.unshift(session);
    state.sessionId = session.id;
    state.messages = [];
    persist();
    renderMessages();
    renderHistory();
  }
  function selectSession(id) {
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
          <div class="chat-header-actions"><span class="connection-status" id="connectionStatus"><i></i><span>Online</span></span><button class="chat-icon-button" id="themeButton" type="button" aria-label="Toggle theme">${icon('moon')}</button><button class="chat-icon-button header-new-chat" id="headerNewChat" type="button" aria-label="Start a new chat">${icon('plus')}</button><button class="chat-profile" type="button" aria-label="Profile">TU</button></div>
        </header>
        <div class="chat-workspace"><aside class="tools-rail" aria-label="Chat tools"><button class="rail-action active" type="button">${icon('send')}<span>Chat</span></button><button class="rail-action" type="button">${icon('copy')}<span>Write</span></button><button class="rail-action" type="button">${icon('search')}<span>Study</span></button><button class="rail-action" type="button">${icon('plus')}<span>Ideas</span></button><button class="rail-action" type="button">${icon('volume')}<span>Translate</span></button></aside><section class="chat-scroll" id="chatScroll" aria-live="polite"><div class="chat-content" id="chatMessages"></div><button class="jump-button" id="jumpButton" type="button">${icon('arrowDown')}<span>New messages</span></button></section><aside class="tools-panel" id="toolsPanel" aria-label="Assistant tools"><section class="live-card"><span class="tool-kicker">VOICE ASSISTANT</span><h2>Talk Live</h2><p>Have a natural conversation with TODO AI.</p><button class="live-start-button" type="button" data-open-live>${icon('mic')}<span>Start voice chat</span></button></section><section class="quick-actions"><div class="panel-heading"><h2>Quick Actions</h2><button type="button" aria-label="More quick actions" disabled>${icon('more')}</button></div><div class="quick-action-grid"><button type="button" data-prompt="Create an image prompt for me"><span class="tool-icon">${icon('plus')}</span><span>Create Image</span></button><button type="button" data-prompt="Generate clean code for this task"><span class="tool-icon">${icon('copy')}</span><span>Generate Code</span></button><button type="button" data-prompt="Write polished content for me"><span class="tool-icon">${icon('copy')}</span><span>Write Content</span></button><button type="button" data-prompt="Give me five creative ideas"><span class="tool-icon">${icon('plus')}</span><span>Get Ideas</span></button></div></section><section class="recent-tools"><div class="panel-heading"><h2>Recent Chats</h2><button id="clearRecentButton" type="button">Clear all</button></div><div id="recentToolsList"></div></section></aside></div>
        <section class="chat-composer-wrap"><div class="attachment-preview" id="attachmentPreview" hidden></div><div class="talk-live-banner" id="liveBanner" hidden><span class="pulse-dot"></span><span>Talk Live is listening…</span><button id="stopLiveButton" type="button">Stop</button></div><form class="chat-composer" id="chatForm"><input id="fileInput" type="file" hidden multiple accept="image/*,.txt,.md,.pdf"><button class="composer-button" id="attachButton" type="button" aria-label="Attach a file">${icon('paperclip')}</button><textarea id="chatInput" rows="1" maxlength="6000" placeholder="Ask anything…" aria-label="Message TODO AI"></textarea><button class="composer-button mic-button" id="micButton" type="button" aria-label="Use microphone">${icon('mic')}</button><button class="talk-live-button" id="liveButton" type="button">${icon('volume')}<span>Talk Live</span></button><button class="send-button" id="sendButton" type="submit" aria-label="Send message">${icon('send')}</button></form><p class="composer-note">AI can make mistakes. Check important information.</p></section>
        <nav class="chat-bottom-nav" aria-label="Chat navigation"><button class="active" type="button" data-nav="chat">${icon('send')}<span>Chat</span></button><button type="button" data-nav="history">${icon('search')}<span>History</span></button><button type="button" data-nav="tools">${icon('plus')}<span>Tools</span></button><button type="button" data-nav="settings">${icon('more')}<span>Settings</span></button></nav>
        <aside class="history-drawer" id="historyDrawer" aria-hidden="true"><div class="drawer-brand"><span class="chat-brand-mark">T</span><div><strong>TODO AI</strong><small>Think. Ask. Create.</small></div><button class="chat-icon-button drawer-menu-button" type="button" aria-label="Toggle navigation">${icon('menu')}</button></div><nav class="drawer-nav" aria-label="Assistant navigation"><button class="active" type="button" data-drawer-action="chat">${icon('send')}<span>Chat</span></button><button type="button" data-drawer-action="voice">${icon('mic')}<span>Voice Chat</span></button><button type="button" data-drawer-action="create">${icon('plus')}<span>Create</span></button><button type="button" data-drawer-action="history">${icon('search')}<span>History</span></button><button type="button" data-drawer-action="settings">${icon('more')}<span>Settings</span></button></nav><div class="drawer-head"><strong>Recent conversations</strong><button class="chat-icon-button" id="closeHistoryButton" type="button" aria-label="Close history">${icon('close')}</button></div><button class="new-chat-button" id="newChatButton" type="button">${icon('plus')}<span>New conversation</span></button><label class="history-search"><span aria-hidden="true">${icon('search')}</span><input id="historySearch" type="search" placeholder="Search chats" aria-label="Search chat history"></label><div id="historyList"></div><div class="premium-promo"><span>TODO AI Pro</span><strong>Unlock your creative flow</strong><button type="button" disabled>Explore plan</button></div><div class="drawer-footer"><button type="button" id="drawerThemeButton">Dark mode</button><span>TODO AI v1.0</span></div></aside>
        <div class="drawer-backdrop" id="drawerBackdrop" hidden></div>
      </main>`;
    wire();
  }
  function wire() {
    document.querySelector('#historyButton').onclick = openHistory;
    document.querySelector('#closeHistoryButton').onclick = closeHistory;
    document.querySelector('#drawerBackdrop').onclick = closeHistory;
    document.querySelector('#newChatButton').onclick = createSession;
    document.querySelector('#headerNewChat').onclick = createSession;
    document.querySelector('#themeButton').onclick = toggleTheme;
    document.querySelector('#historySearch').addEventListener('input', renderHistory);
    document.querySelector('#drawerThemeButton').onclick = toggleTheme;
    document.querySelectorAll('[data-drawer-action]').forEach((button) => button.onclick = () => {
      const action = button.dataset.drawerAction;
      if (action === 'voice') document.querySelector('#liveButton').click();
      if (action === 'create') document.querySelector('#chatInput').focus();
      if (action === 'settings') location.href = 'settings.html';
      if (action === 'history') document.querySelector('#historySearch').focus();
      if (action === 'chat') closeHistory();
    });
    document.querySelectorAll('[data-open-live]').forEach((button) => button.onclick = () => document.querySelector('#liveButton').click());
    document.querySelectorAll('.quick-action-grid [data-prompt]').forEach((button) => button.onclick = () => {
      document.querySelector('#chatInput').value = button.dataset.prompt;
      autoSize();
      document.querySelector('#chatInput').focus();
    });
    document.querySelector('#clearRecentButton').onclick = () => {
      state.sessions = [];
      state.sessionId = null;
      state.messages = [];
      write(key, []);
      createSession();
    };
    document.querySelector('#chatForm').onsubmit = (event) => { event.preventDefault(); send(); };
    document.querySelector('#chatInput').addEventListener('input', autoSize);
    document.querySelector('#chatInput').addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } });
    document.querySelector('#attachButton').onclick = () => document.querySelector('#fileInput').click();
    document.querySelector('#fileInput').onchange = handleFiles;
    document.querySelector('#micButton').onclick = toggleRecognition;
    document.querySelector('#liveButton').onclick = toggleLive;
    document.querySelector('#stopLiveButton').onclick = stopLive;
    document.querySelector('#jumpButton').onclick = () => scrollToBottom(true);
    document.querySelectorAll('[data-nav="history"]').forEach((button) => button.onclick = openHistory);
    document.querySelectorAll('[data-nav="tools"]').forEach((button) => button.onclick = () => document.querySelector('.tools-rail').classList.toggle('open'));
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
      box.innerHTML = state.messages.map((message, index) => `<article class="message-row ${message.role === 'user' ? 'user-message' : 'assistant-message'}" data-index="${index}"><div class="message-avatar">${message.role === 'user' ? 'You' : 'T'}</div><div class="message-column"><div class="message-bubble">${message.pending ? '<span class="typing-indicator" aria-label="TODO AI is typing"><i></i><i></i><i></i></span>' : message.role === 'assistant' ? markdown(message.text) : escapeHtml(message.text).replace(/\n/g, '<br>')}</div>${message.pending ? '<div class="message-status">TODO AI is thinking…</div>' : `<div class="message-actions"><span>${message.role === 'assistant' ? 'TODO AI' : 'You'}</span>${message.role === 'assistant' ? `<button type="button" data-action="speak" aria-label="Read response aloud">${icon('volume')}</button>` : ''}<button type="button" data-action="copy" aria-label="Copy response">${icon('copy')}</button></div>`}</div></article>`).join('');
      scrollToBottom(false);
    }
  }
  function renderHistory() {
    const list = document.querySelector('#historyList');
    if (!list) return;
    const query = document.querySelector('#historySearch')?.value.trim().toLowerCase() || '';
    const sessions = state.sessions.filter((session) => !query || session.title.toLowerCase().includes(query));
    list.innerHTML = sessions.length ? sessions.map((session) => `<button type="button" class="history-item ${session.id === state.sessionId ? 'active' : ''}" data-session="${session.id}"><span>${escapeHtml(session.title)}</span><small>${new Date(session.updatedAt).toLocaleDateString()}</small></button>`).join('') : '<p class="empty-history">No matching conversations.</p>';
    list.querySelectorAll('[data-session]').forEach((button) => button.onclick = () => selectSession(button.dataset.session));
    const recent = document.querySelector('#recentToolsList');
    if (recent) {
      recent.innerHTML = state.sessions.slice(0, 3).map((session) => `<button type="button" class="tool-recent-item" data-session="${session.id}"><span>${escapeHtml(session.title)}</span><small>${new Date(session.updatedAt).toLocaleDateString()}</small></button>`).join('') || '<p class="empty-history">No recent chats yet.</p>';
      recent.querySelectorAll('[data-session]').forEach((button) => button.onclick = () => selectSession(button.dataset.session));
    }
  }
  function openHistory() { document.querySelector('#historyDrawer').setAttribute('aria-hidden', 'false'); document.querySelector('#drawerBackdrop').hidden = false; document.querySelector('#historyButton').setAttribute('aria-expanded', 'true'); }
  function closeHistory() { document.querySelector('#historyDrawer').setAttribute('aria-hidden', 'true'); document.querySelector('#drawerBackdrop').hidden = true; document.querySelector('#historyButton').setAttribute('aria-expanded', 'false'); }
  function autoSize() { const input = document.querySelector('#chatInput'); input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 140)}px`; }
  function scrollToBottom(force) { const box = document.querySelector('#chatScroll'); if (force || state.nearBottom) requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; }); }
  function updateConnection() { const online = navigator.onLine; document.querySelector('#connectionStatus').classList.toggle('offline', !online); document.querySelector('#connectionStatus span').textContent = online ? 'Online' : 'Offline'; }
  function toggleTheme() { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; write('todo_theme', next); document.querySelector('#themeButton').innerHTML = icon(next === 'dark' ? 'sun' : 'moon'); }
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
    input.value = ''; autoSize(); renderMessages(); persist(); setGenerating(true);
    const assistant = { role: 'assistant', text: '', id: makeId(), pending: true };
    state.messages.push(assistant); renderMessages();
    state.controller = new AbortController();
    try {
      const response = await fetch(`${location.hostname.endsWith('github.io') ? 'https://lagma-village-ai.onrender.com' : ''}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: state.messages.filter((item) => !item.pending).slice(-20).map(({ role, text }) => ({ role, text })) }), signal: state.controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'AI response unavailable.');
      await animateReply(assistant, data.reply || 'I could not generate a response.');
      if ((state.liveMode || settings.autoSpeak) && assistant.text) speak(assistant.text);
    } catch (error) {
      if (error.name !== 'AbortError') {
        assistant.text = error.message.includes('GEMINI_API_KEY')
          ? 'AI service is not configured on this local server yet.\n\nAdd `GEMINI_API_KEY` to a local `.env` file, restart the server, and try again. Your key stays server-side and is never sent to the browser.'
          : `Sorry, ${error.message}`;
        assistant.error = true;
      }
      else state.messages = state.messages.filter((message) => message !== assistant);
    } finally {
      assistant.pending = false; state.controller = null; setGenerating(false); persist(); renderMessages();
    }
  }
  function animateReply(message, text) {
    return new Promise((resolve) => {
      const chunks = String(text).match(/\S+\s*/g) || ['']; let index = 0;
      const tick = () => { message.text += chunks[index++]; renderMessages(); if (index < chunks.length) setTimeout(tick, 28); else resolve(); };
      tick();
    });
  }
  function setGenerating(active) { const button = document.querySelector('#sendButton'); button.classList.toggle('stop', active); button.innerHTML = icon(active ? 'stop' : 'send'); button.setAttribute('aria-label', active ? 'Stop generating' : 'Send message'); }
  function handleMessageAction(event) {
    const copyCode = event.target.closest('[data-copy-code]');
    if (copyCode) { navigator.clipboard?.writeText(decodeURIComponent(copyCode.dataset.copyCode)); copyCode.textContent = 'Copied'; return; }
    const button = event.target.closest('[data-action]'); if (!button) return;
    const row = button.closest('.message-row'); const message = state.messages[Number(row.dataset.index)];
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
    document.querySelector('#themeButton').innerHTML = icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon');
  }
  init();
})();
