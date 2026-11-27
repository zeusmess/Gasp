// Renders the videos in plan.json.   node build.js <shard> <shards> [key,key...]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const W = __dirname, IC = path.join(W, 'ic'), OUT = path.join(W, 'out');
const { verse, surahName, BASMALA, forFont } = require(path.join(IC, 'lib-quran.js'));
const LIB = Object.fromEntries(require('./library.json').map(x => [x.id, x]));
const PLAN = require('./plan.json');
fs.mkdirSync(OUT, { recursive: true });
const FPS = 30;
const [shard, shards] = [+(process.argv[2] || 0), +(process.argv[3] || 1)];
const only = process.argv[4] ? process.argv[4].split(',') : null;
const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const dur = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const refText = ([s, a, b]) => `سورة ${surahName(s)} - ${a === b ? 'الآية ' + ar(a) : 'الآيات ' + ar(a) + '–' + ar(b)}`;
const range = ([s, a, b]) => { const t = []; for (let i = a; i <= b; i++) t.push(verse(s, i)); return t.join(' '); };

function chunk(text, max = 150) {
  if (text.length <= max) return [text];
  const words = text.split(' '), out = []; let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (next.length > max && cur) { out.push(cur); cur = w; } else cur = next;
    if (/[ۖ-ۛ]$/.test(w) && cur.length > max * 0.55) { out.push(cur); cur = ''; }
  }
  if (cur) { if (cur.length < 25 && out.length) out[out.length - 1] += ' ' + cur; else out.push(cur); }
  return out;
}

// split a recitation of several ayahs at the pauses closest to where each ayah should end
function splitAt(wav, weights) {
  const total = dur(wav);
  if (weights.length === 1) return [total];
  const log = require('child_process').spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', 'silencedetect=noise=-30dB:d=0.12', '-f', 'null', '-']).stderr.toString();
  let r; const st = [], en = [];
  const re1 = /silence_start: ([\d.]+)/g, re2 = /silence_end: ([\d.]+)/g;
  while ((r = re1.exec(log))) st.push(+r[1]);
  while ((r = re2.exec(log))) en.push(+r[1]);
  const mids = st.map((s, i) => (s + (en[i] ?? total)) / 2).filter(m => m > 0.5 && m < total - 0.5);
  const sum = weights.reduce((a, b) => a + b, 0); const cuts = []; let acc = 0, last = 0;
  for (let i = 0; i < weights.length - 1; i++) {
    acc += weights[i]; const want = total * acc / sum;
    const c = mids.filter(m => m > last + 1).sort((a, b) => Math.abs(a - want) - Math.abs(b - want))[0];
    const pick = c !== undefined && Math.abs(c - want) < total / weights.length * 0.6 ? c : want;
    cuts.push(pick); last = pick;
  }
  const ds = []; let p = 0; for (const c of [...cuts, total]) { ds.push(c - p); p = c; }
  return ds;
}

async function frames(page, T, setT, args, outFile, fps = FPS) {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', ...args, '-r', String(FPS),
    '-t', T.toFixed(2), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', outFile],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0, n = Math.ceil(T * fps); f < n; f++) {
    await setT(f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  if (await new Promise(r => ff.on('close', r)) !== 0) throw new Error('ffmpeg failed ' + outFile);
}

async function night(page, p, base) {
  const [s, a, b] = p.ayah, lib = LIB[p.audio];
  const pieces = [];
  if (lib.basmala) pieces.push({ texts: [BASMALA], basmala: true });
  for (let i = a; i <= b; i++) pieces.push({ texts: chunk(verse(s, i)), n: i });
  const ds = splitAt(lib.file, pieces.map(x => x.texts.join(' ').length));
  const INTRO = 0.3, OUTRO = 1.8, label = `سورة ${surahName(s)}`, sub = 'بصوت الشيخ محمد صديق المنشاوي';
  const segs = []; let t = INTRO;
  pieces.forEach((pc, j) => {
    const len = pc.texts.reduce((x, y) => x + y.length, 0);
    pc.texts.forEach((tx, k) => { const d = ds[j] * tx.length / len;
      segs.push({ text: forFont(tx), quran: true, label, sub, start: t, end: t + d, open: k === 0, close: k === pc.texts.length - 1,
        source: pc.basmala ? '' : `الآية ${ar(pc.n)}` }); t += d; });
  });
  segs[0].start = 0; const T = t + OUTRO; segs[segs.length - 1].end = T;
  await page.goto('file://' + path.join(IC, 'template.html'));
  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.evaluate(([q, d, sg]) => window.setupSegments(q, d, sg), [{ theme: 'isha', pill: 'تلاوة الليل', font: 'quran' }, p.label, segs]);
  await frames(page, T, x => page.evaluate(y => window.setSegT(y), x),
    ['-i', lib.file, '-filter_complex', `[1:a]aresample=44100,adelay=${INTRO * 1000}:all=1,apad,afade=t=out:st=${(T - 1).toFixed(2)}:d=1[a]`, '-map', '0:v', '-map', '[a]'], base + '.mp4', 15);
  await page.evaluate(x => window.setSegT(x), Math.max(segs[0].end - 0.5, 3));
  await page.screenshot({ path: base + '-cover.jpg', type: 'jpeg', quality: 90 });
  return T;
}

async function qiyam(page, p, base) {
  const lib = LIB[p.audio], D0 = 1.0, T = Math.max(10, D0 + lib.seconds + 1.8);
  await page.goto('file://' + path.join(IC, 'template.html'));
  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.evaluate(([q, d]) => window.setup(q, d, true), [{ theme: 'isha', pill: 'قيام الليل', prayer: '', label: 'دعاء من القرآن',
    text: forFont(range(p.ayah)), source: refText(p.ayah), font: 'quran' }, p.label]);
  await frames(page, T, x => page.evaluate(y => window.setT(y, 1e9), x),
    ['-i', lib.file, '-filter_complex', `[1:a]aresample=44100,adelay=${D0 * 1000}:all=1,apad,afade=t=out:st=${(T - 1.2).toFixed(2)}:d=1.2[a]`, '-map', '0:v', '-map', '[a]'], base + '.mp4', 15);
  await page.evaluate(() => window.setT(99, 1e9));
  await page.screenshot({ path: base + '-cover.jpg', type: 'jpeg', quality: 90 });
  return T;
}

async function hadith(page, p, base, seed) {
  const T = 20;
  await page.goto('file://' + path.join(IC, 'hadith.html'));
  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.evaluate(([h, s]) => window.setup(h, s), [p.hadith, seed]);
  // soft rain and wind only: no music, no voice
  const rain = `anoisesrc=color=pink:amplitude=0.5:seed=${seed * 7 + 1}:r=44100:d=${T}`;
  const rain2 = `anoisesrc=color=pink:amplitude=0.5:seed=${seed * 7 + 2}:r=44100:d=${T}`;
  const wind = `anoisesrc=color=brown:amplitude=0.7:seed=${seed * 7 + 3}:r=44100:d=${T}`;
  await frames(page, T, x => page.evaluate(y => window.setT(y), x),
    ['-f', 'lavfi', '-i', rain, '-f', 'lavfi', '-i', rain2, '-f', 'lavfi', '-i', wind, '-filter_complex',
      `[1:a]highpass=f=400,lowpass=f=5200,volume=0.62[l];[2:a]highpass=f=400,lowpass=f=5200,volume=0.62[r];[l][r]join=inputs=2:channel_layout=stereo[rn];` +
      `[3:a]lowpass=f=320,volume=0.9,aformat=channel_layouts=stereo,tremolo=f=0.12:d=0.5[w];` +
      `[rn][w]amix=inputs=2:normalize=0,afade=t=in:d=2,afade=t=out:st=${T - 2}:d=2[a]`, '-map', '0:v', '-map', '[a]'], base + '.mp4');
  await page.evaluate(() => window.setT(19));
  await page.screenshot({ path: base + '-cover.jpg', type: 'jpeg', quality: 90 });
  return T;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const todo = PLAN.filter(p => !p.drive).filter((p, i) => only ? only.includes(p.key) : i % shards === shard);
  for (const [i, p] of todo.entries()) {
    const base = path.join(OUT, p.key);
    if (!only && fs.existsSync(base + '.mp4') && fs.existsSync(base + '-cover.jpg')) continue;
    const t0 = Date.now();
    const T = p.type === 'night' ? await night(page, p, base) : p.type === 'qiyam' ? await qiyam(page, p, base) : await hadith(page, p, base, PLAN.indexOf(p));
    console.log(`[${shard}] ${i + 1}/${todo.length} ${p.key} ${p.type} ${T.toFixed(1)}s in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
