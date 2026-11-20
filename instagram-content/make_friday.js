// One-off Friday special (premium gold glass): image post + Reel on salawat on the Prophet ﷺ.
//   node make_friday.js 2026-11-20
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { verse, forFont } = require('./lib-quran');

const date = process.argv[2];
const OUT = path.join(__dirname, 'out', date);
fs.mkdirSync(OUT, { recursive: true });
const FPS = 30;

const audio = a => {
  const f = path.join(__dirname, 'cache', `Minshawy_Murattal_128kbps-${a}.mp3`);
  if (!fs.existsSync(f)) execFileSync('curl', ['-sSf', '--max-time', '60', '-o', f, `https://everyayah.com/data/Minshawy_Murattal_128kbps/${a}.mp3`]);
  return f;
};
const dur = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

const HADITH_FRIDAY = '«إنَّ مِن أفضلِ أيامِكم يومَ الجمعةِ… فأكثِروا عليَّ من الصلاةِ فيه، فإنَّ صلاتَكم معروضةٌ عليَّ»';
const SRC_FRIDAY = 'رواه أبو داود والنسائي وابن ماجه بإسناد صحيح';
const HADITH_TEN = '«مَن صلَّى عليَّ صلاةً، صلَّى اللهُ عليه بها عشرًا»';

(async () => {
  const browser = await chromium.launch();

  // 1) image post 1080x1350
  const p1 = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await p1.goto('file://' + path.join(__dirname, 'friday.html'));
  await p1.evaluate(o => window.setup(o), {
    vertical: false, badge: 'جمعة مباركة', title: 'الصلاة على النبي', titleSize: 96,
    sub: 'أعظم ما تملأ به يوم الجمعة', text: HADITH_FRIDAY, fs: 54, source: SRC_FRIDAY,
    note: 'وقال ﷺ: ' + HADITH_TEN + '\n(رواه مسلم)' });
  await p1.evaluate(() => document.fonts.ready);
  await p1.evaluate(() => window.setT(4.2));
  const img = path.join(OUT, '1100-friday-post');
  await p1.screenshot({ path: img + '.png' });
  await p1.screenshot({ path: img + '.jpg', type: 'jpeg', quality: 95 });

  // 2) Reel 1080x1920 with al-Minshawi: al-Ahzab 56 then al-Ahzab 43
  const a1 = audio('033056'), a2 = audio('033043');
  const d1 = dur(a1), d2 = dur(a2), D0 = 0.8, GAP = 0.4;
  const s2 = D0 + d1 + GAP, T = s2 + d2 + 1.6;
  const segs = [
    { start: 0, end: 3.0, badge: 'جمعة مباركة', title: 'الصلاة على النبي', sub: 'اسمع الآية… وصلِّ عليه ﷺ' },
    { start: 3.0, end: s2, badge: 'سورة الأحزاب', quran: true, text: forFont(verse(33, 56)), fs: 64, source: 'سورة الأحزاب - الآية ٥٦', reveal: d1 - 4 },
    { start: s2, end: s2 + 7.5, badge: 'فضل الصلاة على النبي ﷺ', text: HADITH_TEN, fs: 66, source: 'رواه مسلم', note: 'صلاة واحدة منك… يقابلها عشر صلوات من الله', reveal: 2.5 },
    { start: s2 + 7.5, end: T - 3.4, badge: 'يوم الجمعة', text: HADITH_FRIDAY, fs: 58, source: SRC_FRIDAY, reveal: 4 },
    { start: T - 3.4, end: 1e9, badge: 'جمعة مباركة', title: 'صلِّ عليه الآن', sub: 'واكتبها في الكومنتات… وشارك الأجر' },
  ];
  const p2 = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await p2.goto('file://' + path.join(__dirname, 'friday.html'));
  await p2.evaluate(o => window.setup(o), { vertical: true, segments: segs });
  await p2.evaluate(() => document.fonts.ready);
  const reel = path.join(OUT, '1100-friday-reel');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-i', a1, '-i', a2,
    '-filter_complex', `[1:a]aresample=44100,adelay=${Math.round(D0 * 1000)}:all=1[x];[2:a]aresample=44100,adelay=${Math.round(s2 * 1000)}:all=1[y];[x][y]amix=inputs=2:duration=longest:normalize=0,apad,afade=t=out:st=${(T - 1.2).toFixed(2)}:d=1.2[a]`,
    '-map', '0:v', '-map', '[a]', '-t', T.toFixed(2), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', reel + '.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < Math.ceil(T * FPS); f++) {
    await p2.evaluate(x => window.setT(x), f / FPS);
    const buf = await p2.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  // cover: the hook screen, fully shown
  await p2.evaluate(() => window.setT(2.4));
  await p2.screenshot({ path: reel + '-cover.png' });
  await browser.close();
  console.log('done', T.toFixed(1) + 's');
})();
