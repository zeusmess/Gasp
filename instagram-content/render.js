// Usage: node render.js content/2026-11-06.json [postId]
// Renders each post to out/<date>/<time>-<id>.png (image) or .mp4 (video), plus caption .txt
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FPS = 30, DURATION = 10; // seconds

async function main() {
  const file = process.argv[2];
  const only = process.argv[3];
  const day = JSON.parse(fs.readFileSync(file, 'utf8'));
  const outDir = path.join(__dirname, 'out', day.date);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + path.join(__dirname, 'template.html'));

  for (const post of day.posts) {
    if (only && post.id !== only) continue;
    const base = path.join(outDir, `${post.time.replace(':', '')}-${post.id}`);
    await page.evaluate(p => window.setup(p), post);
    fs.writeFileSync(base + '.txt', post.caption + '\n');

    if (post.kind === 'image') {
      await page.evaluate(T => window.setT(T, T), DURATION);
      await page.screenshot({ path: base + '.png' });
      console.log('image', base + '.png');
      continue;
    }

    // video: last frame is held so the loop ends on the complete design
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-shortest',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18', '-c:a', 'aac',
      '-movflags', '+faststart', base + '.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
    const total = FPS * DURATION;
    for (let f = 0; f < total; f++) {
      await page.evaluate(([t, T]) => window.setT(t, T), [f / FPS, DURATION + 1]);
      const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    // cover image for the Reel = final frame
    await page.evaluate(T => window.setT(T, T), DURATION);
    await page.screenshot({ path: base + '-cover.png' });
    console.log('video', base + '.mp4');
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
