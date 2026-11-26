// Friday salawat series: one gold glass Reel every 3 hours from 03:00 to after Maghrib,
// on salawat on the Prophet ﷺ, dhikr and duas for relief from worry and distress.
// Runs alongside the normal daily schedule.
//   node make_friday_salawat.js 2026-11-27 [id]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { verse, surahName, forFont } = require('./lib-quran');

const date = process.argv[2];
const only = process.argv[3];
const OUT = path.join(__dirname, 'out', date);
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(__dirname, 'cache'), { recursive: true });
const FPS = 30;
const RECITER = 'الشيخ محمد صديق المنشاوي';
const pad = n => String(n).padStart(3, '0');
const audio = (s, a) => {
  const f = path.join(__dirname, 'cache', `Minshawy_Murattal_128kbps-${pad(s)}${pad(a)}.mp3`);
  if (!fs.existsSync(f)) execFileSync('curl', ['-sSf', '--max-time', '60', '-o', f, `https://everyayah.com/data/Minshawy_Murattal_128kbps/${pad(s)}${pad(a)}.mp3`]);
  return f;
};
const dur = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const ref = (s, a, b) => `[سورة ${surahName(s)}: ${b ? `${a}-${b}` : a}]`;
const refAr = (s, a, b) => `سورة ${surahName(s)} - ${b ? `الآيات ${ar(a)}-${ar(b)}` : `الآية ${ar(a)}`}`;

const IBRAHIMIYYA = '«اللهم صلِّ على محمدٍ وعلى آلِ محمدٍ، كما صلَّيتَ على إبراهيمَ وعلى آلِ إبراهيمَ، إنك حميدٌ مجيد، اللهم باركْ على محمدٍ وعلى آلِ محمدٍ، كما باركتَ على إبراهيمَ وعلى آلِ إبراهيمَ، إنك حميدٌ مجيد»';
const KARB = '«لا إله إلا اللهُ العظيمُ الحليم، لا إله إلا اللهُ ربُّ العرشِ العظيم، لا إله إلا اللهُ ربُّ السماواتِ وربُّ الأرضِ وربُّ العرشِ الكريم»';
const TEN = '«مَن صلَّى عليَّ صلاةً، صلَّى اللهُ عليه بها عشرًا»';
const HAMM = '«اللهم إني أعوذُ بك من الهمِّ والحَزَن، والعجزِ والكسل، والبخلِ والجبن، وضَلَعِ الدَّين وغلبةِ الرجال»';
const UBAYY = 'قال أُبيّ: يا رسول الله، أجعلُ لك صلاتي كلَّها؟\nقال ﷺ: «إذًا تُكفى همَّك، ويُغفَرُ لك ذنبُك»';
const FRIDAY = '«إنَّ مِن أفضلِ أيامِكم يومَ الجمعةِ… فأكثِروا عليَّ من الصلاةِ فيه، فإنَّ صلاتَكم معروضةٌ عليَّ»';
const SAHL = '«اللهم لا سهلَ إلا ما جعلتَه سهلًا، وأنت تجعلُ الحَزْنَ إذا شئتَ سهلًا»';
const SAA = '«فيه ساعةٌ لا يوافقُها عبدٌ مسلمٌ وهو قائمٌ يصلي، يسألُ اللهَ شيئًا إلا أعطاه إياه»';
const HAYY = '«يا حيُّ يا قيومُ برحمتك أستغيث، أصلِحْ لي شأني كلَّه، ولا تَكِلْني إلى نفسي طرفةَ عين»';
const BAKHIL = '«البخيلُ مَن ذُكِرتُ عنده فلم يُصلِّ عليَّ»';
const HAMM2 = '«اللهم إني عبدُك، ابنُ عبدِك، ابنُ أَمَتِك، ناصيتي بيدِك… أن تجعلَ القرآنَ ربيعَ قلبي، ونورَ صدري، وجلاءَ حزني، وذهابَ همِّي»';

// a: the ayah shown on screen (recited first); b: the ayah recited under the hadith/dua screens
const POSTS = [
  { id: 'salawat-0300', time: '03:00', a: [33, 56], b: [13, 28],
    hook: { badge: 'ليلة الجمعة', title: 'صلِّ على النبي ﷺ', sub: 'في الثلث الأخير من الليل' },
    texts: [
      { badge: 'الصلاة الإبراهيمية', text: IBRAHIMIYYA, fs: 50, source: 'متفق عليه', d: 10 },
      { badge: 'دعاء الكرب', text: KARB, fs: 54, source: 'متفق عليه', note: 'قلها… وربنا يفرّج همّك', d: 9 }],
    cta: { badge: 'ليلة الجمعة', title: 'صلِّ عليه الآن', sub: 'واكتبها في الكومنتات… وشارك الأجر' },
    caption: ['في الثلث الأخير من ليلة الجمعة 🤍', `${'«اللهم صلِّ على محمد وعلى آل محمد، كما صليت على إبراهيم وعلى آل إبراهيم، إنك حميد مجيد، اللهم بارك على محمد وعلى آل محمد، كما باركت على إبراهيم وعلى آل إبراهيم، إنك حميد مجيد»'}\n(متفق عليه)`,
      'ودعاء الكرب 🤲\n«لا إله إلا الله العظيم الحليم، لا إله إلا الله رب العرش العظيم، لا إله إلا الله رب السماوات ورب الأرض ورب العرش الكريم»\n(متفق عليه)',
      '✍️ اكتب «اللهم صلِّ وسلم على نبينا محمد» في الكومنتات وخد الأجر.'],
    tags: '#الصلاة_على_النبي #اللهم_صل_على_محمد #ليلة_الجمعة #دعاء_الكرب #جمعة_مباركة #باقيات' },

  { id: 'salawat-0600', time: '06:00', a: [33, 43], b: [65, 3],
    hook: { badge: 'صباح الجمعة', title: 'صباحك صلاة على النبي ﷺ', titleSize: 84, sub: 'ابدأ يومك بأحب الأعمال' },
    texts: [
      { badge: 'فضل الصلاة على النبي ﷺ', text: TEN, fs: 66, source: 'رواه مسلم', note: 'صلاة واحدة منك… يقابلها عشر صلوات من الله', d: 8 },
      { badge: 'دعاء الهم والحزن', text: HAMM, fs: 54, source: 'رواه البخاري', d: 9 }],
    cta: { badge: 'صباح الجمعة', title: 'صلِّ عليه الآن', sub: 'وابعتها لحد بتحبه' },
    caption: ['صباح الجمعة… صباحك صلاة على النبي ﷺ 🤍', 'قال رسول الله ﷺ: «من صلّى عليّ صلاةً صلّى الله عليه بها عشرًا»\n(رواه مسلم)',
      'ومن دعائه ﷺ 🤲\n«اللهم إني أعوذ بك من الهم والحزن، والعجز والكسل، والبخل والجبن، وضلع الدين وغلبة الرجال»\n(رواه البخاري)',
      '💬 ابعته لحد بتحبه، وليك أجر كل صلاة يصليها بسببك.'],
    tags: '#الصلاة_على_النبي #اللهم_صل_على_محمد #صباح_الجمعة #دعاء #جمعة_مباركة #باقيات' },

  { id: 'salawat-0900', time: '09:00', a: [94, 5, 6], b: [3, 173],
    hook: { badge: 'يوم الجمعة', title: 'تُكفى همَّك', sub: 'سرّ الصلاة على النبي ﷺ' },
    texts: [
      { badge: 'حديث أُبيّ بن كعب', text: UBAYY, fs: 56, source: 'رواه الترمذي وقال: حسن صحيح', d: 10 },
      { badge: 'ردّدها معانا', text: '«اللهم صلِّ وسلِّم وبارِك على نبينا محمد»', fs: 72, note: 'كل ما يضيق صدرك… صلِّ على النبي ﷺ', d: 7 }],
    cta: { badge: 'يوم الجمعة', title: 'صلِّ عليه الآن', sub: 'واكتبها في الكومنتات… وشارك الأجر' },
    caption: ['لو حاسس بهمّ… الحديث ده ليك 🤍', 'قال أُبيّ بن كعب: يا رسول الله، أجعل لك صلاتي كلها؟\nقال ﷺ: «إذًا تُكفى همَّك، ويُغفر لك ذنبك»\n(رواه الترمذي وقال: حسن صحيح)',
      '✍️ اكتب «اللهم صلِّ وسلم وبارك على نبينا محمد» في الكومنتات.'],
    tags: '#الصلاة_على_النبي #اللهم_صل_على_محمد #تفريج_الهم #يوم_الجمعة #جمعة_مباركة #باقيات' },

  { id: 'salawat-1200', time: '12:00', a: [62, 9], b: [62, 10],
    hook: { badge: 'جمعة مباركة', title: 'أكثروا من الصلاة عليه ﷺ', titleSize: 84, sub: 'قبل الصلاة وبعدها' },
    texts: [
      { badge: 'يوم الجمعة', text: FRIDAY, fs: 58, source: 'رواه أبو داود والنسائي وابن ماجه بإسناد صحيح', d: 10 },
      { badge: 'دعاء تيسير الأمور', text: SAHL, fs: 62, source: 'رواه ابن حبان', d: 8 }],
    cta: { badge: 'جمعة مباركة', title: 'صلِّ عليه الآن', sub: 'واكتبها في الكومنتات… وشارك الأجر' },
    caption: ['جمعة مباركة 🤍', 'قال رسول الله ﷺ: «إن من أفضل أيامكم يوم الجمعة… فأكثروا عليّ من الصلاة فيه، فإن صلاتكم معروضة عليّ»\n(رواه أبو داود والنسائي وابن ماجه بإسناد صحيح)',
      'ودعاء تيسير الأمور 🤲\n«اللهم لا سهل إلا ما جعلته سهلًا، وأنت تجعل الحزن إذا شئت سهلًا»\n(رواه ابن حبان)',
      '🔁 شاركه، وليك أجر كل حد يصلي على النبي ﷺ بسببك.'],
    tags: '#جمعة_مباركة #يوم_الجمعة #الصلاة_على_النبي #اللهم_صل_على_محمد #دعاء #باقيات' },

  { id: 'salawat-1500', time: '15:00', a: [27, 62], b: [2, 186],
    hook: { badge: 'ساعة الإجابة', title: 'آخر ساعات الجمعة', sub: 'ادعُ… وصلِّ على النبي ﷺ' },
    texts: [
      { badge: 'ساعة الإجابة', text: SAA, fs: 58, source: 'متفق عليه', note: 'وأرجى ما تكون: آخر ساعة بعد العصر', d: 9 },
      { badge: 'دعاء تفريج الكرب', text: HAYY, fs: 58, source: 'رواه النسائي والحاكم', note: 'وصلِّ على النبي ﷺ قبل دعائك وبعده', d: 9 }],
    cta: { badge: 'ساعة الإجابة', title: 'ادعُ الآن', sub: 'وصلِّ على النبي ﷺ… واكتب «آمين»' },
    caption: ['ساعة الإجابة يوم الجمعة 🤲', 'قال رسول الله ﷺ: «فيه ساعة لا يوافقها عبد مسلم وهو قائم يصلي، يسأل الله شيئًا إلا أعطاه إياه»\n(متفق عليه)',
      'ادعي معانا 🤍\n«يا حي يا قيوم برحمتك أستغيث، أصلح لي شأني كله، ولا تكلني إلى نفسي طرفة عين»\n(رواه النسائي والحاكم)',
      '✍️ صلِّ على النبي ﷺ واكتب «آمين» في الكومنتات.'],
    tags: '#ساعة_الاجابة #يوم_الجمعة #الصلاة_على_النبي #دعاء_تفريج_الكرب #جمعة_مباركة #باقيات' },

  { id: 'salawat-1815', time: '18:15', a: [94, 1, 4], b: [33, 56],
    hook: { badge: 'بعد مغرب الجمعة', title: 'ورفعنا لك ذكرك', sub: 'ختام الجمعة… صلاة على النبي ﷺ' },
    texts: [
      { badge: 'لا تحرم نفسك', text: BAKHIL, fs: 68, source: 'رواه الترمذي وقال: حسن صحيح', d: 7 },
      { badge: 'دعاء ذهاب الهم', text: HAMM2, fs: 52, source: 'رواه أحمد', d: 10 }],
    cta: { badge: 'ختام الجمعة', title: 'صلِّ عليه الآن', sub: 'واكتبها في الكومنتات… وشارك الأجر' },
    caption: ['ختام يوم الجمعة 🤍 لسه فيه وقت تصلي على النبي ﷺ', 'قال رسول الله ﷺ: «البخيل من ذُكرت عنده فلم يصلِّ عليّ»\n(رواه الترمذي وقال: حسن صحيح)',
      'ودعاء ذهاب الهم 🤲\n«اللهم إني عبدك، ابن عبدك، ابن أمتك، ناصيتي بيدك… أن تجعل القرآن ربيع قلبي، ونور صدري، وجلاء حزني، وذهاب همي»\n(رواه أحمد)',
      '✍️ اكتب «اللهم صلِّ وسلم على نبينا محمد» في الكومنتات.'],
    tags: '#الصلاة_على_النبي #اللهم_صل_على_محمد #يوم_الجمعة #تفريج_الهم #جمعة_مباركة #باقيات' },
];

const ayahText = ([s, a, b]) => forFont([...Array((b || a) - a + 1)].map((_, i) => verse(s, a + i)).join(' '));
const ayahFiles = ([s, a, b]) => [...Array((b || a) - a + 1)].map((_, i) => audio(s, a + i));

(async () => {
  const browser = await chromium.launch();
  const manifest = [];
  for (const p of POSTS) {
    if (only && only !== p.id) continue;
    const A = ayahFiles(p.a), B = ayahFiles(p.b);
    const files = [...A, ...B], durs = files.map(dur);
    const dA = durs.slice(0, A.length).reduce((x, y) => x + y, 0);
    const dB = durs.slice(A.length).reduce((x, y) => x + y, 0);
    const D0 = 3.0, GAP = 0.6, s2 = D0 + dA + GAP;
    const textT = p.texts.reduce((x, t) => x + t.d, 0);
    const T = Math.max(s2 + dB + 1.6, s2 + textT + 3.4);
    const segs = [{ start: 0, end: D0, ...p.hook },
      { start: D0, end: s2, badge: `سورة ${surahName(p.a[0])}`, quran: true, text: ayahText(p.a), fs: 62, source: refAr(...p.a), reveal: Math.max(1.5, dA - 3) }];
    let t = s2;
    p.texts.forEach((x, i) => { const end = i === p.texts.length - 1 ? T - 3.4 : t + x.d; segs.push({ start: t, end, reveal: 3, ...x }); t = end; });
    segs.push({ start: T - 3.4, end: 1e9, ...p.cta });

    // audio: ayahs of A in a row from D0, then ayahs of B from s2
    const starts = []; let c = D0;
    durs.forEach((d, i) => { if (i === A.length) c = s2; starts.push(c); c += d; });
    const fc = files.map((_, i) => `[${i + 1}:a]aresample=44100,adelay=${Math.round(starts[i] * 1000)}:all=1[a${i}]`).join(';')
      + ';' + files.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${files.length}:duration=longest:normalize=0,apad,afade=t=out:st=${(T - 1.2).toFixed(2)}:d=1.2[a]`;

    const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    await pg.goto('file://' + path.join(__dirname, 'friday.html'));
    await pg.evaluate(o => window.setup(o), { vertical: true, segments: segs });
    await pg.evaluate(() => { document.querySelector('#handle span:last-child').textContent = 'باقيات'; });
    await pg.evaluate(() => document.fonts.ready);
    const base = path.join(OUT, `${p.time.replace(':', '')}-${p.id}`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      ...files.flatMap(f => ['-i', f]), '-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-t', T.toFixed(2),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', base + '.mp4'],
      { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = 0; f < Math.ceil(T * FPS); f++) {
      await pg.evaluate(x => window.setT(x), f / FPS);
      const buf = await pg.screenshot({ type: 'jpeg', quality: 90 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    await pg.evaluate(() => window.setT(2.4));
    await pg.screenshot({ path: base + '-cover.png' });
    await pg.close();

    const caption = [...p.caption, `🎧 بصوت ${RECITER} — ${ref(...p.a)}، ${ref(...p.b)}`, p.tags].join('\n\n');
    fs.writeFileSync(base + '.txt', caption + '\n');
    manifest.push({ id: p.id, kind: 'video', time: p.time, audio: true, seconds: +T.toFixed(1), caption,
      file: path.basename(base) + '.mp4', cover: path.basename(base) + '-cover.png', title: p.hook.title });
    console.log(p.time, p.id, T.toFixed(1) + 's');
  }
  await browser.close();
  if (!only) fs.writeFileSync(path.join(OUT, 'salawat.json'), JSON.stringify({ date, posts: manifest }, null, 1));
})();
