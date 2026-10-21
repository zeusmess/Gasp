// Renders index.html frame-by-frame to an MP4 (1080x1920, 30fps).
// Usage: node render.mjs [out.mp4] [fps]
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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

execFileSync("ffmpeg", ["-y", "-framerate", String(fps), "-i", join(frames, "f%05d.png"),
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", out], { stdio: "ignore" });
rmSync(frames, { recursive: true, force: true });
console.log(`\nDone → ${out}`);
