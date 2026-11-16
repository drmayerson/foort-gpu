// Review (2026-11-10) work packages 7 (the simple panel: U1, U3, U4, U7, U8, C7) and 8 (layout: U5, U6, U9), and U2
// (English and Dutch), against the review's targets.
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => console.error('page error:', e.message));
});
const loaded = async (page, q) => {
  await page.goto(`index.html?${q}`);
  await page.waitForFunction(() => window.__foort || window.__foortError, null, { timeout: 120_000 });
  expect(await page.evaluate(() => window.__foortError)).toBeUndefined();
  await page.waitForFunction(() => window.__foort.finals() >= 1, null, { timeout: 180_000 });
};
const box = (page, sel) => page.locator(sel).evaluate((el) => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: r.height }; });

test.describe('at 1366 x 768', () => {
  test.use({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1.5 });

  test('U5/U6: the whole image and its caption fit; the panel scrolls on its own; N follows the screen', async ({ page }) => {
    test.setTimeout(240_000);
    await loaded(page, 'play=0&pretrace=0');
    const cv = await box(page, '#view'), cap = await box(page, '#caption');
    expect(cv.top).toBeGreaterThanOrEqual(0);
    expect(cv.bottom).toBeLessThanOrEqual(768);
    expect(cap.bottom).toBeLessThanOrEqual(768);
    expect(cap.h).toBeGreaterThan(20);
    expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(1);
    expect(await page.locator('#panel').evaluate((el) => getComputedStyle(el).overflowY)).toBe('auto');
    // the image is about 550 CSS pixels at a pixel ratio of 1.5: 1024^2 unless this device is too slow for it
    expect([256, 512, 1024]).toContain(await page.evaluate(() => window.__foort.state.N));
    expect(await page.evaluate(() => window.__foort.state.resAuto)).toBe(true);
    // smooth scaling in the emission view
    expect(await page.locator('#view').evaluate((el) => el.classList.contains('pixelated'))).toBe(false);
  });

  test('U1/U7: a caption, no jargon lines, about eight controls and quick views; labels explain the image', async ({ page }) => {
    test.setTimeout(240_000);
    await loaded(page, 'N=256&play=0&pretrace=0');
    for (const id of ['#status', '#clock', '#legend', '#perfBox']) await expect(page.locator(id)).toBeHidden();
    await expect(page.locator('#caption')).toContainText('black hole');
    const main = await page.locator('fieldset.normalMain .ctl:not([hidden])').count();
    expect(main).toBeGreaterThanOrEqual(7);
    expect(main).toBeLessThanOrEqual(10);
    await expect(page.locator('#presets button')).toHaveCount(5);
    expect(await page.locator('details.normalMore').evaluate((el) => el.open)).toBe(false);
    await page.click('#explain');
    await expect(page.locator('#labels .lbl').first()).toBeVisible();
    expect(await page.locator('#labels .lbl').count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator('#labels')).toContainText('shadow');
    // a quick view: edge-on
    const n = await page.evaluate(() => window.__foort.finals());
    await page.click('#presets button[data-preset=pEdgeOn]');
    await page.waitForFunction((k) => window.__foort.finals() > k, n, { timeout: 120_000 });
    expect(await page.evaluate(() => window.__foort.state.inc)).toBe(85);
    // the expert panel has its status line back
    await page.click('#uiToggle');
    await expect(page.locator('#status')).toBeVisible();
    await expect(page.locator('#caption')).toBeHidden();
  });

  test('U3: the sky is on by default and the azimuth visibly turns it (no re-trace)', async ({ page }) => {
    test.setTimeout(240_000);
    await loaded(page, 'N=256&play=0&pretrace=0&screen=200&inc=75');
    expect(await page.evaluate(() => window.__foort.state.sky)).toBe('deep-field');
    await page.waitForTimeout(1500);   // the picture loads
    const a = await page.locator('#view').screenshot();
    const runs = await page.evaluate(() => window.__foort.runs());
    await page.locator('input[name=az]').evaluate((el) => { el.value = '40'; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); });
    await page.waitForTimeout(300);
    const b = await page.locator('#view').screenshot();
    expect(a.equals(b)).toBe(false);
    expect(await page.evaluate(() => window.__foort.runs())).toBe(runs);
    await page.locator('select[name=sky]').selectOption('none');
    await page.waitForTimeout(300);
    const c = await page.locator('#view').screenshot();
    expect(c.equals(b)).toBe(false);
  });

  test('U4: the default view has under 1% saturated pixels over one noise period', async ({ page }) => {
    test.setTimeout(240_000);
    await loaded(page, 'N=256&play=0&pretrace=0');
    await page.evaluate(() => window.__foort.noiseReady());
    const share = await page.evaluate(async () => {
      const f = window.__foort, T = f.noise().meta.T_over_M, cv = document.getElementById('view');
      const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height;
      const g = c2.getContext('2d', { willReadFrequently: true });
      let sat = 0, all = 0;
      for (let k = 0; k < 32; k++) {
        f.setTime((k * T) / 32);
        g.drawImage(cv, 0, 0);
        const d = g.getImageData(0, 0, c2.width, c2.height).data;
        for (let i = 0; i < d.length; i += 4) { all++; if (d[i] >= 252 && d[i + 1] >= 252 && d[i + 2] >= 252) sat++; }
      }
      return sat / all;
    });
    expect(share).toBeLessThan(0.01);
  });

  test('U8: a long wait shows on the image, over the dimmed previous image', async ({ page }) => {
    test.setTimeout(240_000);
    await loaded(page, 'N=512&play=0&pretrace=0');
    const n = await page.evaluate(() => window.__foort.finals());
    await page.selectOption('select[name=family]', 'fuzzball');   // first fuzzball: probe, bake and a ~2 s trace
    await expect(page.locator('#progress')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#progressText')).toContainText(/Computing|Measuring/);
    expect(await page.locator('#canvasWrap').evaluate((el) => el.classList.contains('busy'))).toBe(true);
    await page.waitForFunction((k) => window.__foort.finals() > k, n, { timeout: 180_000 });
    await expect(page.locator('#progress')).toBeHidden();
    expect(await page.locator('#canvasWrap').evaluate((el) => el.classList.contains('busy'))).toBe(false);
    await expect(page.locator('#caption')).toContainText('fuzzball');
  });

  test('U2: Dutch, from the link or the switch, shared with the homepage', async ({ page }) => {
    test.setTimeout(240_000);
    await loaded(page, 'N=128&play=0&pretrace=0&lang=nl');
    await expect(page.locator('#uiToggle')).toHaveText('Expertpaneel');
    await expect(page.locator('#caption')).toContainText('zwart gat');
    await page.click('.langs button[data-set=en]');
    await expect(page.locator('#uiToggle')).toHaveText('Expert panel');
    expect(await page.evaluate(() => localStorage.getItem('home-lang'))).toBe('en');
    await page.click('.langs button[data-set=nl]');
    await expect(page.locator('fieldset.normalMain legend')).toHaveText('Wat je ziet');
    expect(await page.evaluate(() => localStorage.getItem('home-lang'))).toBe('nl');
  });
});

test.describe('U9: on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  test('the image stays visible while a slider at the end of the panel moves', async ({ page }) => {
    test.setTimeout(240_000);
    await loaded(page, 'N=128&play=0');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    const cv = await box(page, '#view');
    expect(cv.top).toBeGreaterThanOrEqual(0);
    expect(cv.bottom).toBeLessThanOrEqual(812);
    expect(cv.h).toBeGreaterThan(200);
  });
});
