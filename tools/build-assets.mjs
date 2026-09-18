// Regenerates og-image.png, favicon-32.png, apple-touch-icon.png and icon-512.png
// from quilotoa-icon.png, via the layouts in tools/og-card.html and tools/icon.html.
//
//   python3 -m http.server 8899      # or: npx http-server -p 8899 .
//   node tools/build-assets.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = process.env.ORIGIN || 'http://127.0.0.1:8899';

const browser = await chromium.launch();

// 1200x630 social card
const card = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await card.goto(`${ORIGIN}/tools/og-card.html`, { waitUntil: 'networkidle' });
await card.evaluate(() => document.fonts.ready);
await card.screenshot({ path: join(ROOT, 'og-image.png') });
await card.close();

// square icons
for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png'], [512, 'icon-512.png']]) {
  // render at 512 and let the browser downsample, so small sizes stay clean
  const scale = 512 / size;
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: scale });
  await page.goto(`${ORIGIN}/tools/icon.html`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(ROOT, name), scale: 'css' });
  await page.close();
}

await browser.close();
console.log('assets rebuilt');
