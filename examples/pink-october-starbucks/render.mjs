// Renders index.html frame-by-frame to an MP4 (1080x1920).
// Usage: node render.mjs [out.mp4] [fps]
// Optional audio, mixed in automatically if the files exist:
//   audio/vo1.mp3 … audio/vo6.mp3  — one voice-over line per scene (placed at VO_STARTS)
//   audio/music.mp3                — background music (ducked under the voice)
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const VO_STARTS = [0.4, 5.0, 11.2, 16.4, 22.4, 29.0]; // seconds, one per scene

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || join(here, "pink-october.mp4");
const fps = Number(process.argv[3] || 30);
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

// audio graph
const args = ["-y", "-framerate", String(fps), "-i", join(frames, "f%05d.png")];
const filters = [], voLabels = [];
let input = 1;
VO_STARTS.forEach((start, i) => {
  const file = join(here, "audio", `vo${i + 1}.mp3`);
  if (!existsSync(file)) return;
  args.push("-i", file);
  const ms = Math.round(start * 1000);
  filters.push(`[${input}:a]adelay=${ms}|${ms},volume=1.0[v${i}]`);
  voLabels.push(`[v${i}]`);
  input++;
});
const music = join(here, "audio", "music.mp3");
let mixInputs = [...voLabels];
if (existsSync(music)) {
  args.push("-i", music);
  filters.push(`[${input}:a]atrim=0:${duration},afade=t=in:d=1,afade=t=out:st=${duration - 2}:d=2,volume=${voLabels.length ? 0.22 : 0.8}[m]`);
  mixInputs.push("[m]");
}
if (mixInputs.length) {
  filters.push(`${mixInputs.join("")}amix=inputs=${mixInputs.length}:normalize=0,apad,atrim=0:${duration}[aout]`);
  args.push("-filter_complex", filters.join(";"), "-map", "0:v", "-map", "[aout]", "-c:a", "aac", "-b:a", "192k");
}
args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", out);

execFileSync("ffmpeg", args, { stdio: "ignore" });
rmSync(frames, { recursive: true, force: true });
console.log(`\nDone → ${out}${mixInputs.length ? " (with audio)" : " (silent)"}`);
