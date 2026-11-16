// Review (2026-11-10) work package 9: expert tools E1-E6.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { readFits } from '../../../js/fits.js';
import { pngTexts } from '../../../js/export.js';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => console.error('page error:', e.message));
});
const loaded = async (page, q) => {
  await page.goto(`index.html?${q}`);
  await page.waitForFunction(() => window.__foort || window.__foortError, null, { timeout: 120_000 });
  expect(await page.evaluate(() => window.__foortError)).toBeUndefined();
  await page.waitForFunction(() => window.__foort.finals() >= 1, null, { timeout: 180_000 });
};
const nextFinal = async (page, act) => {
  const n = await page.evaluate(() => window.__foort.finals());
  await act();
  await page.waitForFunction((k) => window.__foort.finals() > k, n, { timeout: 120_000 });
};

test('E2: every slider takes a typed value (exact, clamped to its range)', async ({ page }) => {
  test.setTimeout(180_000);
  await loaded(page, 'N=128&play=0&pretrace=0');
  const type = async (name, v) => nextFinal(page, async () => {
    await page.locator(`label:has(input[name=${name}]) output`).click();
    await page.locator(`label:has(input[name=${name}]) input.val`).fill(String(v));
    await page.keyboard.press('Enter');
  });
  await type('a', 0.9375);
  expect(await page.evaluate(() => window.__foort.state.a)).toBe(0.9375);
  await type('inc', 90);
  expect(await page.evaluate(() => window.__foort.state.inc)).toBe(90);
  await expect(page.locator('label:has(input[name=inc]) output')).toHaveText('90.00');
  // a log slider (field of view), exactly, and a value beyond its range is clamped
  await type('screen', 12.345);
  expect(await page.evaluate(() => window.__foort.state.screen)).toBe(12.345);
  await type('inc', 400);
  expect(await page.evaluate(() => window.__foort.state.inc)).toBe(179.99);
  // every range control has the editable value
  const ranges = await page.locator('#controls input[type=range]').count();
  expect(await page.locator('#controls output.editable').count()).toBe(ranges);
});

test.describe('E1: on a fresh browser profile', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('the expert groups fold (Tracing folded by default, remembered) and the filter finds controls', async ({ page }) => {
    test.setTimeout(180_000);
    await loaded(page, 'N=128&play=0&pretrace=0&ui=expert');
    const open = (g) => page.locator('#controls details.grp', { hasText: g }).first().evaluate((el) => el.open);
    expect(await open('Tracing')).toBe(false);
    expect(await open('Camera')).toBe(true);
    await page.locator('#controls details.grp > summary', { hasText: 'Camera' }).click();
    expect(await open('Camera')).toBe(false);
    await page.reload();
    await page.waitForFunction(() => window.__foort, null, { timeout: 60_000 });
    expect(await open('Camera')).toBe(false);
    // the filter: only matching controls; their groups open while it is set
    await page.fill('input[name=ctlFilter]', 'noise');
    await expect(page.locator('select[name=noiseField]')).toBeVisible();
    await expect(page.locator('input[name=sigmaN]')).toBeVisible();
    await expect(page.locator('input[name=inc]')).toBeHidden();
    // a match in the folded Tracing group opens it while the filter is set
    await page.fill('input[name=ctlFilter]', 'texel');
    await expect(page.locator('input[name=texelReuse]')).toBeVisible();
    expect(await open('Tracing')).toBe(true);
    await page.fill('input[name=ctlFilter]', '');
    expect(await open('Tracing')).toBe(false);
  });
});

test('E3: the records and the intensity download as FITS that read back exactly, with the view in the header', async ({ page }) => {
  test.setTimeout(180_000);
  await loaded(page, 'N=128&play=0&pretrace=0&ui=expert&inc=60');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#dlRecords')]);
  expect(dl.suggestedFilename()).toMatch(/-records\.fits$/);
  const f = readFits(new Uint8Array(readFileSync(await dl.path())));
  expect([f.w, f.h, f.planes]).toEqual([128, 128, 24]);
  expect(f.header.METRIC).toBe('kerr');
  expect(f.header.CAMINC).toBe(60);
  expect(f.header.TIER).toBe(await page.evaluate(() => window.__foort.tier()));
  expect(String(f.header.COMMIT)).toBe(await page.evaluate(() => window.__foort.version().commit.slice(0, 48)));
  // the same numbers as the records in the page
  const rec = await page.evaluate(async () => Array.from(await window.__foort.backend.readRecords(1)));
  let diff = 0;
  for (let p = 0; p < 24; p++) for (let k = 0; k < 128 * 128; k++) {
    const a = rec[k * 24 + p], b = f.data[p * 128 * 128 + k];
    if (!(Object.is(a, b) || (Number.isNaN(a) && Number.isNaN(b)))) diff++;
  }
  expect(diff).toBe(0);
  // the intensity: 4 planes, the total is the sum of the orders
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#dlIntensity')]);
  const g = readFits(new Uint8Array(readFileSync(await dl2.path())));
  expect(g.planes).toBe(4);
  const n = g.w * g.h;
  let tot = 0, parts = 0;
  for (let k = 0; k < n; k++) { tot += g.data[k]; parts += g.data[n + k] + g.data[2 * n + k] + g.data[3 * n + k]; }
  expect(tot).toBeGreaterThan(0);
  expect(Math.abs(parts / tot - 1)).toBeLessThan(1e-5);
  // the light curve and the rays as CSV
  const [dl3] = await Promise.all([page.waitForEvent('download'), page.click('#dlLightCurve')]);
  expect(readFileSync(await dl3.path(), 'utf8')).toContain('t_M,total,n1,n2,n3_and_tail');
});

test('E4: the PNG carries the commit, the resolved tier and a fixed-quality link', async ({ page }) => {
  test.setTimeout(180_000);
  await loaded(page, 'N=128&play=0&pretrace=0');
  await page.waitForFunction(() => window.__foort.version().commit !== 'unknown', null, { timeout: 10_000 });
  const texts = pngTexts(new Uint8Array(await page.evaluate(async () => Array.from(await window.__foort.snapshotBytes()))));
  const v = await page.evaluate(() => window.__foort.version());
  const tier = await page.evaluate(() => window.__foort.tier());
  expect(texts['foort-gpu-commit']).toBe(v.commit);
  expect(texts['foort-gpu-commit']).toMatch(/^[0-9a-f]{40}\+local$/);   // a dev server marks its version
  expect(texts['foort-gpu-tier']).toBe(tier);
  expect(texts['foort-gpu-fixed-url']).toContain(`quality=${tier}`);
  expect(texts['foort-gpu-fixed-url']).toContain('N=128');
  expect(texts['foort-gpu-url']).toBeTruthy();
});

test('E5/E6: clamps show in a notes box; scalar views have a colour bar', async ({ page }) => {
  test.setTimeout(180_000);
  await loaded(page, 'N=128&play=0&pretrace=0&ui=expert&metric=mankoNovikov&alpha3=2');
  await expect(page.locator('#notes')).toBeVisible();
  await expect(page.locator('#notes')).toContainText('clamped');
  await expect(page.locator('#cbar')).toBeHidden();
  await page.selectOption('select[name=view]', 'g1');
  await expect(page.locator('#cbar')).toBeVisible();
  await expect(page.locator('#cbar .ticks')).toHaveText('00.81.6');
  await page.selectOption('select[name=view]', 'emission');
  await expect(page.locator('#cbar')).toBeHidden();
  // a valid view: no notes
  await nextFinal(page, () => page.selectOption('select[name=metric]', 'kerr'));
  await expect(page.locator('#notes')).toBeHidden();
});
