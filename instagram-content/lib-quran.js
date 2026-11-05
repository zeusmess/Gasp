const Q = require('quran-json/dist/quran.json');
// strip Uthmani marks so a plain keyword can be matched against the real text
const plain = s => s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '').replace(/ٱ/g, 'ا').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/\s+/g, ' ');
const verse = (s, a) => Q[s - 1].verses[a - 1].text;
const surahName = s => Q[s - 1].name;
// Amiri Quran draws open tanween at U+08F0-08F2; the source text uses U+0657/065E/0656 for them
const forFont = s => s.replace(/\u0657/g, '\u08F0').replace(/\u065E/g, '\u08F1').replace(/\u0656/g, '\u08F2');
const BASMALA = verse(1, 1);
module.exports = { Q, plain, verse, surahName, BASMALA, forFont };
