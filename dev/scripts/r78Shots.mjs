// Review packages 7-8: the simple panel and the layout, measured against the review's targets, with screenshots.
//   1366 x 768 (device pixel ratio 1.5): the whole image and its caption visible without scrolling; the panel scrolls
//   on its own. 375 x 812 (phone): the image stays visible while a slider near the end of the panel is moved.
//   The default view: the share of saturated pixels (tone-mapped brightness >= 0.99) over one noise period.
// Usage (from dev/): node scripts/r78Shots.mjs [--lang nl] [--q extra=query]  -> dev/reports/img/review/r78_*.png (git-ignored), dev/reports/review/r78_<label>.json
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const lang = opt('--lang', 'en'), extra = opt('--q', ''), label = opt('--label', lang);
const out = resolve(here, '../reports/review'), shots = resolve(here, '../reports/img/review');
mkdirSync(out, { recursive: true }); mkdirSync(shots, { recursive: true });
const port = 8781, base = `http://127.0.0.1:${port}/`;
const serving = async () => { try { return (await fetch(base + 'index.html')).ok; } catch { return false; } };
let server = null;
if (!(await serving())) {
  server = spawn(process.execPath, [resolve(root, 'dev/scripts/serve.mjs'), String(port)], { stdio: 'ignore' });
  for (let k = 0; k < 50 && !(await serving()); k++) await new Promise((r) => setTimeout(r, 100));
}
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const report = {};
try {
  for (const [name, ctxOpts] of [['desktop', { viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1.5 }],
    ['phone', { viewport: { width: 375, height: 812 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`${base}index.html?lang=${lang}&pretrace=0${extra ? `&${extra}` : ''}`);
    await page.waitForFunction(() => window.__foort || window.__foortError, null, { timeout: 120_000 });
    await page.waitForFunction(() => window.__foort?.finals() >= 1, null, { timeout: 120_000 });
    await page.evaluate(() => window.__foort.noiseReady());
    await page.waitForTimeout(800);
    const box = async (sel) => page.locator(sel).evaluate((el) => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, h: r.height, w: r.width }; });
    const m = { canvas: await box('#view'), caption: await box('#caption'), panel: await box('#panel'), vh: ctxOpts.viewport.height, N: await page.evaluate(() => window.__foort.state.N),
      pageScroll: await page.evaluate(() => document.documentElement.scrollHeight - innerHeight), panelScroll: await page.locator('#panel').evaluate((el) => el.scrollHeight - el.clientHeight),
      controls: await page.locator('#controls .ctl:not([hidden])').count(), errors };
    await page.screenshot({ path: resolve(shots, `r78_${label}_${name}.png`) });
    if (name === 'phone') {
      // scroll the page to the bottom of the panel and move a slider there: the image must still be on screen
      await page.locator('input[name=az]').scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(300);
      m.canvasAfterScroll = await box('#view');
      await page.screenshot({ path: resolve(shots, `r78_${label}_${name}_scrolled.png`) });
    }
    if (name === 'desktop') {
      await page.click('#explain');
      await page.waitForTimeout(300);
      await page.screenshot({ path: resolve(shots, `r78_${label}_${name}_labels.png`) });
      m.labels = await page.locator('#labels .lbl').allTextContents();
      // saturation over one noise period: 32 frames of the default view, read from the canvas
      m.saturated = await page.evaluate(async () => {
        const f = window.__foort, T = f.noise()?.meta.T_over_M ?? 0, cv = document.getElementById('view');
        f.state.play = false;
        const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height;
        const g = c2.getContext('2d', { willReadFrequently: true });
        let sat = 0, disc = 0;
        for (let k = 0; k < 32; k++) {
          f.setTime((k * T) / 32);
          g.drawImage(cv, 0, 0);
          const d = g.getImageData(0, 0, c2.width, c2.height).data;
          for (let i = 0; i < d.length; i += 4) {
            const mx = Math.max(d[i], d[i + 1], d[i + 2]);
            if (mx > 20) disc++;
            // afmhot reaches white (all three channels at 255) only at full brightness
            if (d[i] >= 252 && d[i + 1] >= 252 && d[i + 2] >= 252) sat++;
          }
        }
        return { framesShare: sat / (32 * c2.width * c2.height), discShare: disc ? sat / disc : 0 };
      });
    }
    report[name] = m;
    console.log(name, JSON.stringify(m));
    await ctx.close();
  }
} finally { await browser.close(); if (server) server.kill(); }
writeFileSync(resolve(out, `r78_${label}.json`), JSON.stringify({ date: new Date().toISOString(), lang, extra, report }, null, 1));
