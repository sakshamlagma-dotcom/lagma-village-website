import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT) || 3000;
const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const fallbackModels = [
  primaryModel,
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-flash-lite-latest",
].filter((item, index, list) => item && list.indexOf(item) === index);
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
app.use(express.json({ limit: "1mb" }));

app.get(["/todo-ai", "/todo-ai/"], (_req, res) => {
  res.redirect(302, "/todo-ai/service-detail.html?id=chat");
});

app.use("/todo-ai", express.static(todoPublic));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(process.env.GEMINI_API_KEY), model: primaryModel, fallbackModels });
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
    const { data, model } = await generateWithFallback(apiKey, messages);

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({ error: "AI ne khaali response diya. Dobara try karein." });
    }

    res.json({ reply, model });
  } catch (error) {
    console.error("Chat request failed:", error.message);
    const timedOut = error.name === "TimeoutError";
    res.status(502).json({
      error: timedOut ? "AI response mein zyada samay laga. Dobara try karein." : "Gemini abhi busy hai. Thodi der baad dobara try karein.",
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

async function generateWithFallback(apiKey, messages) {
  let lastError;

  for (const model of fallbackModels) {
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
              parts: [{ text: systemPrompt }],
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
          signal: AbortSignal.timeout(12_000),
        },
      );

      const data = await response.json();
      if (response.ok) return { data, model };

      lastError = new Error(data?.error?.message || `Gemini API error ${response.status}`);
      console.error("Gemini API error:", response.status, model, data?.error?.message);

      if (![400, 429, 503].includes(response.status)) break;
    } catch (error) {
      lastError = error;
      console.error("Gemini request failed:", model, error.message);
    }
  }

  throw lastError || new Error("Gemini request failed");
}

app.listen(port, () => {
  console.log(`TODO AI chal raha hai: http://localhost:${port}`);
});
