// Review package 6 (C6): FOORT v1.0.0's ISCO search (scan from the upper bound for the outermost stable -> unstable
// transition, then bisection), its "no ISCO" exits and its near-bound warning
import { describe, it, expect } from 'vitest';
import { createMetric } from '../../../js/metrics/registry.js';
import { createFluid, kerrISCO } from '../../../js/fluid/generalCircularRadial.js';

const fluid = (id, params, extra = {}) => createFluid(createMetric(id, params), { xi: 1, betaR: 1, betaPhi: 1, ...extra });

describe('C6: ISCO search as FOORT v1.0.0', () => {
  it('Kerr: the analytic ISCO, no warning', () => {
    for (const a of [0, 0.5, 0.94, 0.998]) {
      const f = fluid('kerr', { a });
      expect(Math.abs(/** @type {number} */ (f.isco) / kerrISCO(a) - 1)).toBeLessThan(2e-6);
      expect(f.iscoNote).toBe('');
    }
  });
  it('Manko-Novikov a = 0.94, alpha3 = 2 (two stable bands): the outermost transition', () => {
    const f = fluid('mankoNovikov', { a: 0.94, alpha3: 2 });
    // FOORT v1.0.0: 1.987852 (its nested finite differences; the JS value is converged to 1e-6 in the step size).
    // The whole-interval bisection used before found the inner transition, 1.442845
    expect(f.isco).toBeCloseTo(1.98772, 4);
    const bands = f.circularBands(1.0, 30, 2000).filter((b) => b.kind === 'stable');
    expect(bands.length).toBe(2);
  });
  it('no stable orbit at the upper bound: no ISCO', () => {
    const f = fluid('kerr', { a: 0 }, { iscoLower: 2, iscoUpper: 5 });
    expect(f.isco).toBeNull();
    expect(f.iscoNote).toMatch(/upper bound/);
  });
  it('only stable orbits in the interval: no ISCO', () => {
    const f = fluid('kerr', { a: 0 }, { iscoLower: 7, iscoUpper: 20 });
    expect(f.isco).toBeNull();
    expect(f.iscoNote).toMatch(/all circular orbits/);
  });
  it('an ISCO within 1% of the search interval of a bound is found, with a warning', () => {
    const f = fluid('kerr', { a: 0 }, { iscoLower: 5.95, iscoUpper: 20 });
    expect(f.isco).toBeCloseTo(6, 5);
    expect(f.iscoNote).toMatch(/lower bound/);
  });
  it('without an ISCO the fluid is circular wherever a circular orbit exists (FOORT)', () => {
    const f = fluid('kerr', { a: 0 }, { iscoLower: 7, iscoUpper: 20 });
    const v = f.velocity(10).down;
    expect(v[1]).toBe(0);
    expect(v[3]).toBeCloseTo(Math.sqrt(10 / (1 - 3 / 10)), 6);   // L of the circular Schwarzschild orbit
  });
});
