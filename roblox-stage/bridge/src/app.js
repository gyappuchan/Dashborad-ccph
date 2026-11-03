import { spawn } from 'node:child_process';
import { startServer } from './server.js';

const port = Number(process.env.PORT) || 3939;
const { port: p } = await startServer({ port }).catch((e) => {
  console.error(e.code === 'EADDRINUSE' ? `พอร์ต ${port} ถูกใช้อยู่ ลอง PORT=3940 npm run app` : e.message);
  process.exit(1);
});
const url = `http://localhost:${p}`;
console.log(`แอปพร้อมแล้ว เปิดที่ ${url}`);

// Try to open the browser; ignore failures (headless machines).
const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
try {
  spawn(opener, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
} catch {
  /* no browser */
}
