import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { app } from "../server.js";

const originalFetch = globalThis.fetch;
let upstreamFetch;
let server;
let baseUrl;
let originalApiKey;

before(async () => {
  originalApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-api-key";
  globalThis.fetch = (input, options) => {
    const url = String(input);
    if (url.startsWith("https://generativelanguage.googleapis.com/")) {
      return upstreamFetch(input, options);
    }
    return originalFetch(input, options);
  };
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalApiKey;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("streams Gemini text before the upstream response is complete", async () => {
  const encoder = new TextEncoder();
  let releaseSecondChunk;
  const secondChunkReady = new Promise((resolve) => { releaseSecondChunk = resolve; });

  upstreamFetch = async (url, options) => {
    assert.match(String(url), /:streamGenerateContent\?alt=sse$/);
    assert.equal(options.headers["x-goog-api-key"], "test-api-key");
    const request = JSON.parse(options.body);
    assert.equal(request.contents.at(-1).parts[0].text, "Hello");
    return new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n\n'));
        setTimeout(() => {
          controller.enqueue(encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":" there"}]}}]}\n\n'));
          releaseSecondChunk();
          controller.close();
        }, 40);
      },
    }), { headers: { "Content-Type": "text/event-stream" } });
  };

  const response = await originalFetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stream: true, messages: [{ role: "user", text: "Hello" }] }),
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/event-stream/);

  const reader = response.body.getReader();
  const first = await reader.read();
  assert.match(new TextDecoder().decode(first.value), /"text":"Hello"/);
  await secondChunkReady;
  const remaining = await reader.read();
  const tail = new TextDecoder().decode(remaining.value);
  assert.match(tail, /"text":" there"/);
  assert.match(tail, /"done":true/);
  await reader.cancel();
});

test("reports an upstream streaming interruption without losing received text", async () => {
  const encoder = new TextEncoder();
  upstreamFetch = async () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"Partial"}]}}]}\n\n'));
      setTimeout(() => controller.error(new Error("upstream connection reset")), 20);
    },
  }), { headers: { "Content-Type": "text/event-stream" } });

  const response = await originalFetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stream: true, messages: [{ role: "user", text: "Test" }] }),
  });
  const body = await response.text();
  assert.match(body, /"text":"Partial"/);
  assert.match(body, /"error":"Gemini abhi busy hai/);
});

test("cancels the upstream Gemini stream when the browser stops generation", async () => {
  const encoder = new TextEncoder();
  let upstreamAborted = false;
  upstreamFetch = async (_url, options) => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"Partial"}]}}]}\n\n'));
      options.signal.addEventListener("abort", () => {
        upstreamAborted = true;
        controller.error(options.signal.reason);
      }, { once: true });
    },
  }), { headers: { "Content-Type": "text/event-stream" } });

  const abortController = new AbortController();
  const response = await originalFetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stream: true, messages: [{ role: "user", text: "Test" }] }),
    signal: abortController.signal,
  });
  const reader = response.body.getReader();
  await reader.read();
  abortController.abort();
  await reader.read().catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(upstreamAborted, true);
});

test("keeps the existing JSON chat response for non-streaming callers", async () => {
  upstreamFetch = async (url) => {
    assert.match(String(url), /:generateContent$/);
    return Response.json({
      candidates: [{ content: { parts: [{ text: "Legacy reply" }] } }],
    });
  };

  const response = await originalFetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", text: "Test" }] }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reply: "Legacy reply", model: "gemini-3.5-flash-lite" });
});

test("maps pre-stream rate limits to safe JSON errors", async () => {
  upstreamFetch = async () => Response.json({ error: { message: "private upstream detail" } }, { status: 429 });

  const response = await originalFetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stream: true, messages: [{ role: "user", text: "Test" }] }),
  });
  assert.equal(response.status, 429);
  const body = await response.json();
  assert.match(body.error, /AI usage limit reached temporarily/);
  assert.equal(body.code, "RATE_LIMITED");
  assert.doesNotMatch(JSON.stringify(body), /private upstream detail|test-api-key/);
});
