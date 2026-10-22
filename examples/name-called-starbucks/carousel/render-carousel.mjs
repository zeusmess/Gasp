// Renders carousel.html (one 10800×1350 panorama) into ten 1080×1350 Instagram slides.
// Usage: node render-carousel.mjs     (needs playwright)
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 10800, height: 1350 } });
await page.goto(pathToFileURL(join(here, "carousel.html")).href);
await page.waitForFunction(() => document.body.dataset.ready === "1", null, { polling: 100 });
for (let i = 0; i < 10; i++) {
  const file = join(here, `slide-${String(i + 1).padStart(2, "0")}.png`);
  await page.screenshot({ path: file, clip: { x: i * 1080, y: 0, width: 1080, height: 1350 } });
  console.log("✓", file);
}
await browser.close();
