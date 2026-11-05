// Builds one day of the series for @baqiiyaat (Instagram + TikTok): 3 feed posts and 5 stories a day:
//
//   prayer duas   5 Instagram Stories, one after each prayer (times follow the prayer)
//   reels         2 Reels with Sheikh al-Minshawi's recitation at 10:00 and 18:00 (Instagram + TikTok)
//   midday        1 image at 13:00, rotating hadith / dua from the Quran / ayah (Instagram + TikTok)
//
//   node build_day.js 2026-11-07                 -> out/2026-11-07/*, posts.json
//   node build_day.js 2026-11-07 --only reel1,hadith
//
// Quran text always comes from quran-json. Audio comes from everyayah.com; if it cannot
// be downloaded the Reel is rendered silent and posts.json records audio:false.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const adhan = require('adhan');
const { AYAT, FRIDAY, ADHKAR, QDUAS, HADITH } = require('./plan-data');
const { verse, surahName, BASMALA, forFont } = require('./lib-quran');

const START = '2026-11-05', END = '2026-12-04';
const TZ = 'Africa/Cairo';
const FPS = 30, INTRO = 0.3, OUTRO = 1.8;
const RECITER = 'Minshawy_Murattal_128kbps';
const AUDIO_URL = f => `https://everyayah.com/data/${RECITER}/${f}`;
const CAIRO = new adhan.Coordinates(30.0444, 31.2357);

const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const pad3 = n => String(n).padStart(3, '0');
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const PRAYERS = [
  { id: 'fajr', key: 'F', prayer: 'الفجر' }, { id: 'dhuhr', key: 'D', prayer: 'الظهر' },
  { id: 'asr', key: 'A', prayer: 'العصر' }, { id: 'maghrib', key: 'M', prayer: 'المغرب' },
  { id: 'isha', key: 'I', prayer: 'العشاء' },
];

const pick = (arr, n) => arr[n % arr.length];
const CTAS = [
  '📌 احفظ البوست وارجعله.', '🔁 شاركه، وليك أجر كل حد يقرأه بسببك.', '✍️ اكتب «آمين» في الكومنتات.',
  '💬 ابعته لحد بتحبه.', '🤍 تابع الحساب عشان يوصلك كل يوم.',
];
const TAGS = {
  dua: '#دعاء #أدعية #ذكر_الله #اسلام #الباقيات_الصالحات',
  reel: '#قرآن #تلاوة_خاشعة #المنشاوي #قرآن_كريم #الباقيات_الصالحات',
  hadith: '#حديث_شريف #سنة_نبوية #حديث #اسلام #الباقيات_الصالحات',
  qdua: '#دعاء #أدعية_قرآنية #قرآن #ربنا #الباقيات_الصالحات',
  ayah: '#آية #قرآن #آيات_قرآنية #تدبر #الباقيات_الصالحات',
};
const REEL_HOOKS = ['اسمعها للآخر 🎧', 'تلاوة تريّح القلب 🤍', 'آية النهارده 🎧', 'خد دقيقة مع كلام الله 🤍', 'صوت الشيخ المنشاوي 🎧'];

function cairoMinutes(date) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
  const [h, m] = f.format(date).split(':').map(Number); return h * 60 + m;
}
const hhmm = mins => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
const round5 = m => Math.round(m / 5) * 5;
const dayNumber = s => Math.floor(new Date(s + 'T12:00:00Z') / 864e5);

function planFor(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const idx = dayNumber(dateStr) - dayNumber(START);
  if (idx < 0 || dateStr > END) return null;
  const friday = d.getUTCDay() === 5;
  let fridaysBefore = 0;
  for (let i = 0; i < idx; i++) if (new Date((dayNumber(START) + i) * 864e5 + 432e5).getUTCDay() === 5) fridaysBefore++;
  const pt = new adhan.PrayerTimes(CAIRO, new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), adhan.CalculationMethod.Egyptian());
  const pmin = { F: cairoMinutes(pt.fajr), D: cairoMinutes(pt.dhuhr), A: cairoMinutes(pt.asr), M: cairoMinutes(pt.maghrib), I: cairoMinutes(pt.isha) };
  const after = { F: round5(pmin.F + 20), D: friday ? 12 * 60 + 45 : round5(pmin.D + 20), A: round5(pmin.A + 20), M: round5(pmin.M + 15), I: round5(pmin.I + 15) };

  // Reels: morning one from the fajr/dhuhr pools, evening one from maghrib/isha pools
  const morning = AYAT.filter(a => a[3] === 'F' || a[3] === 'D'), evening = AYAT.filter(a => a[3] === 'M' || a[3] === 'I');
  const ayahImgs = AYAT.filter(a => a[3] === 'A');
  const posts = [];
  for (const p of PRAYERS) posts.push({ id: `dua-${p.id}`, kind: 'story', type: 'prayerDua', time: hhmm(after[p.key]), theme: p.id,
    pill: `بعد صلاة ${p.key === 'D' && friday ? 'الجمعة' : p.prayer}`, item: pick(ADHKAR[p.key], idx) });
  posts.push({ id: 'reel1', kind: 'video', type: 'reel', time: '10:00', theme: 'dhuhr', pill: 'تلاوة اليوم',
    ayah: friday ? pick(FRIDAY, fridaysBefore) : pick(morning, idx * 2) });
  posts.push({ id: 'reel2', kind: 'video', type: 'reel', time: '18:00', theme: 'maghrib', pill: 'تلاوة المساء', ayah: pick(evening, idx * 2) });
  // one feed image a day, rotating hadith / dua from the Quran / ayah
  const midTime = friday ? '13:30' : '13:00', r = Math.floor(idx / 3);
  posts.push([
    { id: 'hadith', kind: 'image', type: 'hadith', time: midTime, theme: 'dhuhr', pill: 'حديث اليوم', item: pick(HADITH, r) },
    { id: 'qdua', kind: 'image', type: 'qdua', time: midTime, theme: 'asr', pill: 'دعاء من القرآن', ayah: pick(QDUAS, r) },
    { id: 'ayah', kind: 'image', type: 'ayah', time: midTime, theme: 'isha', pill: 'آية وتدبر', ayah: pick(ayahImgs, r) },
  ][idx % 3]);
  posts.sort((x, y) => x.time.localeCompare(y.time));
  return { idx, friday, label: `${DAYS_AR[d.getUTCDay()]} · ${ar(d.getUTCDate())} ${MONTHS_AR[d.getUTCMonth()]}`, posts };
}

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

async function fetchAudio(file, cache) {
  const p = path.join(cache, file);
  if (fs.existsSync(p) && fs.statSync(p).size > 1000) return p;
  try {
    // curl honours the environment's HTTPS proxy settings (Node's fetch does not)
    execFileSync('curl', ['-sSf', '--max-time', '60', '--retry', '3', '-o', p, AUDIO_URL(file)]);
    if (fs.statSync(p).size < 1000) throw new Error('file too small');
    return p;
  } catch (e) { console.warn('audio unavailable', file, e.message); return null; }
}
const duration = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const ayahRange = ([s, a, b]) => { const t = []; for (let i = a; i <= b; i++) t.push(verse(s, i)); return t.join(' '); };
const refText = ([s, a, b]) => `سورة ${surahName(s)} - ${a === b ? 'الآية ' + ar(a) : 'الآيات ' + ar(a) + '–' + ar(b)}`;
const refShort = ([s, a, b]) => `[${surahName(s)}: ${a === b ? a : a + '-' + b}]`;

async function buildReel(page, plan, post, base, cache) {
  const [s, a, b] = post.ayah;
  const pieces = [];
  if (a === 1 && s !== 1 && s !== 9) pieces.push({ file: '001001.mp3', texts: [BASMALA], basmala: true });
  for (let i = a; i <= b; i++) pieces.push({ file: `${pad3(s)}${pad3(i)}.mp3`, texts: chunk(verse(s, i)), n: i });
  let audio = true;
  for (const p of pieces) { p.path = await fetchAudio(p.file, cache); if (!p.path) audio = false; }

  const label = `سورة ${surahName(s)}`, sub = audio ? 'بصوت الشيخ محمد صديق المنشاوي' : '';
  const segs = []; let t = INTRO;
  for (const p of pieces) {
    const total = audio ? duration(p.path) : p.texts.reduce((x, y) => x + Math.max(3.5, y.length * 0.11), 0);
    const len = p.texts.reduce((x, y) => x + y.length, 0);
    p.texts.forEach((tx, k) => {
      const d = total * tx.length / len;
      segs.push({ text: forFont(tx), quran: true, label, sub, start: t, end: t + d, open: k === 0, close: k === p.texts.length - 1,
        source: p.basmala ? '' : (a === b ? `الآية ${ar(a)}` : `الآية ${ar(p.n)}`) });
      t += d;
    });
  }
  segs[0].start = 0;
  segs[segs.length - 1].end = t + OUTRO;
  const T = t + OUTRO;
  await page.evaluate(([p, d, sg]) => window.setupSegments(p, d, sg), [{ theme: post.theme, pill: post.pill, font: 'quran' }, plan.label, segs]);

  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-'];
  if (audio) {
    const list = path.join(cache, `list-${post.id}.txt`);
    fs.writeFileSync(list, pieces.map(p => `file '${p.path}'`).join('\n'));
    args.push('-f', 'concat', '-safe', '0', '-i', list,
      '-filter_complex', `[1:a]aresample=44100,adelay=${Math.round(INTRO * 1000)}:all=1,apad,afade=t=out:st=${(T - 1.0).toFixed(2)}:d=1.0[a]`,
      '-map', '0:v', '-map', '[a]');
  } else args.push('-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-map', '0:v', '-map', '1:a');
  args.push('-t', T.toFixed(2), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '19',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', base + '.mp4');
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0, n = Math.ceil(T * FPS); f < n; f++) {
    await page.evaluate(x => window.setSegT(x), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  if (await new Promise(r => ff.on('close', r)) !== 0) throw new Error('ffmpeg failed for ' + post.id);
  await page.evaluate(x => window.setSegT(x), Math.max(segs[0].end - 0.5, 3));
  await page.screenshot({ path: base + '-cover.png' });

  const caption = [pick(REEL_HOOKS, plan.idx + (post.id === 'reel2' ? 2 : 0)), '',
    `﴿${ayahRange(post.ayah)}﴾`, refShort(post.ayah).replace('[', '[سورة '),
    audio ? '🎧 بصوت الشيخ محمد صديق المنشاوي' : null, '',
    pick(CTAS, plan.idx + (post.id === 'reel2' ? 1 : 0)), '', TAGS.reel].filter(x => x !== null).join('\n');
  return { audio, seconds: +T.toFixed(1), caption, file: path.basename(base) + '.mp4', cover: path.basename(base) + '-cover.png',
    title: `${label} | تلاوة الشيخ المنشاوي` };
}

async function buildImage(page, plan, post, base) {
  let card, caption, title;
  const n = plan.idx + post.id.length;
  if (post.type === 'prayerDua') {
    const it = post.item;
    card = { label: it.label, text: it.text, note: it.note, source: it.source, font: 'dhikr' };
    caption = [`${post.pill} 🤲`, '', `«${it.text}»${it.note ? ` (${it.note})` : ''}`, `(${it.source})`, '', pick(CTAS, n), '', TAGS.dua].join('\n');
    title = `${post.pill} | ${it.label}`;
  } else if (post.type === 'hadith') {
    const it = post.item;
    card = { label: 'قال رسول الله ﷺ', text: it.text, note: it.note, source: it.source, font: 'dhikr' };
    caption = ['حديث اليوم 🤍', '', `قال رسول الله ﷺ: «${it.text}»`, `(${it.source})`, it.note ? `${it.note}` : null, '', pick(CTAS, n), '', TAGS.hadith].filter(x => x !== null).join('\n');
    title = 'حديث اليوم';
  } else {
    const isDua = post.type === 'qdua';
    card = { label: isDua ? 'دعاء من القرآن' : `سورة ${surahName(post.ayah[0])}`, text: forFont(ayahRange(post.ayah)), source: refText(post.ayah), font: 'quran' };
    caption = [isDua ? 'دعاء من القرآن… ردّده معانا 🤲' : 'آية اليوم 🤍 اقرأها بتدبر', '', `﴿${ayahRange(post.ayah)}﴾`, refShort(post.ayah).replace('[', '[سورة '),
      '', pick(CTAS, n), '', isDua ? TAGS.qdua : TAGS.ayah].join('\n');
    title = isDua ? 'دعاء من القرآن' : 'آية اليوم';
  }
  await page.evaluate(([p, d, v]) => window.setup(p, d, v), [{ theme: post.theme, pill: post.pill, prayer: '', ...card }, plan.label, post.kind === 'story']);
  await page.evaluate(() => window.setT(99, 99));
  await page.screenshot({ path: base + '.png' });
  return { caption, file: path.basename(base) + '.png', title };
}

async function main() {
  const date = process.argv[2];
  const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
  const plan = planFor(date);
  if (!plan) {
    if (date < START) { console.log(`Series starts ${START}; nothing to build for ${date}.`); process.exit(4); }
    console.log(`No plan for ${date} (series runs ${START} to ${END}).`); process.exit(3);
  }
  const outDir = path.join(__dirname, 'out', date), cache = path.join(__dirname, 'cache');
  fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(cache, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + path.join(__dirname, 'template.html'));
  const done = [];
  for (const post of plan.posts) {
    if (only && !only.includes(post.id)) continue;
    const base = path.join(outDir, `${post.time.replace(':', '')}-${post.id}`);
    await page.setViewportSize({ width: 1080, height: post.kind === 'image' ? 1350 : 1920 });
    const r = post.kind === 'video' ? await buildReel(page, plan, post, base, cache) : await buildImage(page, plan, post, base);
    fs.writeFileSync(base + '.txt', r.caption + '\n');
    done.push({ id: post.id, kind: post.kind, time: post.time, ...r });
    console.log(`${post.time} ${post.id}${post.kind === 'video' ? `  ${post.ayah.slice(0, 3).join(':')}  ${r.seconds}s  audio=${r.audio}` : ''}`);
  }
  await browser.close();
  // merge with posts already built for this date (when --only is used)
  const pj = path.join(outDir, 'posts.json');
  let prev = []; try { prev = JSON.parse(fs.readFileSync(pj, 'utf8')).posts.filter(p => p.version === 2); } catch {}
  const all = [...prev.filter(p => !done.some(d => d.id === p.id)), ...done.map(d => ({ ...d, version: 2 }))].sort((x, y) => x.time.localeCompare(y.time));
  fs.writeFileSync(pj, JSON.stringify({ date, version: 2, posts: all }, null, 2));
}
if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { planFor };
