import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 31000 + Math.floor(Math.random() * 20000);
const origin = `http://127.0.0.1:${port}`;
let server;
let tempRoot;

const mockProvider = `
const encoder = new TextEncoder();
globalThis.fetch = async (url, options = {}) => {
  const payload = JSON.parse(options.body || '{}');
  if (payload.generationConfig?.temperature !== undefined) throw new Error('Gemini temperature override must be omitted.');
  const prompt = payload.contents?.at(-1)?.parts?.[0]?.text || '';
  if (!String(url).includes('gemini-3.5-flash-lite')) return new Response('{}', { status: 404 });
  if (prompt === 'provider-401') return new Response('{"error":{"message":"private provider detail"}}', { status: 401 });
  if (prompt === 'provider-429') return new Response('{"error":{"message":"quota provider detail"}}', { status: 429 });
  const makeEvent = (text) => 'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) + '\\n\\n';
  if (String(url).includes(':generateContent')) {
    return Response.json({ candidates: [{ content: { parts: [{ text: 'Legacy JSON reply.' }] } }] });
  }
  const first = makeEvent('Hello ');
  const last = makeEvent('from mock stream.').trimEnd();
  if (prompt === 'slow') {
    let source;
    let timer;
    const body = new ReadableStream({
      start(controller) {
        source = controller;
        controller.enqueue(encoder.encode(makeEvent('partial')));
        timer = setTimeout(() => controller.enqueue(encoder.encode(makeEvent('late'))), 5000);
      },
      cancel() { clearTimeout(timer); },
    });
    options.signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      try { source.error(new DOMException('Aborted', 'AbortError')); } catch { /* Stream already closed. */ }
    }, { once: true });
    return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
  }
  const chunks = [first.slice(0, 11), first.slice(11) + last.slice(0, 17), last.slice(17)];
  let index = 0;
  return new Response(new ReadableStream({ pull(controller) {
    if (index < chunks.length) controller.enqueue(encoder.encode(chunks[index++]));
    else controller.close();
  } }), { headers: { 'content-type': 'text/event-stream' } });
};
`;

before(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), 'todo-ai-tests-'));
  const mockPath = path.join(tempRoot, 'mock-provider.mjs');
  await writeFile(mockPath, mockProvider, 'utf8');
  server = spawn(process.execPath, ['server.js'], {
    cwd: projectRoot,
    stdio: 'ignore',
    env: {
      ...process.env,
      PORT: String(port),
      GEMINI_API_KEY: 'test-only-key',
      GEMINI_MODEL: 'gemini-3.5-flash-lite',
      NODE_OPTIONS: `--import=${pathToFileURL(mockPath).href}`,
      NODE_ENV: 'test',
    },
  });
  server.on('error', (error) => { throw error; });
  for (let i = 0; i < 80; i += 1) {
    if (server.exitCode !== null) throw new Error(`Test server exited with ${server.exitCode}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch { /* Wait for server startup. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Test server did not become ready.');
});

after(async () => {
  if (server && server.exitCode === null) {
    server.kill();
    await once(server, 'exit');
  }
  if (tempRoot) await rm(tempRoot, { recursive: true, force: true });
});

function chatRequest(text, { stream = false, ip = '192.0.2.10', signal } = {}) {
  return fetch(`${origin}/api/chat`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      ...(stream ? { accept: 'text/event-stream' } : {}),
    },
    body: JSON.stringify({ messages: [{ role: 'user', text }] }),
    signal,
  });
}

test('TODO AI route, page assets, health privacy, and main site remain available', async () => {
  const redirect = await fetch(`${origin}/todo-ai/`, { redirect: 'manual' });
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get('location'), '/todo-ai/service-detail.html?id=chat');
  const page = await fetch(`${origin}/todo-ai/service-detail.html?id=chat`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /chat-experience\.js/);
  assert.equal((await fetch(`${origin}/todo-ai/css/chat-experience.css`)).status, 200);
  assert.equal((await fetch(`${origin}/todo-ai/assets/icons/logo.svg`)).status, 200);
  assert.equal((await fetch(`${origin}/`)).status, 200);
  const health = await (await fetch(`${origin}/api/health`)).json();
  assert.equal(health.ok, true);
  assert.equal(health.configured, true);
  assert.equal('model' in health, false);
  assert.equal('fallbackModels' in health, false);
});

test('chat endpoint streams complete provider output, including an unterminated final provider event', async () => {
  const response = await chatRequest('hello', { stream: true, ip: '192.0.2.11' });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/event-stream/);
  const body = await response.text();
  const events = body.split(/\r?\n\r?\n/).filter(Boolean).map((event) => JSON.parse(event.replace(/^data:\s*/, '')));
  assert.equal(events.map((event) => event.text || '').join(''), 'Hello from mock stream.');
  assert.equal(events.at(-1).done, true);
});

test('legacy chat clients still receive JSON replies', async () => {
  const response = await chatRequest('hello', { ip: '192.0.2.12' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).reply, 'Legacy JSON reply.');
});

test('aborting a streaming response cancels the upstream generation', async () => {
  const controller = new AbortController();
  const response = await chatRequest('slow', { stream: true, ip: '192.0.2.16', signal: controller.signal });
  const reader = response.body.getReader();
  const first = await reader.read();
  assert.match(new TextDecoder().decode(first.value), /partial/);
  controller.abort();
  await assert.rejects(reader.read());
  assert.equal((await fetch(`${origin}/api/health`)).status, 200);
});

test('provider authentication and quota errors are safe and use suitable status codes', async () => {
  const auth = await chatRequest('provider-401', { ip: '192.0.2.13' });
  assert.equal(auth.status, 503);
  const authBody = await auth.text();
  assert.match(authBody, /AI_AUTH_ERROR/);
  assert.doesNotMatch(authBody, /private provider detail/);

  const quota = await chatRequest('provider-429', { ip: '192.0.2.14' });
  assert.equal(quota.status, 429);
  const quotaBody = await quota.text();
  assert.match(quotaBody, /RATE_LIMITED/);
  assert.doesNotMatch(quotaBody, /quota provider detail/);
});

test('invalid message arrays are rejected and expensive requests are rate limited', async () => {
  const invalid = await fetch(`${origin}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.15' },
    body: JSON.stringify({ messages: Array(21).fill({ role: 'user', text: 'x' }) }),
  });
  assert.equal(invalid.status, 400);

  const oversized = await fetch(`${origin}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.17' },
    body: JSON.stringify({ messages: [{ role: 'user', text: 'x'.repeat(1_100_000) }] }),
  });
  assert.equal(oversized.status, 413);

  const ip = '198.51.100.77';
  let last;
  for (let i = 0; i < 11; i += 1) last = await chatRequest('hello', { ip });
  assert.equal(last.status, 429);
  assert.equal(last.headers.get('retry-after'), '60');
});
