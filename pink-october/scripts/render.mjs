// Deterministic frame renderer.
//   node scripts/render.mjs --from 0 --to 52.8 --fps 30 --scale 1 --out renders/final/frames.mp4
//   node scripts/render.mjs --from 9 --to 12 --fps 6 --scale 0.3 --sheet renders/previews/sheet.jpg
// Every frame depends only on t, so preview frames match final frames.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)('playwright');
const PROJECT = path.resolve(HERE, '..');
const ROOT = path.resolve(PROJECT, '..'); // repo root, serves /dist (GSAP) too

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const from = parseFloat(args.from ?? 0);
const fps = parseFloat(args.fps ?? 30);
const scale = parseFloat(args.scale ?? 1);
const W = Math.round(1080 * scale), H = Math.round(1920 * scale);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/pink-october/src/index.html?scale=${scale}`);
const info = await page.evaluate(() => window.ready);
const to = Math.min(parseFloat(args.to ?? info.duration), info.duration);
fs.writeFileSync(path.join(PROJECT, 'cache/timing.json'), JSON.stringify(await page.evaluate(async () => {
  const m = await import('./timing.js'); return { T: m.T, HUGS: m.HUGS, BPM: m.BPM, DURATION: m.DURATION };
})));

const n = Math.max(1, Math.round((to - from) * fps));
const times = Array.from({ length: n }, (_, i) => +(from + i / fps).toFixed(4));
const cdp = await page.context().newCDPSession(page);
async function grab(fmt) {
  const r = await cdp.send('Page.captureScreenshot', { format: fmt, quality: fmt === 'jpeg' ? 95 : undefined, optimizeForSpeed: true });
  return Buffer.from(r.data, 'base64');
}

const t0 = Date.now();
if (args.sheet) {
  const dir = path.join(PROJECT, 'cache/sheet_frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < times.length; i++) {
    await page.evaluate((t) => window.renderAt(t), times[i]);
    fs.writeFileSync(path.join(dir, `${String(i).padStart(4, '0')}_${times[i].toFixed(2)}.jpg`), await grab('jpeg'));
  }
  execFileSync('python3', [path.join(HERE, 'sheet.py'), dir, path.resolve(PROJECT, args.sheet), String(args.cols ?? 6)], { stdio: 'inherit' });
} else {
  const out = path.resolve(PROJECT, args.out ?? 'renders/previews/preview.mp4');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', args.preset ?? 'medium', '-crf', String(args.crf ?? 16), '-pix_fmt', 'yuv420p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < times.length; i++) {
    await page.evaluate((t) => window.renderAt(t), times[i]);
    const buf = await grab('jpeg');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 30 === 0) process.stderr.write(`\r${times[i].toFixed(2)}s  ${i + 1}/${n}  ${((Date.now() - t0) / (i + 1)).toFixed(0)} ms/frame   `);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.error(`\nwrote ${out}`);
}
console.error(`${n} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await browser.close();
server.close();
