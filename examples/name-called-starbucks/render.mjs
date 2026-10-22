// Renders index.html frame-by-frame to an MP4 (1080x1920) and mixes the audio.
// Usage: node render.mjs [out.mp4] [fps]
//        node render.mjs --audio-only [video.mp4]   re-mix audio onto an existing render (no frame capture)
// Audio, mixed in automatically when the files exist (.wav or .mp3):
//   audio/sfx      — sound effects, synced to the timeline (generate with: python3 sfx.py)
//   audio/music    — music bed (sfx.py also writes one); ducked when a voice-over is present
//   audio/vo1 … vo8 — narration lines, placed at VO_STARTS (script: VOICE_SCRIPT.md)
//   audio/call, call2, call3 — the barista calling "نادية!" / "نادية؟" / happy "نادية!"
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const VO_STARTS = [0.8, 3.8, 14.2, 18.7, 27.3, 36.8, 40.6, 42.6]; // seconds — see VOICE_SCRIPT.md
const CALLS = [[2.9, 1, "call"], [5.8, 0.9, "call"], [7.55, 0.8, "call"], [8.75, 0.8, "call"], [11.9, 1, "call"],
  [13.3, 0.7, "call2"], [36.0, 1.1, "call3"]]; // [time, volume, file]
// A full ElevenLabs take (see ELEVENLABS.md) replaces the separate vo/call files:
//   audio/voice = the whole script in one file, or audio/part1 … part4 = the four-part version
const VOICE_TRACKS = [["voice", 0.8], ["part1", 0.8], ["part2", 14.2], ["part3", 27.3], ["part4", 36.0]];

const here = dirname(fileURLToPath(import.meta.url));
const audioOnly = process.argv[2] === "--audio-only";
const out = (audioOnly ? process.argv[3] : process.argv[2]) || join(here, "name-called.mp4");
const fps = Number((!audioOnly && process.argv[3]) || 30);

const findAudio = name => ["wav", "mp3"].map(ext => join(here, "audio", `${name}.${ext}`)).find(existsSync);

// builds the ffmpeg audio inputs + filter for a video input at index 0
function audioArgs(duration) {
  const args = [], filters = [], voice = [], bed = [];
  let input = 1;
  const tracks = VOICE_TRACKS.map(([name, start]) => [findAudio(name), start]).filter(([f]) => f);
  const voices = tracks.length ? tracks : VO_STARTS.map((start, i) => [findAudio(`vo${i + 1}`), start]).filter(([f]) => f);
  voices.forEach(([file, start], i) => {
    const ms = Math.round(start * 1000);
    args.push("-i", file);
    filters.push(`[${input++}:a]adelay=${ms}|${ms}[v${i}]`);
    voice.push(`[v${i}]`);
  });
  if (!tracks.length) CALLS.forEach(([start, vol, name], i) => {
    const callFile = findAudio(name) || findAudio("call");
    if (!callFile) return;
    const ms = Math.round(start * 1000);
    args.push("-i", callFile);
    filters.push(`[${input++}:a]adelay=${ms}|${ms},volume=${vol}[c${i}]`);
    voice.push(`[c${i}]`);
  });
  const sfx = findAudio("sfx");
  if (sfx) {
    args.push("-i", sfx);
    filters.push(`[${input++}:a]volume=${voices.length ? 0.6 : 0.9}[s]`);
    bed.push("[s]");
  }
  const music = findAudio("music");
  if (music) {
    args.push("-i", music);
    filters.push(`[${input++}:a]atrim=0:${duration},afade=t=in:d=0.5,afade=t=out:st=${duration - 2}:d=2,volume=${voices.length ? 0.3 : 0.6}[m]`);
    bed.push("[m]");
  }
  if (!voice.length && !bed.length) return [];
  const sum = (labels, out) => filters.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0${out}`);
  if (voice.length && bed.length) {
    // duck the music + effects whenever someone speaks
    sum(voice, ",asplit=2[vout][vkey]");
    sum(bed, "[bed]");
    filters.push("[bed][vkey]sidechaincompress=threshold=0.1:ratio=2:attack=20:release=400[ducked]");
    sum(["[ducked]", "[vout]"], "[mixed]");
  } else sum([...voice, ...bed], "[mixed]");
  filters.push(`[mixed]alimiter=limit=0.95,apad,atrim=0:${duration}[aout]`);
  return [...args, "-filter_complex", filters.join(";"), "-map", "0:v", "-map", "[aout]", "-c:a", "aac", "-b:a", "192k"];
}

if (audioOnly) {
  const duration = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).toString());
  const tmp = out.replace(/\.mp4$/, ".tmp.mp4");
  execFileSync("ffmpeg", ["-y", "-i", out, ...audioArgs(duration), "-c:v", "copy", "-shortest", tmp], { stdio: "ignore" });
  renameSync(tmp, out);
  console.log(`Audio re-mixed → ${out}`);
  process.exit(0);
}

const { chromium } = await import("playwright");
const frames = mkdtempSync(join(tmpdir(), "name-frames-"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(join(here, "index.html")).href + "?record");
await page.waitForFunction(() => !!window.tl, null, { polling: 100, timeout: 60000 });
const duration = await page.evaluate(() => window.tl.duration());
const total = Math.ceil(duration * fps);

for (let i = 0; i <= total; i++) {
  await page.evaluate(t => { window.tl.seek(t, false); }, i / fps);
  await page.screenshot({ path: join(frames, `f${String(i).padStart(5, "0")}.png`) });
  if (i % fps === 0) process.stdout.write(`\r${(i / fps).toFixed(0)}s / ${duration.toFixed(0)}s`);
}
await browser.close();

const audio = audioArgs(duration);
execFileSync("ffmpeg", ["-y", "-framerate", String(fps), "-i", join(frames, "f%05d.png"), ...audio,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", out], { stdio: "ignore" });
rmSync(frames, { recursive: true, force: true });
console.log(`\nDone → ${out}${audio.length ? " (with audio)" : " (silent)"}`);
