// M5: FOORT GeneralCircularRadialFluid (tools/foort_parity/build/fluid_dump) vs the JS port
// (js/fluid/generalCircularRadial.js): ISCO radius and covariant four-velocity at radii from the
// termination radius to 1000.
// Review C6 (2026-11-16): against FOORT v1.0.0, whose ISCO is the outermost stable -> unstable transition (a scan
// inward from the upper bound, then bisection of that bracket). Manko-Novikov a = 0.94, alpha3 = 2 has two stable
// bands in the search interval and is the multi-transition case.
// Usage (from dev/): node scripts/fluidParity.mjs  -> dev/reports/m5/fluid_parity.json
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMetric } from '../../js/metrics/registry.js';
import { createFluid, kerrISCO } from '../../js/fluid/generalCircularRadial.js';
import { terminationRadius } from '../../js/bake/bake.js';

const here = dirname(fileURLToPath(import.meta.url));
const exe = resolve(here, '../../tools/foort_parity/build/fluid_dump' + (process.platform === 'win32' ? '.exe' : ''));
const FLUIDS = [[1, 1, 1], [0.7, 0.5, 0.3], [0.5, 0, 1], [1, 0, 0]];
const CASES = [
  ['kerr', { a: 0 }, ['Kerr', '0']], ['kerr', { a: 0.5 }, ['Kerr', '0.5']], ['kerr', { a: 0.94 }, ['Kerr', '0.94']], ['kerr', { a: 0.998 }, ['Kerr', '0.998']],
  ['johannsen', { a: 0.94, alpha13: 5.5 }, ['Johannsen', '0.94', '5.5', '0', '0', '0']],
  ['johannsen', { a: 0.5, alpha13: -5 }, ['Johannsen', '0.5', '-5', '0', '0', '0']],
  ['mankoNovikov', { a: 0.94, alpha3: 2 }, ['MankoNovikov', '0.94', '2']],
  ['mankoNovikov', { a: 0.5, alpha3: 0.5 }, ['MankoNovikov', '0.5', '0.5']],
];
const out = [];
for (const [id, params, cli] of CASES) for (const [xi, br, bp] of FLUIDS) {
  const m = createMetric(id, params);
  const rT = terminationRadius(m);
  const radii = Array.from({ length: 400 }, (_, k) => rT * (1.0001 + 0) * Math.exp(Math.log(1000 / rT) * k / 399));
  const run = spawnSync(exe, [...cli, String(xi), String(br), String(bp)], { input: radii.join('\n'), encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`fluid_dump failed: ${run.stderr}`);
  const res = run.stdout, desc = run.stderr;
  const f = createFluid(m, { xi, betaR: br, betaPhi: bp });
  // ISCO from FOORT's description string ("ISCO = 6.000000", six decimals)
  const mm = /ISCO = ([0-9.eE+-]+)/.exec(desc);
  const iscoFOORT = mm ? Number(mm[1]) : null;
  // review C6: radii between the two ISCOs are circular in one code and plunging in the other; left out, and counted
  const gapLo = Math.min(f.isco ?? Infinity, iscoFOORT ?? Infinity) - 1e-6, gapHi = Math.max(f.isco ?? -Infinity, iscoFOORT ?? -Infinity) + 1e-6;
  let worst = 0, worstR = 0, inGap = 0, inShell = 0;
  for (const line of res.trim().split('\n')) {
    const [r, ut, ur, , up] = line.split(',').map(Number);
    if ((br > 0 || bp > 0) && r >= gapLo && r <= gapHi) { inGap++; continue; }
    const d = f.velocity(r).down;
    // FOORT db6a7e1: just inside an ISCO a little outside the true one, the plunge has no solution and the flow is the
    // radial infall (u_phi = 0); the shell is ~1e-4 M wide in FOORT and narrower in the JS port, whose ISCO is closer.
    // A sample in one code's shell only is counted, not compared
    if (bp > 0 && r < gapHi + 1e-3 && (up === 0) !== (d[3] === 0)) { inShell++; continue; }
    const sc = Math.abs(ut) + Math.abs(up) / r + Math.abs(ur);
    const e = Math.max(Math.abs(d[0] - ut), Math.abs(d[1] - ur), Math.abs(d[3] - up) / r) / sc;
    if (e > worst) { worst = e; worstR = r; }
  }
  // stable -> unstable transitions inside the ISCO search interval (FOORT takes the outermost)
  const bands = f.circularBands(f.params.iscoLower, f.params.iscoUpper, 2000);
  const transitions = bands.filter((b, i) => i > 0 && b.kind !== 'stable' && bands[i + 1]?.kind === 'stable').length;
  out.push({ metric: id, params, fluid: { xi, betaR: br, betaPhi: bp }, iscoJS: f.isco, iscoFOORT, iscoRelDiff: f.isco && iscoFOORT ? Math.abs(f.isco / iscoFOORT - 1) : null,
    iscoNoteJS: f.iscoNote, transitions, maxRelVelocityDiff: worst, atR: worstR, samplesBetweenIscos: inGap, samplesInFallbackShell: inShell, iscoKerr: id === 'kerr' ? kerrISCO(params.a) : null });
}
for (const o of out) {
  const e = (x) => (Number.isFinite(x) ? x.toExponential(1) : '—');
  console.log(`${o.metric} ${JSON.stringify(o.params)} fluid ${o.fluid.xi}/${o.fluid.betaR}/${o.fluid.betaPhi}: ISCO JS ${o.iscoJS?.toFixed(6)} FOORT ${o.iscoFOORT?.toFixed(6)} (rel ${e(o.iscoRelDiff)})`
    + `${o.iscoKerr ? `, analytic ${o.iscoKerr.toFixed(6)}` : ''}${o.transitions > 1 ? `, ${o.transitions} stable bands` : ''}; u_mu max rel diff ${e(o.maxRelVelocityDiff)} at r = ${o.atR.toPrecision(4)}`
    + `${o.samplesBetweenIscos ? ` (${o.samplesBetweenIscos} sample(s) between the ISCOs left out)` : ''}${o.samplesInFallbackShell ? ` (${o.samplesInFallbackShell} in a radial-fallback shell left out)` : ''}${o.iscoNoteJS ? `; JS note: ${o.iscoNoteJS}` : ''}`);
}
mkdirSync(resolve(here, '../reports/m5'), { recursive: true });
writeFileSync(resolve(here, '../reports/m5/fluid_parity.json'), JSON.stringify(out, null, 1));
