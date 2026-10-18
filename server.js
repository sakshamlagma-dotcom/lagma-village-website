import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
app.set("trust proxy", 1);
const port = Number(process.env.PORT) || 3000;
const primaryModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const todoPublic = path.join(__dirname, "todo-ai");
const lagmaPublic = __dirname;
const systemPrompt = `
You are TODO AI, a general-purpose AI assistant for everyone, and also the official AI assistant for the Lagma Village website.
You can answer questions about the world, science, study, technology, history, geography, writing, ideas, daily life, and the Lagma Village website. Do not limit yourself only to website questions.
Reply in the same language as the user. Prefer simple Hindi/Hinglish when the user writes Hindi or Hinglish.
Be concise, practical, warm, and honest about uncertainty. For current news, live prices, legal, medical, or financial topics, say that users should verify from an up-to-date trusted source when needed.

Identity rules:
- If anyone asks who made you, who created you, your developer, owner, founder, or "tumhe kisne banaya", answer clearly: "Mujhe Saksham Jha ne banaya hai."
- Do not say you were made by Google, Gemini, OpenAI, or a generic team. You can say you are powered by Gemini technology when asked about the AI technology.
- Your name is TODO AI.

Website knowledge:
- Website name: Lagma Village Official website.
- Website link: https://lagma-village-ai.onrender.com/
- TODO AI link: https://lagma-village-ai.onrender.com/todo-ai/
- The website is about Lagma Village, Saharsa, Bihar.
- Lagma Village is known for agriculture, fertile fields, fish farming ponds, mango orchards, bamboo clusters, temples, community life, Maithili/Hindi language, festivals, education, and local progress.
- Main pages/features:
  1. Home: overview of Lagma Village, village highlights, map, digital Lagma section, services preview, gallery preview, and TODO AI shortcut.
  2. About: history, culture, geography, education, festivals, community life, and future development of Lagma.
  3. Services: village services such as school/education, ponds/fish farming, panchayat services, Kissan Help, online services, and TODO AI.
  4. Kissan Help: farmer support area with agriculture information, useful schemes/links, and weather help for Lagma.
  5. Online Services: Vasudha Kendra/CSC-style digital services such as Aadhaar/PAN support, certificates, online forms, bill payment, recharge, ticket booking, banking support, insurance, and government scheme registration.
  6. Gallery: Lagma photo collection with categories, search/filter, preview, and photo upload.
  7. Notifications: latest notices and announcements from the Lagma Village website.
  8. TODO AI: AI chat, writing assistant, study help, idea generation, translation, resume help, and daily task assistance.
- If someone asks where to find something on the website, guide them to the correct page and give the link when useful.
- If someone asks for contact/admin details that are not in the website knowledge, say that exact details are not available in your current website knowledge and suggest checking the relevant page.
`.trim();

app.disable("x-powered-by");
app.use((req, res, next) => {
  const allowedOrigins = new Set([
    "https://sakshamlagma-dotcom.github.io",
    "https://lagma-village-ai.onrender.com",
  ]);
  const origin = req.headers.origin;
  if (allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.path.startsWith("/todo-ai") || req.path.startsWith("/api/")) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: "1mb" }));

app.get(["/todo-ai", "/todo-ai/"], (_req, res) => {
  res.redirect(302, "/todo-ai/service-detail.html?id=chat");
});

app.use("/todo-ai", express.static(todoPublic));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(process.env.GEMINI_API_KEY) });
});

const rateBuckets = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [ip, bucket] of rateBuckets) if (bucket.started < cutoff) rateBuckets.delete(ip);
}, RATE_WINDOW_MS).unref();

app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "AI is not configured on the server yet. Please try again later.", code: "NOT_CONFIGURED" });
  }

  const messages = sanitizeMessages(req.body?.messages);
  if (!messages.length || messages.at(-1).role !== "user") {
    return res.status(400).json({ error: "Kripya ek message likhiye." });
  }

  const now = Date.now();
  const client = req.ip || req.socket.remoteAddress || "unknown";
  let bucket = rateBuckets.get(client);
  if (!bucket || now - bucket.started >= RATE_WINDOW_MS) {
    bucket = { started: now, count: 0 };
    rateBuckets.set(client, bucket);
  }
  if (++bucket.count > RATE_MAX) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Too many requests. Please wait a minute and try again.", code: "RATE_LIMITED" });
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(new Error("timeout")), 45_000);
  req.on("aborted", () => abortController.abort());
  res.on("close", () => { if (!res.writableEnded) abortController.abort(); });
  try {
    if (req.body?.stream === true || req.get("accept")?.includes("text/event-stream")) {
      await streamReply(apiKey, messages, abortController.signal, res);
    } else {
      const reply = await generateReply(apiKey, messages, abortController.signal);
      res.json({ reply, model: primaryModel });
    }
  } catch (error) {
    if (abortController.signal.aborted && !res.headersSent) {
      const timedOut = error.name === "TimeoutError" || abortController.signal.reason?.message === "timeout";
      return res.status(timedOut ? 504 : 499).json({ error: timedOut ? "The response took too long. Please retry." : "Request cancelled.", code: timedOut ? "TIMEOUT" : "CANCELLED" });
    }
    console.error("Chat request failed", { status: error.status || null });
    if (res.headersSent) {
      if (!res.destroyed && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: "Gemini abhi busy hai. Thodi der baad dobara try karein.", code: "AI_UNAVAILABLE" })}\n\n`);
        res.end();
      }
      return;
    }
    const timedOut = error.name === "TimeoutError" || error.name === "AbortError";
    const upstreamStatus = Number(error.status) || 0;
    let message = "Gemini abhi busy hai. Thodi der baad dobara try karein.";

    if ([401, 403].includes(upstreamStatus)) {
      message = "AI service authorization needs attention. Please check the server-side Gemini configuration.";
    } else if (upstreamStatus === 404) {
      message = "The configured AI model is unavailable. Please update GEMINI_MODEL on the server.";
    } else if (upstreamStatus === 429) {
      message = "AI usage limit reached temporarily. Please wait a moment and try again.";
    } else if ([400, 413].includes(upstreamStatus)) {
      message = "That request could not be processed. Please shorten it and try again.";
    } else if (timedOut) {
      message = "AI response mein zyada samay laga. Dobara try karein.";
    }

    const status = upstreamStatus === 401 || upstreamStatus === 403 ? 503 : upstreamStatus === 429 ? 429 : timedOut ? 504 : 502;
    res.status(status).json({
      error: message,
      code: upstreamStatus === 429 ? "RATE_LIMITED" : upstreamStatus === 404 ? "MODEL_UNAVAILABLE" : upstreamStatus === 401 || upstreamStatus === 403 ? "AI_AUTH_ERROR" : timedOut ? "TIMEOUT" : "AI_UNAVAILABLE",
    });
  } finally {
    clearTimeout(timeout);
  }
});

app.use(express.static(lagmaPublic));

app.use((_req, res) => {
  res.status(404).sendFile(path.join(todoPublic, "404.html"));
});

function sanitizeMessages(input) {
  if (!Array.isArray(input) || input.length > 20) return [];
  const messages = input
    .slice(-20)
    .map((message) => ({
      role: message?.role === "assistant" ? "assistant" : "user",
      text: typeof message?.text === "string" ? message.text.trim().slice(0, 6000) : "",
    }))
    .filter((message) => message.text);
  const totalLength = messages.reduce((sum, message) => sum + message.text.length, 0);
  return totalLength <= 24_000 ? messages : [];
}

async function streamReply(apiKey, messages, signal, res) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(primaryModel)}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: messages.map(({ role, text }) => ({ role: role === "assistant" ? "model" : "user", parts: [{ text }] })),
        generationConfig: { maxOutputTokens: 1600 },
      }),
      signal,
    },
  );
  if (!response.ok) {
    const error = new Error("Gemini request failed");
    error.status = response.status;
    throw error;
  }
  if (!response.body) throw new Error("Streaming response unavailable");

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || "";
      for (const event of events) {
        const line = event.split(/\r?\n/).find((item) => item.startsWith("data:"));
        if (!line) continue;
        try {
          const data = JSON.parse(line.slice(5).trim());
          const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
          if (text && !res.writableEnded) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        } catch { /* Ignore malformed provider event; continue reading the stream. */ }
      }
      if (done) break;
    }
    if (buffer.trim()) {
      const line = buffer.split(/\r?\n/).find((item) => item.startsWith("data:"));
      if (line) {
        try {
          const data = JSON.parse(line.slice(5).trim());
          const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
          if (text && !res.writableEnded) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        } catch { /* Ignore malformed final provider event. */ }
      }
    }
    if (!res.writableEnded) res.end("data: {\"done\":true}\n\n");
  } finally {
    reader.releaseLock();
  }
}

async function generateReply(apiKey, messages, signal) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(primaryModel)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: messages.map(({ role, text }) => ({ role: role === "assistant" ? "model" : "user", parts: [{ text }] })),
        generationConfig: { maxOutputTokens: 1600 },
      }),
      signal,
    },
  );
  if (!response.ok) {
    const error = new Error("Gemini request failed");
    error.status = response.status;
    await response.body?.cancel();
    throw error;
  }
  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!reply) {
    const error = new Error("Gemini returned an empty response");
    error.status = 502;
    throw error;
  }
  return reply;
}

export { app };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  app.listen(port, () => {
    console.log(`TODO AI chal raha hai: http://localhost:${port}`);
  });
}
