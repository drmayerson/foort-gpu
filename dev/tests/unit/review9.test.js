// Review package 9 (E3): FITS export round-trips; CSV
import { describe, it, expect } from 'vitest';
import { writeFits, readFits, csv } from '../../../js/fits.js';

describe('E3: FITS', () => {
  it('a float32 cube and its header round-trip; interleaved data are transposed into planes', () => {
    const w = 5, h = 3, planes = 4, data = new Float32Array(w * h * planes);
    for (let k = 0; k < data.length; k++) data[k] = Math.fround(Math.sin(k) * 10 ** (k % 7 - 3));
    data[7] = NaN; data[8] = -0; data[9] = 3.4e38;
    const f = writeFits(data, { w, h, planes, interleaved: true, cards: [['METRIC', 'kerr'], ['A', 0.9375, 'spin'], ['NPIX', 512], ['SLOWLITE', true], ['QUOTE', "it's"]],
      comments: ['view: https://example.org/?a=1&' + 'x'.repeat(100)] });
    expect(f.length % 2880).toBe(0);
    const r = readFits(f);
    expect([r.w, r.h, r.planes]).toEqual([w, h, planes]);
    expect(r.header.METRIC).toBe('kerr');
    expect(r.header.A).toBe(0.9375);
    expect(r.header.NPIX).toBe(512);
    expect(r.header.SLOWLITE).toBe(true);
    expect(r.header.QUOTE).toBe("it's");
    expect(r.comments.join('')).toContain('x'.repeat(60));
    for (let p = 0; p < planes; p++) for (let k = 0; k < w * h; k++) {
      const a = data[k * planes + p], b = r.data[p * w * h + k];
      if (Number.isNaN(a)) expect(Number.isNaN(b)).toBe(true); else expect(Object.is(a, b)).toBe(true);
    }
    // every header card is 80 printable ASCII characters
    const head = String.fromCharCode(...f.subarray(0, 2880));
    expect(/^[\x20-\x7e]+$/.test(head)).toBe(true);
    expect(head.slice(0, 30)).toBe('SIMPLE  =                    T');
  });
  it('CSV', () => {
    expect(csv(['t', 'x'], [[1, 0.5], [2, NaN]])).toBe('t,x\n1,0.5\n2,\n');
  });
});
