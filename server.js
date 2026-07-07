import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT) || 3000;
const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const todoPublic = path.join(__dirname, "todo-ai");
const lagmaPublic = __dirname;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use("/todo-ai", express.static(todoPublic));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(process.env.GEMINI_API_KEY), model });
});

app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "GEMINI_API_KEY abhi configure nahi hui hai." });
  }

  const messages = sanitizeMessages(req.body?.messages);
  if (!messages.length || messages.at(-1).role !== "user") {
    return res.status(400).json({ error: "Kripya ek message likhiye." });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You are TODO AI, a friendly and accurate assistant. Reply in the same language as the user. Prefer simple Hindi/Hinglish when the user writes Hindi. Be concise, practical, and honest about uncertainty." }],
          },
          contents: messages.map(({ role, text }) => ({
            role: role === "assistant" ? "model" : "user",
            parts: [{ text }],
          })),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200,
          },
        }),
        signal: AbortSignal.timeout(45_000),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("Gemini API error:", response.status, data?.error?.message);
      return res.status(response.status === 429 ? 429 : 502).json({
        error: response.status === 429
          ? "Free limit filhaal poori ho gayi hai. Thodi der baad dobara try karein."
          : "Gemini se response nahi mil saka. API key aur model check karein.",
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({ error: "AI ne khaali response diya. Dobara try karein." });
    }

    res.json({ reply });
  } catch (error) {
    console.error("Chat request failed:", error.message);
    const timedOut = error.name === "TimeoutError";
    res.status(502).json({
      error: timedOut ? "AI response mein zyada samay laga. Dobara try karein." : "Network error aaya. Dobara try karein.",
    });
  }
});

app.use(express.static(lagmaPublic));

app.use((_req, res) => {
  res.status(404).sendFile(path.join(todoPublic, "404.html"));
});

function sanitizeMessages(input) {
  if (!Array.isArray(input)) return [];

  return input
    .slice(-20)
    .map((message) => ({
      role: message?.role === "assistant" ? "assistant" : "user",
      text: typeof message?.text === "string" ? message.text.trim().slice(0, 6000) : "",
    }))
    .filter((message) => message.text);
}

app.listen(port, () => {
  console.log(`TODO AI chal raha hai: http://localhost:${port}`);
});
