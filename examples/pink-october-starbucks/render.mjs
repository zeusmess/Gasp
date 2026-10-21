// Renders index.html frame-by-frame to an MP4 (1080x1920) and mixes the audio.
// Usage: node render.mjs [out.mp4] [fps]
//        node render.mjs --audio-only [video.mp4]   re-mix audio onto an existing render (no frame capture)
// Audio, mixed in automatically when the files exist (.wav or .mp3):
//   audio/sfx      — sound effects, synced to the timeline (generate with: python3 sfx.py)
//   audio/music    — music bed (sfx.py also writes one); ducked when a voice-over is present
//   audio/vo1 … vo6 — one voice-over line per scene, placed at VO_STARTS
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const VO_STARTS = [0.4, 5.0, 11.2, 16.4, 22.4, 29.0]; // seconds, one per scene

const here = dirname(fileURLToPath(import.meta.url));
const audioOnly = process.argv[2] === "--audio-only";
const out = (audioOnly ? process.argv[3] : process.argv[2]) || join(here, "pink-october.mp4");
const fps = Number((!audioOnly && process.argv[3]) || 30);

const findAudio = name => ["wav", "mp3"].map(ext => join(here, "audio", `${name}.${ext}`)).find(existsSync);

// builds the ffmpeg audio inputs + filter for a video input at index 0
function audioArgs(duration) {
  const args = [], filters = [], mix = [];
  let input = 1;
  const voices = VO_STARTS.map((start, i) => [findAudio(`vo${i + 1}`), start]).filter(([f]) => f);
  voices.forEach(([file, start], i) => {
    const ms = Math.round(start * 1000);
    args.push("-i", file);
    filters.push(`[${input++}:a]adelay=${ms}|${ms}[v${i}]`);
    mix.push(`[v${i}]`);
  });
  const sfx = findAudio("sfx");
  if (sfx) {
    args.push("-i", sfx);
    filters.push(`[${input++}:a]volume=${voices.length ? 0.6 : 0.9}[s]`);
    mix.push("[s]");
  }
  const music = findAudio("music");
  if (music) {
    args.push("-i", music);
    filters.push(`[${input++}:a]atrim=0:${duration},afade=t=in:d=0.5,afade=t=out:st=${duration - 2}:d=2,volume=${voices.length ? 0.18 : 0.35}[m]`);
    mix.push("[m]");
  }
  if (!mix.length) return [];
  filters.push(`${mix.join("")}amix=inputs=${mix.length}:normalize=0,alimiter=limit=0.95,apad,atrim=0:${duration}[aout]`);
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
const frames = mkdtempSync(join(tmpdir(), "pink-frames-"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(join(here, "index.html")).href + "?record");
await page.evaluate(() => document.fonts.ready);
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
