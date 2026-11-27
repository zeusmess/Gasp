// Plans the «باقيات» Instagram schedule 2026-11-27 .. 2027-01-01: 02:00 qiyam dua, 09:00 hadith, 21:00 Minshawi.
//   node plan.js  -> plan.json
const fs = require('fs'), path = require('path');
const IC = path.join(__dirname, 'ic');
const { verse, surahName } = require(path.join(IC, 'lib-quran.js'));
const { QDUAS, HADITH } = require(path.join(IC, 'plan-data.js'));
const LIB = require('./library.json');

const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const RNAME = { minshawi: 'الشيخ محمد صديق المنشاوي', abdulbasit: 'الشيخ عبد الباسط عبد الصمد', husary: 'الشيخ محمود خليل الحصري', alafasy: 'الشيخ مشاري العفاسي', maher: 'الشيخ ماهر المعيقلي' };
const CTAS = ['📌 احفظ البوست وارجعله.', '🔁 شاركه، وليك أجر كل حد يقرأه بسببك.', '✍️ اكتب «آمين» في الكومنتات.', '💬 ابعته لحد بتحبه.', '🤍 تابع الحساب عشان يوصلك كل يوم.'];
const HOOKS = ['اسمعها للآخر 🎧', 'تلاوة تريّح القلب 🤍', 'خد دقيقة مع كلام الله 🤍', 'صوت الشيخ المنشاوي 🎧', 'قبل ما تنام… اسمع دي 🤍'];
const range = ([s, a, b]) => { const t = []; for (let i = a; i <= b; i++) t.push(verse(s, i)); return t.join(' '); };
const ref = ([s, a, b]) => `[سورة ${surahName(s)}: ${a === b ? a : a + '-' + b}]`;
const NUZUL = 'قال رسول الله ﷺ: «ينزل ربنا تبارك وتعالى كل ليلة إلى السماء الدنيا حين يبقى ثلث الليل الآخر، يقول: من يدعوني فأستجيب له، من يسألني فأعطيه، من يستغفرني فأغفر له»\n(متفق عليه)';

const days = [];
for (let d = new Date('2026-11-27T12:00:00Z'); d <= new Date('2027-01-01T12:00:00Z'); d = new Date(+d + 864e5)) days.push(d);
const iso = d => d.toISOString().slice(0, 10);
const label = d => `${DAYS[d.getUTCDay()]} · ${ar(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]}`;

// 21:00 Minshawi: reels not yet on Instagram, at most ~58 s so the Story also works, topped up with single ayahs
const POSTED = ['20_130_130', '21_87_88', '21_89_90', '71_10_12', '1_1_7', '17_80_80'];
const reels = LIB.filter(x => x.kind === 'reel' && x.seconds + 2.1 <= 58 && !POSTED.some(p => x.id.endsWith('_' + p)));
const extra = ['40_60', '32_16', '17_82', '25_74', '3_133', '9_51', '49_10'].map(k => LIB.find(x => x.id === 'minshawi_' + k));
let night = [...reels, ...extra];
// Thursday nights (eve of Friday): Surat al-Kahf; spread the rest so one surah never follows itself
const kahf = night.filter(x => x.ayah[0] === 18 && x.kind === 'reel'); night = night.filter(x => !kahf.includes(x));
const seq = []; const rest = [...night];
let k = 0;
for (const d of days) {
  if (d.getUTCDay() === 4 && kahf.length) { seq.push(kahf.shift()); continue; }
  let i = rest.findIndex((x, j) => j >= (k * 7) % Math.max(rest.length, 1) && (!seq.length || x.ayah[0] !== seq[seq.length - 1].ayah[0]));
  if (i < 0) i = 0;
  seq.push(rest.splice(i, 1)[0]); k++;
}

// 02:00 qiyam: Quranic duas not posted yet, background recitation by rotating reciters
const POSTED_DUAS = ['14_41', '2_250', '3_53'];
const duas = QDUAS.filter(q => !POSTED_DUAS.includes(`${q[0]}_${q[1]}`));
const order = [];
for (let i = 0; i < duas.length; i++) order.push(duas[(i * 17) % duas.length]);
const POSTED_BG = ['alafasy_13_28', 'abdulbasit_25_63'];
const bgs = {}; for (const r of ['abdulbasit', 'husary', 'alafasy', 'maher'])
  bgs[r] = LIB.filter(x => x.kind === 'single' && x.reciter === r && x.seconds >= 9 && !POSTED_BG.includes(x.id));
const ROT = ['abdulbasit', 'husary', 'alafasy', 'maher'];

// 09:00 hadith: Drive videos until 1 Dec, then new ones (no repeats of recent ones)
const DRIVE = {
  '2026-11-27': { id: '1p_L0R3aADVNIR9s0zW5IE_qHtwmuNlxs', text: 'من سلك طريقًا يلتمس فيه علمًا، سهّل الله له به طريقًا إلى الجنة', source: 'رواه مسلم' },
  '2026-11-28': { id: '18vbFIMVjthsw5sTf4uCNb4qlFalzBlDx', text: 'ليس الشديد بالصُّرَعة، إنما الشديد الذي يملك نفسه عند الغضب', source: 'متفق عليه' },
  '2026-11-29': { id: '1BZ6HYjgnKiffEmBVEo6OWOSiY3o7cni_', text: 'أحب الأعمال إلى الله أدومها وإن قلّ', source: 'متفق عليه' },
  '2026-11-30': { id: '1Qx4BsPnmGbd4VWFKW2sF553ONfChKH7w', text: 'المسلم من سلم المسلمون من لسانه ويده', source: 'متفق عليه' },
  '2026-12-01': { id: '1ocLN4Xf-RylS05tK06rPAhD47ydwYOP1', text: 'الطهور شطر الإيمان، والحمد لله تملأ الميزان', source: 'رواه مسلم' },
};
const USED_H = [14, 13, 7, 11, 27, 3, 10, 2, 21];
const hadiths = HADITH.filter((_, i) => !USED_H.includes(i));

const posts = [];
days.forEach((d, n) => {
  const date = iso(d);
  if (n > 0) {   // 02:00 on 27 Nov has already passed
    const q = order[(n - 1) % order.length], r = ROT[(n - 1) % 4], bg = bgs[r].shift();
    const qa = [q[0], q[1], q[2]];
    posts.push({ key: `${date}-0200`, date, slot: '02:00', type: 'qiyam', label: label(d), ayah: qa, audio: bg.id,
      caption: ['في الثلث الأخير من الليل 🤍', '', NUZUL, '', 'ادعي معانا 🤲', '', `﴿${range(qa)}﴾`, ref(qa), '', CTAS[n % 5], '',
        `🎧 في الخلفية: ${ref(bg.ayah)} بصوت ${RNAME[r]}`, '', '#دعاء #أدعية_قرآنية #قرآن #ربنا #قيام_الليل #باقيات'].join('\n') });
  }
  const h = DRIVE[date] || hadiths.shift();
  posts.push({ key: `${date}-0900`, date, slot: '09:00', type: 'hadith', label: label(d), drive: DRIVE[date] ? DRIVE[date].id : null, hadith: { text: h.text, source: h.source },
    caption: ['حديث اليوم 🤍', '', `قال رسول الله ﷺ: «${h.text}»`, `(${h.source})`, h.note ? h.note : null, '', CTAS[(n + 2) % 5], '',
      '#حديث_شريف #سنة_نبوية #حديث #اسلام #باقيات'].filter(x => x !== null).join('\n') });
  const m = seq[n];
  posts.push({ key: `${date}-2100`, date, slot: '21:00', type: 'night', label: label(d), ayah: m.ayah, audio: m.id,
    caption: [d.getUTCDay() === 4 && m.ayah[0] === 18 ? 'ليلة الجمعة… من سورة الكهف 🤍' : HOOKS[n % 5], '', `﴿${range(m.ayah)}﴾`, ref(m.ayah),
      '🎧 بصوت الشيخ محمد صديق المنشاوي', '', CTAS[(n + 4) % 5], '', '#قرآن #تلاوة_خاشعة #المنشاوي #قرآن_كريم #باقيات'].join('\n') });
});
fs.writeFileSync(path.join(__dirname, 'plan.json'), JSON.stringify(posts, null, 1));
console.log(posts.length, 'posts;', posts.filter(p => p.type === 'qiyam').length, 'qiyam,', posts.filter(p => p.type === 'hadith').length, 'hadith,', posts.filter(p => p.type === 'night').length, 'night');
console.log('night ayahs:', posts.filter(p => p.type === 'night').map(p => `${p.date.slice(5)} ${p.ayah.join(':')}`).join(' | '));
console.log('unique night:', new Set(posts.filter(p => p.type === 'night').map(p => p.audio)).size, ' unique duas:', new Set(posts.filter(p => p.type === 'qiyam').map(p => p.ayah.join())).size,
  ' unique hadith:', new Set(posts.filter(p => p.type === 'hadith').map(p => p.hadith.text)).size, ' max caption', Math.max(...posts.map(p => p.caption.length)));
