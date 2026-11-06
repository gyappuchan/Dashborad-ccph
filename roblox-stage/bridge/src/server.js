import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createController } from './controller.js';
import { loadConfig, mergeConfig, saveConfig, publicConfig } from './config.js';
import { listThemes } from './themes.js';
import { listGifts } from './gifts.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(join(HERE, 'ui.html'), 'utf8');

/** Only accept requests addressed to this machine (blocks DNS-rebinding and cross-site POSTs). */
export function isLocalRequest(req, port) {
  const allowedHosts = [`localhost:${port}`, `127.0.0.1:${port}`];
  if (!allowedHosts.includes(req.headers.host)) return false;
  const origin = req.headers.origin;
  if (origin && !allowedHosts.some((h) => origin === `http://${h}`)) return false;
  return true;
}

export function startServer({ port = 3939 } = {}) {
  let config = loadConfig();
  const logs = [];
  const clients = new Set();

  function log(line) {
    const entry = `${new Date().toLocaleTimeString('th-TH')}  ${line}`;
    console.log(entry);
    logs.push(entry);
    if (logs.length > 300) logs.shift();
    for (const res of clients) res.write(`data: ${JSON.stringify(entry)}\n\n`);
  }

  const controller = createController({ log });

  function json(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (c) => {
        data += c;
        if (data.length > 20_000) {
          reject(new Error('body too large'));
          req.destroy();
        }
      });
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch {
          reject(new Error('invalid JSON'));
        }
      });
    });
  }

  const server = http.createServer(async (req, res) => {
    if (!isLocalRequest(req, port)) return json(res, 403, { error: 'forbidden' });
    const url = new URL(req.url, `http://localhost:${port}`);

    try {
      if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(HTML);
      }
      if (req.method === 'GET' && url.pathname === '/api/state') {
        return json(res, 200, { running: controller.isRunning(), config: publicConfig(config), themes: listThemes(), gifts: listGifts(), logs });
      }
      if (req.method === 'GET' && url.pathname === '/api/events') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
        res.write(': connected\n\n');
        clients.add(res);
        req.on('close', () => clients.delete(res));
        return;
      }
      if (req.method === 'POST') {
        if (!String(req.headers['content-type']).startsWith('application/json')) {
          return json(res, 415, { error: 'JSON only' });
        }
        const body = await readBody(req);
        if (url.pathname === '/api/config') {
          config = mergeConfig(config, body);
          saveConfig(config);
          return json(res, 200, { config: publicConfig(config) });
        }
        if (url.pathname === '/api/start') {
          await controller.start(config);
          return json(res, 200, { running: true });
        }
        if (url.pathname === '/api/stop') {
          controller.stop();
          return json(res, 200, { running: false });
        }
        if (url.pathname === '/api/theme') {
          await controller.sendTheme(config, String(body.name ?? ''));
          return json(res, 200, { ok: true });
        }
        if (url.pathname === '/api/test') {
          await controller.sendTest(config, body);
          return json(res, 200, { ok: true });
        }
      }
      json(res, 404, { error: 'not found' });
    } catch (err) {
      log(`[error] ${err.message}`);
      json(res, 400, { error: err.message });
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve({ server, controller, port }));
  });
}
