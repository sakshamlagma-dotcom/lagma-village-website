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
    sparkles: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1 2.5 2.5 1-2.5 1L19 21l-1-2.5-2.5-1 2.5-1L19 14Z"/>',
    ideas: '<path d="M9 18h6m-5 4h4"/><path d="M8 14a7 7 0 1 1 8 0c-1 .7-1 2-1 2h-6s0-1.3-1-2Z"/>',
    code: '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-2-10-4 12"/>',
    writing: '<path d="m16 4 4 4-12 12H4v-4L16 4Z"/><path d="m14 6 4 4"/>',
    study: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  };
  const lucideNames = {
    menu: 'Menu',
    plus: 'Plus',
    search: 'Search',
    sun: 'Sun',
    moon: 'Moon',
    close: 'X',
    send: 'Send',
    stop: 'Square',
    mic: 'Mic',
    volume: 'Volume2',
    paperclip: 'Paperclip',
    copy: 'Copy',
    arrowDown: 'ArrowDown',
    more: 'Ellipsis',
    sparkles: 'Sparkles',
    ideas: 'Lightbulb',
    code: 'Code2',
    writing: 'PenLine',
    study: 'BookOpen',
  };
  function icon(name, label = '') {
    const definition = window.lucide?.icons?.[lucideNames[name]];
    if (definition) {
      const svg = window.lucide.createElement(definition);
      svg.classList.add('ui-icon');
      svg.setAttribute('aria-hidden', label ? 'false' : 'true');
      svg.setAttribute('focusable', 'false');
      if (label) {
        svg.setAttribute('role', 'img');
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = label;
        svg.prepend(title);
      }
      return svg.outerHTML;
    }

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
      if (lines.every((line) => /^\d+[.)]\s+/.test(line))) return `<ol>${lines.map((line) => `<li>${inlineMarkdown(line.replace(/^\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`;
      if (lines.every((line) => /^#{1,3}\s/.test(line))) return lines.map((line) => {
        const level = line.match(/^#+/)[0].length;
        return `<h${level}>${inlineMarkdown(line.replace(/^#+\s+/, ''))}</h${level}>`;
      }).join('');
      if (lines.every((line) => /^\s*>/.test(line))) return `<blockquote><p>${lines.map((line) => inlineMarkdown(line.replace(/^\s*>\s?/, ''))).join('<br>')}</p></blockquote>`;
      if (lines.length >= 2 && lines[0].includes('|') && /^\|?\s*:?-{3,}/.test(lines[1])) {
        const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
        const headers = cells(lines[0]);
        const rows = lines.slice(2).filter((line) => line.includes('|')).map(cells);
        return `<div class="table-scroll"><table><thead><tr>${headers.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((_, index) => `<td>${inlineMarkdown(row[index] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      }
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
    cancelGeneration();
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
    cancelGeneration();
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
          <a class="chat-brand" href="home.html" aria-label="TODO AI home"><span class="chat-brand-mark"><img src="assets/icons/dodo-mascot.svg" alt=""></span><span class="chat-brand-copy"><strong>TODO <em>AI</em></strong><small>Think. Ask. Create.</small></span></a>
          <div class="chat-header-actions"><span class="connection-status" id="connectionStatus" role="status"><i></i><span>Online</span></span><button class="chat-icon-button" id="themeButton" type="button" aria-label="Switch to dark theme" aria-pressed="false">${icon('moon')}</button><button class="chat-icon-button header-new-chat" id="headerNewChat" type="button" aria-label="Start a new chat">${icon('plus')}</button></div>
        </header>
        <div class="chat-workspace"><section class="chat-scroll" id="chatScroll" aria-label="Conversation"><div class="chat-content" id="chatMessages"></div><button class="jump-button" id="jumpButton" type="button" hidden>${icon('arrowDown')}<span>Jump to latest</span></button></section><aside class="tools-panel" id="toolsPanel" aria-label="Assistant tools"><section class="live-card"><span class="tool-kicker">VOICE ASSISTANT</span><h2>Talk naturally</h2><p>Speak with TODO AI using your device's microphone and voice support.</p><button class="live-start-button" type="button" data-open-live>${icon('mic')}<span>Start voice chat</span></button></section><section class="quick-actions"><div class="panel-heading"><h2>Try something</h2></div><div class="quick-action-grid"><button type="button" data-prompt="Teach me one useful idea in simple language, with a practical example."><span class="tool-icon">${icon('study')}</span><span>Learn something</span></button><button type="button" data-prompt="Give me five fresh creative project ideas, each with a short description."><span class="tool-icon">${icon('ideas')}</span><span>Generate ideas</span></button><button type="button" data-prompt="Write a warm, polished social media caption about Lagma Village."><span class="tool-icon">${icon('writing')}</span><span>Write a caption</span></button><button type="button" data-prompt="Create a detailed AI image prompt for a serene rural village in Bihar at golden hour."><span class="tool-icon">${icon('sparkles')}</span><span>Write an image prompt</span></button></div></section><section class="recent-tools"><div class="panel-heading"><h2>Recent chats</h2><button id="clearRecentButton" type="button">Clear all</button></div><div id="recentToolsList"></div></section></aside></div>
        <section class="chat-composer-wrap"><div class="talk-live-banner" id="liveBanner" hidden><span class="pulse-dot"></span><span>Talk Live is listening…</span><button id="stopLiveButton" type="button">Stop</button></div><form class="chat-composer" id="chatForm"><textarea id="chatInput" rows="1" maxlength="6000" placeholder="TODO AI se kuch bhi poochhein..." aria-label="Message TODO AI"></textarea><button class="composer-button mic-button" id="micButton" type="button" aria-label="Start voice input" title="Voice input">${icon('mic')}</button><button class="talk-live-button" id="liveButton" type="button">${icon('volume')}<span>Talk Live</span></button><button class="send-button" id="sendButton" type="submit" aria-label="Send message" title="Send message">${icon('send')}</button></form><p class="composer-note">Enter to send · Shift + Enter for a new line · AI can make mistakes</p></section>
        <aside class="history-drawer" id="historyDrawer" aria-label="Chat history" aria-hidden="true"><div class="drawer-brand"><span class="chat-brand-mark"><img src="assets/icons/dodo-mascot.svg" alt=""></span><div><strong>TODO <em>AI</em></strong><small>Your everyday assistant</small></div><button class="chat-icon-button" id="closeHistoryButton" type="button" aria-label="Close chat history">${icon('close')}</button></div><button class="new-chat-button" id="newChatButton" type="button">${icon('plus')}<span>New chat</span></button><label class="history-search"><span aria-hidden="true">${icon('search')}</span><input id="historySearch" type="search" placeholder="Search conversations" aria-label="Search chat history"></label><div id="historyList" aria-live="polite"></div><div class="drawer-footer"><button type="button" id="drawerThemeButton" aria-pressed="false">Switch theme</button><a href="settings.html">Settings</a></div></aside>
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
    document.querySelectorAll('[data-open-live]').forEach((button) => button.onclick = () => document.querySelector('#liveButton').click());
    document.querySelectorAll('.quick-action-grid [data-prompt]').forEach((button) => button.onclick = () => {
      closeHistory();
      send(button.dataset.prompt);
    });
    document.querySelector('#clearRecentButton').onclick = () => {
      if (!window.confirm('Clear all saved conversations from this device? This cannot be undone.')) return;
      cancelGeneration();
      state.sessions = [];
      state.sessionId = null;
      state.messages = [];
      write(key, []);
      createSession();
    };
    document.querySelector('#chatForm').onsubmit = (event) => { event.preventDefault(); send(); };
    document.querySelector('#chatInput').addEventListener('input', autoSize);
    document.querySelector('#chatInput').addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
        event.preventDefault();
        send();
      }
    });
    document.querySelector('#micButton').onclick = toggleRecognition;
    document.querySelector('#liveButton').onclick = toggleLive;
    document.querySelector('#stopLiveButton').onclick = stopLive;
    document.querySelector('#jumpButton').onclick = () => scrollToBottom(true);
    document.querySelector('#chatScroll').addEventListener('scroll', () => {
      const box = document.querySelector('#chatScroll');
      state.nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
      document.querySelector('#jumpButton').hidden = state.nearBottom;
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && document.querySelector('#historyDrawer').getAttribute('aria-hidden') === 'false') closeHistory();
    });
    window.addEventListener('resize', updateDrawerVisibility);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    document.querySelector('#chatMessages').addEventListener('click', handleMessageAction);
    updateConnection();
    updateDrawerVisibility();
  }
  function renderMessages() {
    const box = document.querySelector('#chatMessages');
    if (!box) return;
    if (!state.messages.length) {
      const suggestions = [
        ['sparkles', 'Kuch bhi poochhein', 'Explain photosynthesis in simple Hindi with an everyday example.'],
        ['ideas', 'Naya idea sochiye', 'Suggest five original ideas for a small community project in Lagma.'],
        ['study', 'Kuch naya seekhein', 'Teach me one fascinating science concept in simple language.'],
        ['code', 'Code likhein', 'Write a small, well-commented JavaScript function that formats a date.'],
        ['search', 'Kisi topic ko samjhein', 'Explain how monsoon seasons affect farming in Bihar.'],
        ['writing', 'Kuch creative banayein', 'Write a short, uplifting poem about village life in Hindi.'],
      ];
      box.innerHTML = `<div class="welcome-state"><div class="welcome-orb"><img src="assets/icons/dodo-mascot.svg" alt="Friendly TODO AI dodo mascot"></div><p class="eyebrow">YOUR EVERYDAY AI</p><h1>Namaste! Main <span>TODO AI hoon.</span></h1><p class="welcome-copy">Aapke sawaalon, ideas, learning aur creativity mein madad ke liye main yahan hoon.</p><div class="suggestions">${suggestions.map(([iconName, label, prompt]) => `<button type="button" data-prompt="${escapeHtml(prompt)}">${icon(iconName)}<span>${label}</span></button>`).join('')}</div></div>`;
      box.querySelectorAll('[data-prompt]').forEach((button) => button.onclick = () => send(button.dataset.prompt));
    } else {
      box.innerHTML = state.messages.map((message, index) => {
        const isUser = message.role === 'user';
        const body = isUser ? escapeHtml(message.text).replace(/\n/g, '<br>') : markdown(message.text);
        const typing = message.pending && !message.text
          ? '<span class="typing-indicator" aria-label="TODO AI is preparing a response"><i></i><i></i><i></i></span>'
          : '';
        const footer = message.pending
          ? `<div class="message-status" role="status">${message.text ? 'TODO AI is responding…' : 'TODO AI is thinking…'}</div>`
          : `<div class="message-actions"><span>${isUser ? 'You' : 'TODO AI'}</span>${isUser ? '' : `<button type="button" data-action="speak" aria-label="Read response aloud" title="Read aloud">${icon('volume')}</button>`}<button type="button" data-action="copy" aria-label="Copy message" title="Copy message">${icon('copy')}</button></div>${message.notice ? `<p class="message-status message-notice" role="status">${escapeHtml(message.notice)}</p>` : ''}`;
        return `<article class="message-row ${isUser ? 'user-message' : 'assistant-message'}" data-index="${index}" data-message-id="${escapeHtml(message.id || '')}"><div class="message-avatar">${isUser ? 'You' : '<img src="assets/icons/dodo-mascot.svg" alt="TODO AI">'}</div><div class="message-column"><div class="message-bubble${message.pending && message.text ? ' is-generating' : ''}"${message.pending ? ' aria-label="TODO AI is responding"' : ''}>${body}${typing}</div>${footer}</div></article>`;
      }).join('');
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
  function openHistory() {
    document.querySelector('#historyDrawer').setAttribute('aria-hidden', 'false');
    document.querySelector('#drawerBackdrop').hidden = false;
    document.querySelector('#historyButton').setAttribute('aria-expanded', 'true');
    document.querySelector('#closeHistoryButton').focus();
  }
  function closeHistory() {
    const drawer = document.querySelector('#historyDrawer');
    const desktop = window.matchMedia('(min-width: 1100px)').matches;
    drawer.setAttribute('aria-hidden', desktop ? 'false' : 'true');
    document.querySelector('#drawerBackdrop').hidden = true;
    document.querySelector('#historyButton').setAttribute('aria-expanded', 'false');
    if (!desktop && document.activeElement.closest('#historyDrawer')) document.querySelector('#historyButton').focus();
  }
  function updateDrawerVisibility() {
    const open = window.matchMedia('(min-width: 1100px)').matches || document.querySelector('#historyButton').getAttribute('aria-expanded') === 'true';
    document.querySelector('#historyDrawer').setAttribute('aria-hidden', String(!open));
    document.querySelector('#drawerBackdrop').hidden = !open || window.matchMedia('(min-width: 1100px)').matches;
  }
  function autoSize() { const input = document.querySelector('#chatInput'); input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 140)}px`; }
  function scrollToBottom(force) { const box = document.querySelector('#chatScroll'); if (force || state.nearBottom) requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; }); }
  function updateConnection() { const online = navigator.onLine; document.querySelector('#connectionStatus').classList.toggle('offline', !online); document.querySelector('#connectionStatus span').textContent = online ? 'Online' : 'Offline'; }
  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    const savedSettings = read('todo_settings', {});
    savedSettings.theme = next;
    write('todo_settings', savedSettings);
    document.querySelector('#themeButton').innerHTML = icon(next === 'dark' ? 'sun' : 'moon');
    document.querySelector('#themeButton').setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} theme`);
    document.querySelector('#themeButton').setAttribute('aria-pressed', String(next === 'dark'));
    document.querySelector('#drawerThemeButton').textContent = `Switch to ${next === 'dark' ? 'light' : 'dark'} theme`;
    document.querySelector('#drawerThemeButton').setAttribute('aria-pressed', String(next === 'dark'));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#171624' : '#F8F9FC');
  }
  function renderStreamedMessage(message) {
    const row = Array.from(document.querySelectorAll('#chatMessages [data-message-id]')).find((item) => item.dataset.messageId === message.id);
    if (!row) return;
    const bubble = row.querySelector('.message-bubble');
    bubble.innerHTML = markdown(message.text);
    bubble.classList.toggle('is-generating', message.pending && Boolean(message.text));
    const status = row.querySelector('.message-status');
    if (status) status.textContent = message.text ? 'TODO AI is responding…' : 'TODO AI is thinking…';
    scrollToBottom(false);
  }
  async function readEventStream(response, onChunk) {
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'AI response unavailable.');
    }
    if (!response.body?.getReader) throw new Error('Streaming responses are not supported in this browser.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let dataLines = [];
    let completed = false;

    function dispatchEvent() {
      if (!dataLines.length) return;
      const data = dataLines.join('\n');
      dataLines = [];
      if (data === '[DONE]') {
        completed = true;
        return;
      }

      const event = JSON.parse(data);
      if (event.error) throw new Error(event.error);
      if (event.done) completed = true;
      if (event.model) state.lastModel = event.model;
      if (event.text) onChunk(event.text);
    }

    function consumeLine(line) {
      if (line === '') dispatchEvent();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
    }

    try {
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        let newline = buffer.indexOf('\n');
        while (newline !== -1) {
          consumeLine(buffer.slice(0, newline).replace(/\r$/, ''));
          buffer = buffer.slice(newline + 1);
          newline = buffer.indexOf('\n');
        }
        if (done) {
          if (buffer) consumeLine(buffer.replace(/\r$/, ''));
          dispatchEvent();
          break;
        }
      }
      if (!completed) throw new Error('Connection ended before the response finished.');
    } catch (error) {
      await reader.cancel(error).catch(() => {});
      throw error;
    } finally {
      reader.releaseLock();
    }
  }
  async function send(promptOverride) {
    if (state.controller) {
      if (typeof promptOverride === 'string') {
        toast('Wait for the current response or stop it before starting another.');
      } else {
        cancelGeneration();
      }
      return;
    }
    const input = document.querySelector('#chatInput');
    const prompt = (typeof promptOverride === 'string' ? promptOverride : input.value).trim();
    if (!prompt || !navigator.onLine) { if (!navigator.onLine) toast('You are offline. Reconnect to send a message.'); return; }
    if (!state.sessionId) createSession();
    const sessionId = state.sessionId;
    state.messages.push({ role: 'user', text: prompt, id: makeId() });
    const session = activeSession();
    if (session && session.title === 'New conversation') session.title = prompt.slice(0, 42);
    if (typeof promptOverride !== 'string') {
      input.value = '';
      autoSize();
    }
    renderMessages(); persist(); setGenerating(true);
    const assistant = { role: 'assistant', text: '', id: makeId(), pending: true };
    state.messages.push(assistant); renderMessages();
    const controller = new AbortController();
    state.controller = controller;
    try {
      const response = await fetch(`${location.hostname === 'lagma-village-ai.onrender.com' ? '' : 'https://lagma-village-ai.onrender.com'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: true,
          messages: state.messages.filter((item) => !item.pending).slice(-20).map(({ role, text }) => ({ role, text })),
        }),
        signal: controller.signal,
      });
      await readEventStream(response, (text) => {
        assistant.text += text;
        renderStreamedMessage(assistant);
        persist();
      });
      if (!assistant.text.trim()) throw new Error('AI ne khaali response diya. Dobara try karein.');
      if ((state.liveMode || settings.autoSpeak) && assistant.text) speak(assistant.text);
    } catch (error) {
      if (error.name === 'AbortError') {
        assistant.notice = assistant.text ? 'Generation stopped. This partial answer is saved.' : '';
        if (!assistant.text && state.sessionId === sessionId) state.messages = state.messages.filter((message) => message !== assistant);
      } else {
        assistant.notice = assistant.text ? `Connection interrupted. Partial answer saved. ${error.message}` : '';
        if (!assistant.text) assistant.text = `Sorry, ${error.message}`;
        assistant.error = true;
      }
    } finally {
      assistant.pending = false;
      if (state.controller === controller) {
        state.controller = null;
        if (state.sessionId === sessionId) {
          setGenerating(false);
          persist();
          renderMessages();
        }
      } else if (!state.controller && state.sessionId === sessionId) {
        setGenerating(false);
        persist();
        renderMessages();
      }
    }
  }
  function cancelGeneration() {
    if (!state.controller) return;
    const controller = state.controller;
    const assistant = state.messages.at(-1);
    if (assistant?.role === 'assistant' && assistant.pending) {
      assistant.pending = false;
      assistant.notice = assistant.text ? 'Generation stopped. This partial answer is saved.' : '';
      if (!assistant.text) state.messages.pop();
    }
    state.controller = null;
    controller.abort();
    setGenerating(false);
    persist();
    renderMessages();
  }
  function setGenerating(active) { const button = document.querySelector('#sendButton'); button.classList.toggle('stop', active); button.innerHTML = icon(active ? 'stop' : 'send'); button.setAttribute('aria-label', active ? 'Stop generating' : 'Send message'); button.title = active ? 'Stop generating' : 'Send message'; }
  async function handleMessageAction(event) {
    const copyCode = event.target.closest('[data-copy-code]');
    if (copyCode) {
      await copyText(decodeURIComponent(copyCode.dataset.copyCode), copyCode);
      return;
    }
    const button = event.target.closest('[data-action]'); if (!button) return;
    const row = button.closest('.message-row'); const message = state.messages[Number(row.dataset.index)];
    if (button.dataset.action === 'copy') await copyText(message.text, button);
    if (button.dataset.action === 'speak') speak(message.text);
  }
  async function copyText(text, button) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable.');
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
      toast('Copied to clipboard.');
      window.setTimeout(() => { if (button.isConnected) button.innerHTML = button.hasAttribute('data-copy-code') ? 'Copy' : icon('copy'); }, 1400);
    } catch {
      toast('Could not copy this text. Select and copy it manually.');
    }
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
    try {
      state.recognition.start();
    } catch {
      stopRecognition();
      toast('Microphone could not be started. Check browser permissions and try again.');
    }
  }
  function stopRecognition() { state.listening = false; document.querySelector('#micButton')?.classList.remove('active'); }
  function toggleLive() { if (state.liveMode) stopLive(); else { if (!speechCtor() || !('speechSynthesis' in window)) { toast('Talk Live needs Web Speech support.'); return; } state.liveMode = true; document.querySelector('#liveBanner').hidden = false; toggleRecognition(); } }
  function stopLive() { state.liveMode = false; stopRecognition(); speechSynthesis.cancel(); document.querySelector('#liveBanner').hidden = true; }
  function speak(text) { if (!('speechSynthesis' in window)) { toast('Text-to-speech is not supported here.'); return; } speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = settings.language; utterance.rate = settings.rate; speechSynthesis.speak(utterance); }
  function toast(message) { const node = document.querySelector('#toast') || Object.assign(document.body.appendChild(document.createElement('div')), { id: 'toast' }); node.textContent = message; node.className = 'toast show'; setTimeout(() => node.classList.remove('show'), 2600); }
  function init() {
    const savedSettings = read('todo_settings', {});
    const legacyTheme = read('todo_theme', null);
    if (savedSettings.theme === 'dark' || savedSettings.theme === 'light') {
      document.documentElement.dataset.theme = savedSettings.theme;
    } else if (legacyTheme === 'dark' || legacyTheme === 'light') {
      document.documentElement.dataset.theme = legacyTheme;
      savedSettings.theme = legacyTheme;
      write('todo_settings', savedSettings);
    }
    state.sessionId = state.sessions[0]?.id || null;
    state.messages = activeSession()?.messages?.slice() || [];
    build(); renderMessages(); renderHistory();
    if (!state.sessionId) createSession();
    const dark = document.documentElement.dataset.theme === 'dark';
    document.querySelector('#themeButton').innerHTML = icon(dark ? 'sun' : 'moon');
    document.querySelector('#themeButton').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    document.querySelector('#themeButton').setAttribute('aria-pressed', String(dark));
    document.querySelector('#drawerThemeButton').textContent = `Switch to ${dark ? 'light' : 'dark'} theme`;
    document.querySelector('#drawerThemeButton').setAttribute('aria-pressed', String(dark));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#171624' : '#F8F9FC');
    const speechAvailable = Boolean(speechCtor());
    document.querySelector('#micButton').disabled = !speechAvailable;
    document.querySelector('#micButton').title = speechAvailable ? 'Voice input' : 'Voice input is not supported in this browser';
    document.querySelector('#liveButton').disabled = !speechAvailable || !('speechSynthesis' in window);
    document.querySelector('[data-open-live]').disabled = !speechAvailable || !('speechSynthesis' in window);
    setGenerating(false);
  }
  if (window.lucide) {
    init();
  } else {
    const script = document.createElement('script');
    script.src = '../assets/lucide.min.js?v=1';
    script.onload = init;
    script.onerror = init;
    document.head.append(script);
  }
})();
