// Inventory of recitation audio already rendered into the repo's reels, and extraction of it.
//   node inventory.js <repo instagram-content dir> <out dir>
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const IC = process.argv[2], OUT = process.argv[3];
const { planFor } = require(path.join(IC, 'build_day.js'));
const { verse } = require(path.join(IC, 'lib-quran.js'));
fs.mkdirSync(path.join(OUT, 'audio'), { recursive: true });
const dur = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const RECITERS = { 'الشيخ محمد صديق المنشاوي': 'minshawi', 'الشيخ عبد الباسط عبد الصمد': 'abdulbasit', 'الشيخ محمود خليل الحصري': 'husary', 'الشيخ مشاري العفاسي': 'alafasy', 'الشيخ ماهر المعيقلي': 'maher' };
const strip = s => s.replace(/[^ء-ي ]/g, '').replace(/\s+/g, ' ').trim();
const lib = [];
for (const date of fs.readdirSync(path.join(IC, 'out')).sort()) {
  const pj = path.join(IC, 'out', date, 'posts.json');
  if (!fs.existsSync(pj)) continue;
  const posts = JSON.parse(fs.readFileSync(pj, 'utf8')).posts;
  const plan = planFor(date);
  for (const p of posts) {
    if (!p.audio) continue;
    const base = path.join(IC, 'out', date, `${p.time.replace(':', '')}-${p.id}`);
    if (p.kind === 'video' && /^reel/.test(p.id) && plan) {
      const pp = plan.posts.find(x => x.id === p.id);
      if (!pp || !pp.ayah) continue;
      const [s, a, b] = pp.ayah;
      const cap = strip(fs.readFileSync(base + '.txt', 'utf8'));
      if (!cap.includes(strip(verse(s, a)).slice(0, 25))) { console.warn('mismatch', date, p.id); continue; }
      const f = base + '.mp4'; if (!fs.existsSync(f)) continue;
      const T = dur(f), len = T - 0.3 - 1.8;
      const id = `minshawi_${s}_${a}_${b}`;
      const o = path.join(OUT, 'audio', id + '.wav');
      if (!fs.existsSync(o)) execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', '0.3', '-t', len.toFixed(3), '-i', f, '-vn', '-ac', '2', '-ar', '44100', o]);
      lib.push({ id, kind: 'reel', reciter: 'minshawi', ayah: [s, a, b], basmala: a === 1 && s !== 1 && s !== 9, file: o, seconds: +dur(o).toFixed(2), from: `${date}/${p.id}` });
    } else if (p.kind === 'dual' && p.bgAyah && p.bgAyah !== '-' && RECITERS[p.reciter]) {
      const f = base + '-tiktok.mp4'; if (!fs.existsSync(f)) continue;
      const [s, a] = p.bgAyah.split(':').map(Number);
      const r = RECITERS[p.reciter], id = `${r}_${s}_${a}`;
      const o = path.join(OUT, 'audio', id + '.wav');
      if (!fs.existsSync(o)) execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', '0.4', '-i', f, '-vn', '-ac', '2', '-ar', '44100',
        '-af', 'areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.15,areverse', o]);
      lib.push({ id, kind: 'single', reciter: r, ayah: [s, a, a], file: o, seconds: +dur(o).toFixed(2), from: `${date}/${p.id}` });
    }
  }
}
const uniq = Object.values(Object.fromEntries(lib.map(x => [x.id, x])));
fs.writeFileSync(path.join(OUT, 'library.json'), JSON.stringify(uniq, null, 1));
const c = {}; uniq.forEach(x => { const k = x.kind + ':' + x.reciter; c[k] = (c[k] || 0) + 1; });
console.log(uniq.length, c);
