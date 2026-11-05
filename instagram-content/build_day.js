// Builds one day of the 30-day series: 5 Reels (one after each prayer), each with
// Sheikh Muhammad Siddiq al-Minshawi reciting the day's ayah, then a dhikr/dua screen.
//
//   node build_day.js 2026-11-07            -> out/2026-11-07/*.mp4, *-cover.png, posts.json
//   node build_day.js 2026-11-07 --only asr,maghrib,isha
//
// Audio comes from everyayah.com (per-ayah MP3s). If it cannot be downloaded, the
// Reel is rendered silent and posts.json records audio:false so the caption does not
// claim a recitation that is not there.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const adhan = require('adhan');
const { AYAT, FRIDAY, ADHKAR } = require('./plan-data');
const { verse, surahName, BASMALA, forFont } = require('./lib-quran');

const START = '2026-11-05', END = '2026-12-04';
const TZ = 'Africa/Cairo';
const FPS = 30, INTRO = 1.6, DHIKR = 7.5;
const RECITER = 'Minshawy_Murattal_128kbps';
const AUDIO_URL = f => `https://everyayah.com/data/${RECITER}/${f}`;
const CAIRO = new adhan.Coordinates(30.0444, 31.2357);

const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const pad3 = n => String(n).padStart(3, '0');
const SLOTS = [
  { id: 'fajr', key: 'F', prayer: 'الفجر' },
  { id: 'dhuhr', key: 'D', prayer: 'الظهر' },
  { id: 'asr', key: 'A', prayer: 'العصر' },
  { id: 'maghrib', key: 'M', prayer: 'المغرب' },
  { id: 'isha', key: 'I', prayer: 'العشاء' },
];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const HOOKS = {
  F: ['ابدأ يومك بكلام الله ☀️', 'أول حاجة تسمعها النهارده 🤍', 'صباحك قرآن وذكر ☀️', 'دقيقة تنوّر بيها يومك ☀️'],
  D: ['استراحة قصيرة من الشغل… مع كلام الله 🤍', 'وسط زحمة اليوم، افتكر ربنا 🤍', 'خد نفس وافتكر 🤍', 'رسالة لقلبك في نص اليوم 🤍'],
  A: ['بعد العصر… لحظة هدوء 🤲', 'وقت العصر وقت دعاء 🤲', 'اسمعها للآخر 🤍', 'آية تطمّن قلبك 🤲'],
  M: ['مع غروب الشمس… 🌙', 'أذكار المساء وتلاوة تريّح القلب 🌙', 'ختام يومك بذكر 🌙', 'قبل ما الليل يبدأ 🌙'],
  I: ['قبل ما تنام اسمع دي 🌙', 'آخر حاجة في يومك 🌙', 'تصبح على خير وقرآن 🌙', 'نام وقلبك مطمئن 🌙'],
};
const CTAS = [
  '📌 احفظ الريل وارجعله كل يوم.',
  '🔁 شاركها في الستوري، وليك أجر كل حد يسمعها بسببك.',
  '✍️ اكتب «سبحان الله» في الكومنتات.',
  '💬 ابعتها لحد بتحبه.',
  '🤲 اكتب دعوة في الكومنتات وكل اللي يقرأها يقول آمين.',
];
const TAGS = {
  F: '#قرآن #أذكار_الصباح #تلاوة #المنشاوي #الباقيات_الصالحات',
  D: '#قرآن #تلاوة #المنشاوي #ذكر_الله #الباقيات_الصالحات',
  A: '#قرآن #دعاء #تلاوة_خاشعة #المنشاوي #الباقيات_الصالحات',
  M: '#قرآن #أذكار_المساء #تلاوة #المنشاوي #الباقيات_الصالحات',
  I: '#قرآن #ذكر_قبل_النوم #تلاوة_هادئة #المنشاوي #الباقيات_الصالحات',
};

function cairoParts(date) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
  const [h, m] = f.format(date).split(':').map(Number); return h * 60 + m;
}
const hhmm = mins => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
const round5 = m => Math.round(m / 5) * 5;

function planFor(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const idx = Math.round((d - new Date(START + 'T12:00:00Z')) / 864e5);
  const last = Math.round((new Date(END + 'T12:00:00Z') - new Date(START + 'T12:00:00Z')) / 864e5);
  if (idx < 0 || idx > last) return null;
  const friday = d.getUTCDay() === 5;
  let fridaysBefore = 0;
  for (let i = 0; i < idx; i++) if (new Date(+new Date(START + 'T12:00:00Z') + i * 864e5).getUTCDay() === 5) fridaysBefore++;
  const pt = new adhan.PrayerTimes(CAIRO, new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), adhan.CalculationMethod.Egyptian());
  const times = {
    F: 7 * 60 + 15,
    D: friday ? 12 * 60 + 45 : round5(cairoParts(pt.dhuhr) + 20),
    A: round5(cairoParts(pt.asr) + 25),
    M: round5(cairoParts(pt.maghrib) + 15),
    I: round5(cairoParts(pt.isha) + 15),
  };
  const pools = {}; for (const k of 'FDAMI') pools[k] = AYAT.filter(a => a[3] === k);
  return {
    idx, friday, label: `${DAYS_AR[d.getUTCDay()]} · ${ar(d.getUTCDate())} ${MONTHS_AR[d.getUTCMonth()]}`,
    slots: SLOTS.map(s => ({
      ...s, prayer: s.key === 'D' && friday ? 'الجمعة' : s.prayer, time: hhmm(times[s.key]),
      ayah: s.key === 'D' && friday ? FRIDAY[fridaysBefore % FRIDAY.length] : pools[s.key][(s.key === 'D' ? idx - fridaysBefore : idx) % pools[s.key].length],
      dhikr: ADHKAR[s.key][idx % ADHKAR[s.key].length],
    })),
  };
}

// split a long ayah into screens at pause marks (or spaces), each <= max chars
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

async function buildSlot(page, plan, slot, outDir, cache) {
  const [s, a, b] = slot.ayah;
  // pieces: [audioFile, texts[]]
  const pieces = [];
  if (a === 1 && s !== 1 && s !== 9) pieces.push({ file: '001001.mp3', texts: [BASMALA], basmala: true });
  for (let i = a; i <= b; i++) pieces.push({ file: `${pad3(s)}${pad3(i)}.mp3`, texts: chunk(verse(s, i)), n: i });

  let audio = true;
  for (const p of pieces) { p.path = await fetchAudio(p.file, cache); if (!p.path) audio = false; }

  const ref = a === b ? `الآية ${ar(a)}` : `الآيات ${ar(a)}–${ar(b)}`;
  const label = `سورة ${surahName(s)}`;
  const sub = audio ? 'بصوت الشيخ محمد صديق المنشاوي' : '';
  const segs = []; let t = INTRO;
  for (const p of pieces) {
    const total = audio ? duration(p.path) : p.texts.reduce((x, y) => x + Math.max(3.5, y.length * 0.11), 0);
    const len = p.texts.reduce((x, y) => x + y.length, 0);
    p.texts.forEach((tx, k) => {
      const d = total * tx.length / len;
      segs.push({ text: forFont(tx), quran: true, label, sub, start: t, end: t + d,
        open: k === 0, close: k === p.texts.length - 1,
        source: p.basmala ? '' : (a === b ? ref : `الآية ${ar(p.n)}`) });
      t += d;
    });
  }
  segs[0].start = 0;
  const recEnd = t + 0.6;
  const dk = slot.dhikr;
  segs.push({ text: dk.text, quran: false, label: dk.label, sub: '', note: dk.note, source: dk.source, start: recEnd, end: recEnd + DHIKR });
  const T = recEnd + DHIKR;

  const base = path.join(outDir, `${slot.time.replace(':', '')}-${slot.id}`);
  const post = { theme: slot.id, prayer: slot.prayer, font: 'quran' };
  await page.evaluate(([p, d, sg]) => window.setupSegments(p, d, sg), [post, plan.label, segs]);

  // soundtrack: intro silence + recitation + silence under the dhikr screen
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-'];
  if (audio) {
    const list = path.join(cache, `list-${slot.id}.txt`);
    fs.writeFileSync(list, pieces.map(p => `file '${p.path}'`).join('\n'));
    args.push('-f', 'concat', '-safe', '0', '-i', list,
      '-filter_complex', `[1:a]aresample=44100,adelay=${Math.round(INTRO * 1000)}:all=1,apad,afade=t=out:st=${(T - 1.2).toFixed(2)}:d=1.2[a]`,
      '-map', '0:v', '-map', '[a]');
  } else {
    args.push('-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-map', '0:v', '-map', '1:a');
  }
  args.push('-t', T.toFixed(2), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '19',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', base + '.mp4');
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.ceil(T * FPS);
  for (let f = 0; f < frames; f++) {
    await page.evaluate(x => window.setSegT(x), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  const code = await new Promise(r => ff.on('close', r));
  if (code !== 0) throw new Error('ffmpeg failed for ' + slot.id);

  // cover = first ayah screen fully shown
  await page.evaluate(x => window.setSegT(x), Math.max(segs[0].end - 0.5, INTRO + 2.5));
  await page.screenshot({ path: base + '-cover.png' });

  // caption
  const ayahText = []; for (let i = a; i <= b; i++) ayahText.push(verse(s, i));
  const k = slot.key, n = plan.idx;
  const caption = [
    HOOKS[k][n % HOOKS[k].length], '',
    `﴿${ayahText.join(' ')}﴾`,
    `[سورة ${surahName(s)}: ${a === b ? a : a + '-' + b}]`,
    audio ? '🎧 بصوت الشيخ محمد صديق المنشاوي' : null, '',
    `${dk.label}:`, `«${dk.text}»${dk.note ? ` (${dk.note})` : ''}`, `(${dk.source})`, '',
    CTAS[(n + 'FDAMI'.indexOf(k)) % CTAS.length], '',
    TAGS[k],
  ].filter(x => x !== null).join('\n');
  fs.writeFileSync(base + '.txt', caption + '\n');
  console.log(`${slot.time} ${slot.id}  ${s}:${a}-${b}  ${T.toFixed(1)}s  audio=${audio}`);
  return { id: slot.id, time: slot.time, file: path.basename(base) + '.mp4', cover: path.basename(base) + '-cover.png',
    caption, audio, ayah: `${s}:${a}-${b}`, seconds: +T.toFixed(1) };
}

async function main() {
  const date = process.argv[2], only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
  const plan = planFor(date);
  if (!plan) {
    if (date < START) { console.log(`Series starts ${START}; nothing to build for ${date}.`); process.exit(4); }
    console.log(`No plan for ${date} (series runs ${START} to ${END}).`); process.exit(3);
  }
  const outDir = path.join(__dirname, 'out', date), cache = path.join(__dirname, 'cache');
  fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(cache, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'template.html'));
  const posts = [];
  for (const slot of plan.slots) if (!only || only.includes(slot.id)) posts.push(await buildSlot(page, plan, slot, outDir, cache));
  await browser.close();
  fs.writeFileSync(path.join(outDir, 'posts.json'), JSON.stringify({ date, posts }, null, 2));
}
if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { planFor };
