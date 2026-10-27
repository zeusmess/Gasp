// Single source of truth for timing (100 BPM → 0.6 s beat, 2.4 s bar).
// scripts/music.py reads the same numbers from beats.json (written by render.mjs).
export const BPM = 100;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
const bar = (n) => +(n * BAR).toFixed(3);

export const T = {
  coinIn: 3.2,          // logo starts its flight
  coinLand: bar(2),     // 4.8 — logo slams in
  lift: 5.4,            // Siren steps out of the circle
  hug0: bar(4),         // 9.6 — first embrace
  gallery: bar(8),      // 19.2 — orbit of memories
  video1: bar(10),      // 24.0 — awareness talk
  collage: bar(12),     // 28.8 — one day / colour / cause
  hugVid: bar(14),      // 33.6 — she holds the moment
  aware: bar(15),       // 36.0 — breakdown: early detection
  finale: bar(17),      // 40.8 — drop: photo ribbon
  text: 42.4,           // let's defeat breast cancer together
  end: bar(20),         // 48.0 — end card
};
export const HUGS = [0, 1, 2, 3].map((i) => bar(4 + i));
export const DURATION = bar(22); // 52.8
