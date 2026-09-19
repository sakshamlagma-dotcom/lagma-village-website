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
          <button class="chat-icon-button mobile-history-button" id="historyButton" type="button" aria-label="Open chat history" aria-expanded="false"><span aria-hidden="true">☰</span></button>
          <div class="chat-brand"><span class="chat-brand-mark">T</span><div><strong>TODO AI</strong><span><i class="brand-status"></i> Think. Ask. Create.</span></div></div>
          <div class="chat-header-actions"><span class="connection-status" id="connectionStatus"><i></i><span>Online</span></span><button class="chat-icon-button" id="themeButton" type="button" aria-label="Toggle theme"><span aria-hidden="true">☾</span></button><button class="chat-icon-button header-new-chat" id="headerNewChat" type="button" aria-label="Start a new chat"><span aria-hidden="true">＋</span></button><button class="chat-profile" type="button" aria-label="Profile">TU</button></div>
        </header>
        <div class="chat-workspace"><aside class="tools-rail" aria-label="Chat tools"><button class="rail-action active" type="button">Chat</button><button class="rail-action" type="button">Write</button><button class="rail-action" type="button">Study</button><button class="rail-action" type="button">Ideas</button><button class="rail-action" type="button">Translate</button></aside><section class="chat-scroll" id="chatScroll" aria-live="polite"><div class="chat-content" id="chatMessages"></div><button class="jump-button" id="jumpButton" type="button">↓ New messages</button></section></div>
        <section class="chat-composer-wrap"><div class="attachment-preview" id="attachmentPreview" hidden></div><div class="talk-live-banner" id="liveBanner" hidden><span class="pulse-dot"></span><span>Talk Live is listening…</span><button id="stopLiveButton" type="button">Stop</button></div><form class="chat-composer" id="chatForm"><input id="fileInput" type="file" hidden multiple accept="image/*,.txt,.md,.pdf"><button class="composer-button" id="attachButton" type="button" aria-label="Attach a file">＋</button><textarea id="chatInput" rows="1" maxlength="6000" placeholder="Ask anything…" aria-label="Message TODO AI"></textarea><button class="composer-button mic-button" id="micButton" type="button" aria-label="Use microphone">⌕</button><button class="talk-live-button" id="liveButton" type="button"><span>●</span><span>Talk Live</span></button><button class="send-button" id="sendButton" type="submit" aria-label="Send message">➤</button></form><p class="composer-note">AI can make mistakes. Check important information.</p></section>
        <nav class="chat-bottom-nav" aria-label="Chat navigation"><button class="active" type="button" data-nav="chat"><span>✦</span>Chat</button><button type="button" data-nav="history"><span>◷</span>History</button><button type="button" data-nav="tools"><span>⌘</span>Tools</button><button type="button" data-nav="settings"><span>⚙</span>Settings</button></nav>
        <aside class="history-drawer" id="historyDrawer" aria-hidden="true"><div class="drawer-brand"><span class="chat-brand-mark">T</span><div><strong>TODO AI</strong><small>Your everyday assistant</small></div></div><div class="drawer-head"><strong>Conversations</strong><button class="chat-icon-button" id="closeHistoryButton" type="button" aria-label="Close history">×</button></div><button class="new-chat-button" id="newChatButton" type="button">＋ New conversation</button><label class="history-search"><span aria-hidden="true">⌕</span><input id="historySearch" type="search" placeholder="Search chats" aria-label="Search chat history"></label><div id="historyList"></div><div class="drawer-footer"><button type="button">Settings</button><span>TODO AI v1</span></div></aside>
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
      box.innerHTML = `<div class="welcome-state"><div class="welcome-orb">✦</div><p class="eyebrow">YOUR EVERYDAY AI</p><h1>What can I help you<br><span>create today?</span></h1><p class="welcome-copy">Ask in Hindi, English, or Hinglish. Brainstorm, learn, write, or plan with TODO AI.</p><div class="suggestions"><button type="button" data-prompt="Mere liye aaj ka simple productivity plan banao">Plan my day</button><button type="button" data-prompt="Is concept ko simple Hindi mein samjhao">Explain a concept</button><button type="button" data-prompt="Ek professional email draft karo">Write an email</button></div></div>`;
      box.querySelectorAll('[data-prompt]').forEach((button) => button.onclick = () => { document.querySelector('#chatInput').value = button.dataset.prompt; autoSize(); document.querySelector('#chatInput').focus(); });
    } else {
      box.innerHTML = state.messages.map((message, index) => `<article class="message-row ${message.role === 'user' ? 'user-message' : 'assistant-message'}" data-index="${index}"><div class="message-avatar">${message.role === 'user' ? 'You' : 'T'}</div><div class="message-column"><div class="message-bubble">${message.pending ? '<span class="typing-indicator" aria-label="TODO AI is typing"><i></i><i></i><i></i></span>' : message.role === 'assistant' ? markdown(message.text) : escapeHtml(message.text).replace(/\n/g, '<br>')}</div>${message.pending ? '<div class="message-status">TODO AI is thinking…</div>' : `<div class="message-actions"><span>${message.role === 'assistant' ? 'TODO AI' : 'You'}</span>${message.role === 'assistant' ? `<button type="button" data-action="speak">Listen</button>` : ''}<button type="button" data-action="copy">Copy</button></div>`}</div></article>`).join('');
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
  }
  function openHistory() { document.querySelector('#historyDrawer').setAttribute('aria-hidden', 'false'); document.querySelector('#drawerBackdrop').hidden = false; document.querySelector('#historyButton').setAttribute('aria-expanded', 'true'); }
  function closeHistory() { document.querySelector('#historyDrawer').setAttribute('aria-hidden', 'true'); document.querySelector('#drawerBackdrop').hidden = true; document.querySelector('#historyButton').setAttribute('aria-expanded', 'false'); }
  function autoSize() { const input = document.querySelector('#chatInput'); input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 140)}px`; }
  function scrollToBottom(force) { const box = document.querySelector('#chatScroll'); if (force || state.nearBottom) requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; }); }
  function updateConnection() { const online = navigator.onLine; document.querySelector('#connectionStatus').classList.toggle('offline', !online); document.querySelector('#connectionStatus span').textContent = online ? 'Online' : 'Offline'; }
  function toggleTheme() { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; write('todo_theme', next); document.querySelector('#themeButton').textContent = next === 'dark' ? '☀' : '☾'; }
  function handleFiles(event) { const files = Array.from(event.target.files || []).slice(0, 4); document.querySelector('#attachmentPreview').hidden = !files.length; document.querySelector('#attachmentPreview').innerHTML = files.map((file) => `<span>${escapeHtml(file.name)} <button type="button" data-remove-file="${escapeHtml(file.name)}">×</button></span>`).join(''); }
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
  function setGenerating(active) { const button = document.querySelector('#sendButton'); button.classList.toggle('stop', active); button.textContent = active ? '■' : '➤'; button.setAttribute('aria-label', active ? 'Stop generating' : 'Send message'); }
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
    document.querySelector('#themeButton').textContent = document.documentElement.dataset.theme === 'dark' ? '☀' : '☾';
  }
  init();
})();
