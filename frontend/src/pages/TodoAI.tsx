import { useMemo, useState } from "react";
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Lightbulb,
  Menu,
  MessageCircle,
  Mic,
  Moon,
  MoreHorizontal,
  PanelRight,
  Plus,
  Search,
  Sparkles,
  Sun,
  Target,
  Globe,
  X,
  Zap,
} from "lucide-react";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

type Tool = {
  id: string;
  label: string;
  description: string;
  icon: typeof MessageCircle;
  accent: string;
};

const suggestions = [
  { label: "Plan my day", prompt: "Help me plan a focused day with three priorities." },
  { label: "Explain simply", prompt: "Explain a difficult topic in a simple, friendly way." },
  { label: "Write something", prompt: "Help me write a polished message for my community." },
];

const tools: Tool[] = [
  { id: "chat", label: "AI Chat", description: "Ask anything, in Hindi or English.", icon: MessageCircle, accent: "mint" },
  { id: "write", label: "Writing Assistant", description: "Clear emails, captions and copy.", icon: FileText, accent: "blue" },
  { id: "study", label: "Study Helper", description: "Make hard ideas easier to learn.", icon: BookOpen, accent: "amber" },
  { id: "ideas", label: "Idea Generator", description: "Turn a blank page into momentum.", icon: Lightbulb, accent: "pink" },
  { id: "translate", label: "Smart Translator", description: "Natural Hindi and English translations.", icon: Globe, accent: "violet" },
  { id: "resume", label: "Resume Builder", description: "Sharper stories for your next role.", icon: Target, accent: "orange" },
];

const starterMessage: Message = {
  id: 1,
  role: "assistant",
  text: "Namaste. I’m TODO AI — a calm space to think, ask and create. What are we working on today?",
};

function createReply(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes("plan") || lower.includes("day")) {
    return "Let’s make it simple: choose one important outcome, one useful task and one small thing that gives you energy. Start with the outcome, then protect 45 focused minutes for it.";
  }
  if (lower.includes("write") || lower.includes("message")) {
    return "Absolutely. Share who the message is for and the tone you want — warm, professional or concise — and I’ll shape a clean first draft for you.";
  }
  if (lower.includes("explain") || lower.includes("topic")) {
    return "Send me the topic and your current level. I’ll break it into a plain-language idea, a real-world example and a quick way to remember it.";
  }
  return "That sounds like a good place to start. Tell me a little more about the outcome you want, and I’ll help you turn it into clear next steps.";
}

export default function TodoAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [notice, setNotice] = useState("");

  const activeMessages = useMemo(() => messages.length ? messages : [starterMessage], [messages]);

  function showNotice(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function sendMessage(rawText: string) {
    const text = rawText.trim();
    if (!text || thinking) return;
    const userMessage: Message = { id: Date.now(), role: "user", text };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text: createReply(text) }]);
      setThinking(false);
    }, 650);
  }

  function startNewChat() {
    setMessages([]);
    setInput("");
    setThinking(false);
    showNotice("New chat ready");
  }

  return (
    <div data-testid="todo-ai-app" className={lightMode ? "todo-ai-app light-mode" : "todo-ai-app"}>
      <aside data-testid="todo-ai-sidebar" className={mobileMenuOpen ? "todo-sidebar mobile-open" : "todo-sidebar"}>
        <div className="todo-brand-block">
          <a data-testid="todo-ai-brand-link" href="#top" className="todo-brand">
            <span data-testid="todo-ai-brand-mark" className="todo-brand-mark">T</span>
            <span><strong data-testid="todo-ai-brand-name">TODO <em>AI</em></strong><small data-testid="todo-ai-brand-tagline">Think · Ask · Create</small></span>
          </a>
          <button data-testid="todo-ai-sidebar-close-button" type="button" className="mobile-close-button" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)}><X size={17} /></button>
        </div>

        <button data-testid="todo-ai-new-chat-button" type="button" className="new-chat-button" onClick={startNewChat}><Plus size={16} /> New chat</button>
        <nav data-testid="todo-ai-sidebar-navigation" className="todo-sidebar-nav">
          <span data-testid="todo-ai-workspace-label" className="todo-nav-label">Workspace</span>
          <button data-testid="todo-ai-chat-nav-button" type="button" className="todo-nav-item active"><MessageCircle size={16} /><span>AI Chat</span><span data-testid="todo-ai-chat-status" className="todo-nav-dot" /></button>
          <button data-testid="todo-ai-tools-nav-button" type="button" className="todo-nav-item" onClick={() => setRailOpen(true)}><Zap size={16} /><span>AI Tools</span><ChevronRight size={14} className="nav-chevron" /></button>
          <button data-testid="todo-ai-saved-nav-button" type="button" className="todo-nav-item" onClick={() => showNotice("Saved prompts are coming next")}><Check size={16} /><span>Saved prompts</span></button>
          <span data-testid="todo-ai-settings-label" className="todo-nav-label todo-nav-label-spaced">Personal</span>
          <button data-testid="todo-ai-theme-button" type="button" className="todo-nav-item" onClick={() => setLightMode((current) => !current)}>{lightMode ? <Moon size={16} /> : <Sun size={16} />}<span>{lightMode ? "Dark mode" : "Light mode"}</span></button>
          <button data-testid="todo-ai-settings-button" type="button" className="todo-nav-item" onClick={() => showNotice("Settings panel coming next")}><PanelRight size={16} /><span>Settings</span></button>
        </nav>
        <div data-testid="todo-ai-sidebar-footer" className="todo-sidebar-footer"><span data-testid="todo-ai-version-label">TODO AI / v1.0</span><span data-testid="todo-ai-local-label">Local workspace</span></div>
      </aside>

      <main id="top" data-testid="todo-ai-main" className="todo-main">
        <header data-testid="todo-ai-topbar" className="todo-topbar">
          <div className="todo-topbar-left"><button data-testid="todo-ai-mobile-menu-button" type="button" className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}><Menu size={19} /></button><div><span data-testid="todo-ai-breadcrumb" className="todo-breadcrumb">Workspace <ChevronRight size={12} /> <strong>AI Chat</strong></span><span data-testid="todo-ai-mobile-title" className="todo-mobile-title">TODO AI</span></div></div>
          <div className="todo-topbar-actions"><span data-testid="todo-ai-model-status" className="model-status"><i /> Gemini Flash</span><button data-testid="todo-ai-search-button" type="button" className="top-icon-button" aria-label="Search" onClick={() => showNotice("Search your workspace") }><Search size={17} /></button><button data-testid="todo-ai-more-button" type="button" className="top-icon-button" aria-label="More options" onClick={() => showNotice("More options coming next")}><MoreHorizontal size={18} /></button><button data-testid="todo-ai-avatar-button" type="button" className="todo-avatar" aria-label="Open profile" onClick={() => showNotice("Profile settings coming next")}>S</button></div>
        </header>

        <div className="todo-content-grid">
          <section data-testid="todo-ai-chat-panel" className="todo-chat-panel">
            <div className="chat-panel-scroll">
              <div data-testid="todo-ai-chat-header" className="chat-intro-row"><div><span data-testid="todo-ai-chat-kicker" className="todo-kicker">YOUR EVERYDAY AI</span><h1 data-testid="todo-ai-chat-heading">Think clearer.<br /><span>Make it happen.</span></h1><p data-testid="todo-ai-chat-description">A focused space for your questions, ideas and next best steps.</p></div><div data-testid="todo-ai-chat-orb" className="chat-orb"><Sparkles size={20} /><span>AI</span></div></div>
              <div data-testid="todo-ai-message-list" className="todo-message-list">
                {activeMessages.map((message) => (
                  <article data-testid={`todo-ai-${message.role}-message-${message.id}`} key={message.id} className={`todo-message ${message.role}`}>
                    <div data-testid={`todo-ai-${message.role}-avatar-${message.id}`} className="message-avatar">{message.role === "assistant" ? "T" : "S"}</div>
                    <div className="message-content"><span data-testid={`todo-ai-${message.role}-label-${message.id}`} className="message-label">{message.role === "assistant" ? "TODO AI" : "You"}</span><p data-testid={`todo-ai-${message.role}-text-${message.id}`} className="message-text">{message.text}</p>{message.role === "assistant" && message.id !== 1 && <div className="message-actions"><button data-testid={`todo-ai-copy-response-${message.id}`} type="button" onClick={() => { void navigator.clipboard?.writeText(message.text); showNotice("Response copied"); }}><Copy size={13} /> Copy</button><span data-testid={`todo-ai-disclaimer-${message.id}`}>AI can make mistakes</span></div>}</div>
                  </article>
                ))}
                {thinking && <div data-testid="todo-ai-thinking-indicator" className="thinking-message"><div className="thinking-dots"><i /><i /><i /></div><span>Refining the response</span></div>}
              </div>
              {messages.length === 0 && <div data-testid="todo-ai-suggestion-list" className="suggestion-list">{suggestions.map((suggestion, index) => <button data-testid={`todo-ai-suggestion-${index + 1}`} type="button" key={suggestion.label} onClick={() => sendMessage(suggestion.prompt)}><span>{suggestion.label}</span><ArrowUp size={14} /></button>)}</div>}
            </div>
            <form data-testid="todo-ai-composer-form" className="todo-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(input); }}><textarea data-testid="todo-ai-message-input" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(input); } }} placeholder="Ask anything..." rows={1} maxLength={6000} /><div className="composer-toolbar"><span data-testid="todo-ai-composer-hint">Enter to send · Shift + Enter for a new line</span><div className="composer-actions"><button data-testid="todo-ai-voice-button" type="button" className="composer-icon-button" aria-label="Start voice input" onClick={() => showNotice("Voice input needs microphone permission")}><Mic size={16} /></button><button data-testid="todo-ai-send-button" type="submit" className="composer-send-button" aria-label="Send message" disabled={thinking || !input.trim()}><ArrowUp size={17} /></button></div></div></form>
          </section>

          <aside data-testid="todo-ai-tool-rail" className={railOpen ? "todo-tool-rail" : "todo-tool-rail rail-collapsed"}><div className="rail-header"><div><span data-testid="todo-ai-rail-kicker" className="todo-kicker">QUICK ACCESS</span><h2 data-testid="todo-ai-rail-heading">AI tools</h2></div><button data-testid="todo-ai-rail-close-button" type="button" className="rail-close-button" aria-label="Close tools panel" onClick={() => setRailOpen(false)}><X size={16} /></button></div><p data-testid="todo-ai-rail-description" className="rail-description">One workspace. Many ways to move forward.</p><div data-testid="todo-ai-tool-list" className="todo-tool-list">{tools.map((tool) => { const Icon = tool.icon; return <button data-testid={`todo-ai-tool-${tool.id}`} type="button" key={tool.id} className="todo-tool-card" onClick={() => { setInput(`${tool.label}: `); showNotice(`${tool.label} selected`); }}><span data-testid={`todo-ai-tool-icon-${tool.id}`} className={`tool-icon ${tool.accent}`}><Icon size={17} /></span><span className="tool-copy"><strong data-testid={`todo-ai-tool-label-${tool.id}`}>{tool.label}</strong><small data-testid={`todo-ai-tool-description-${tool.id}`}>{tool.description}</small></span><ChevronRight size={15} className="tool-arrow" /></button>; })}</div><div data-testid="todo-ai-pro-tip-card" className="pro-tip-card"><span data-testid="todo-ai-pro-tip-icon" className="pro-tip-icon"><Sparkles size={16} /></span><div><strong data-testid="todo-ai-pro-tip-title">A better prompt</strong><p data-testid="todo-ai-pro-tip-text">Tell me the outcome you want, not just the task.</p></div></div></aside>
        </div>
      </main>
      {!railOpen && <button data-testid="todo-ai-open-rail-button" type="button" className="open-rail-button" onClick={() => setRailOpen(true)} aria-label="Open AI tools"><PanelRight size={17} /></button>}
      {notice && <div data-testid="todo-ai-toast" className="todo-toast" role="status">{notice}</div>}
    </div>
  );
}