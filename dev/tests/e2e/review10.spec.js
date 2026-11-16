// Review (2026-11-10) work package 10 (P7): the gated step saving that was adopted, the outgoing stop beyond 60 M.
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
const nextFinal = async (page, act) => {
  const n = await page.evaluate(() => window.__foort.finals());
  await act();
  await page.waitForFunction((k) => window.__foort.finals() > k, n, { timeout: 120_000 });
};
const stop = (page) => page.evaluate(() => window.__foort.view().stopOut);

test('P7: outgoing rays stop beyond 60 M only when nothing shows their direction; toggling the sky re-traces', async ({ page }) => {
  test.setTimeout(240_000);
  await loaded(page, 'N=128&play=0&pretrace=0&ui=expert&quality=normal&sky=none');
  expect(await stop(page)).toBe(60);
  // fewer steps than without the stop, the same disc
  const r = await page.evaluate(async () => {
    const f = window.__foort, v = f.view();
    const a = await f.trace({ ...v, stopOut: 0 }, { records: false }), b = await f.trace(v, { records: false });
    return { a: a.stats.steps, b: b.stats.steps };
  });
  expect(r.b).toBeLessThan(0.95 * r.a);
  // a background sky needs the escape directions: off, and the change re-traces
  await nextFinal(page, () => page.selectOption('select[name=sky]', 'deep-field'));
  expect(await stop(page)).toBe(0);
  await nextFinal(page, () => page.selectOption('select[name=sky]', 'none'));
  expect(await stop(page)).toBe(60);
  // a view that shows the directions: off
  await nextFinal(page, () => page.selectOption('select[name=view]', 'fourColor'));
  expect(await stop(page)).toBe(0);
  await nextFinal(page, () => page.selectOption('select[name=view]', 'emission'));
  // Reference has no trades; the fuzzball and FOORT parity are not gated for it
  await nextFinal(page, () => page.selectOption('select[name=quality]', 'reference'));
  expect(await stop(page)).toBe(0);
  await nextFinal(page, () => page.selectOption('select[name=quality]', 'normal'));
  expect(await stop(page)).toBe(60);
  await nextFinal(page, () => page.selectOption('select[name=metric]', 'st3cr'));
  expect(await stop(page)).toBe(0);
});
