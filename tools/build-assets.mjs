// Regenerates og-image.png, favicon-32.png, apple-touch-icon.png and icon-512.png.
// Requires a static server on the repo root and Playwright's Chromium.
//   npx http-server -p 8899 .      (or: python3 -m http.server 8899)
//   node tools/build-assets.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
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

// raster icons, rendered from favicon.svg
const svg = readFileSync(join(ROOT, 'favicon.svg'), 'utf8');
for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png'], [512, 'icon-512.png']]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>html,body{margin:0;padding:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: join(ROOT, name) });
  await page.close();
}

await browser.close();
console.log('assets rebuilt');
