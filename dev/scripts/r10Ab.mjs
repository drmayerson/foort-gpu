// Review package 10 (P7): Normal against Normal + an idea, alternating A/B/A/B (median of 7 each), GPU time and steps, at
// 512^2 on black-hole scenes of the quality gate.
// Usage (from dev/): node scripts/r10Ab.mjs [--idea stopOut|epsHorizon|far16]  -> dev/reports/b10/ab_<idea>.json
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openViewer } from './gpuRunner.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const idea = args.includes('--idea') ? args[args.indexOf('--idea') + 1] : 'stopOut';
const IDEAS = { stopOut: { stopOut: 60 }, epsHorizon: { epsHorizon: 0.05 }, far16: { farSteps: { r: 20, max: 16 } } };
const D = Math.PI / 180;
const scenes = [['kerr_a0_inc17', 'kerr', { a: 0 }, 17], ['kerr_a0.94_inc17', 'kerr', { a: 0.94 }, 17], ['kerr_a0.94_inc80', 'kerr', { a: 0.94 }, 80],
  ['johannsen', 'johannsen', { a: 0.94, alpha13: 5.5 }, 17], ['mankoNovikov', 'mankoNovikov', { a: 0.94, alpha3: 2 }, 30], ['rn_Q0.8', 'reissnerNordstrom', { Q: 0.8 }, 60]];
const v = await openViewer({ port: 8786 });
const rows = [];
try {
  for (const [name, metric, metricParams, inc] of scenes) {
    const base = { metric, metricParams, camera: { r: 1000, theta: inc * D, screen: 15 }, N: 512, path: 'auto', texelReuse: true, eps: 0.03, farSteps: { r: 20, max: 4 }, bs3: { tol: 0.1, cap: 4 } };
    const r = await v.page.evaluate(async ([a, b]) => {
      const f = window.__foort, ms = { a: [], b: [] }, steps = {};
      for (const [k, view] of [['a', a], ['b', b]]) await f.trace(view, { records: false, measureSteps: false });   // warm-up
      for (let i = 0; i < 7; i++) for (const [k, view] of [['a', a], ['b', b]]) {
        const t = await f.trace(view, { records: false, measureSteps: i === 0 });
        ms[k].push(t.stats.gpuMs ?? t.stats.wallMs);
        if (i === 0) steps[k] = t.stats.steps;
      }
      const med = (x) => [...x].sort((p, q) => p - q)[x.length >> 1];
      return { a: med(ms.a), b: med(ms.b), stepsA: steps.a, stepsB: steps.b };
    }, [base, { ...base, ...IDEAS[idea] }]);
    const row = { scene: name, normalMs: r.a, ideaMs: r.b, speedup: r.a / r.b, stepRatio: r.stepsB / r.stepsA };
    rows.push(row);
    console.log(`${name}: Normal ${r.a.toFixed(1)} ms, + ${idea} ${r.b.toFixed(1)} ms (${row.speedup.toFixed(2)}x), steps x${row.stepRatio.toFixed(3)}`);
  }
} finally { await v.close(); }
mkdirSync(resolve(here, '../reports/b10'), { recursive: true });
writeFileSync(resolve(here, `../reports/b10/ab_${idea}.json`), JSON.stringify({ idea, date: new Date().toISOString(), rows }, null, 1));
