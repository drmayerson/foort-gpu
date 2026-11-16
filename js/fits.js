// @ts-check
// Review E3 (2026-11-16): FITS files of the image data (the linear disc intensity and the per-pixel records), with the
// view in the header, readable by astropy (astropy.io.fits.open) or any FITS reader. One primary HDU: a float32 cube
// (BITPIX = -32, big-endian), NAXIS1 = width, NAXIS2 = height (row 1 at the bottom of the image, FITS's convention and
// the records' own), NAXIS3 = planes. Header: 80-character cards in 2880-byte blocks.

/**
 * @typedef {[string, string|number|boolean, string?]} Card  keyword (<= 8 characters), value, comment
 */

/** a value as FITS writes it @param {string|number|boolean} v */
function fitsValue(v) {
  if (typeof v === 'boolean') return (v ? 'T' : 'F').padStart(20);
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return "'NaN'".padEnd(20);
    const s = Number.isInteger(v) && Math.abs(v) < 1e15 ? String(v) : v.toExponential(12).toUpperCase();
    return s.padStart(20);
  }
  const q = `'${String(v).replace(/'/g, "''").slice(0, 66).padEnd(8)}'`;
  return q.padEnd(20);
}

/** @param {string} key @param {string|number|boolean} v @param {string} [comment] */
function card(key, v, comment) {
  let s = `${key.toUpperCase().padEnd(8).slice(0, 8)}= ${fitsValue(v)}`;
  if (comment) s += ` / ${comment}`;
  return s.slice(0, 80).padEnd(80);
}

/**
 * A FITS file of a float32 cube.
 * @param {Float32Array} data planes of width x height, plane-major (data[(p * h + j) * w + i]), or pixel-major with `interleaved`
 * @param {{w: number, h: number, planes: number, interleaved?: boolean, cards?: Card[], comments?: string[]}} o
 *   interleaved: data[(j * w + i) * planes + p] (the record layout), transposed here into planes
 * @returns {Uint8Array}
 */
export function writeFits(data, o) {
  const { w, h, planes } = o;
  const lines = [
    card('SIMPLE', true, 'conforms to FITS'), card('BITPIX', -32, 'IEEE float32'), card('NAXIS', 3),
    card('NAXIS1', w, 'image width (pixels)'), card('NAXIS2', h, 'image height (pixels; row 1 at the bottom)'), card('NAXIS3', planes, 'planes'),
  ];
  for (const [k, v, c] of o.cards ?? []) lines.push(card(k, v, c));
  for (const t of o.comments ?? []) for (let i = 0; i < t.length || i === 0; i += 72) lines.push(`COMMENT ${t.slice(i, i + 72)}`.padEnd(80));
  lines.push('END'.padEnd(80));
  const head = lines.join('');
  const headLen = Math.ceil(head.length / 2880) * 2880;
  const n = w * h * planes, dataLen = Math.ceil((4 * n) / 2880) * 2880;
  const out = new Uint8Array(headLen + dataLen);
  for (let i = 0; i < headLen; i++) out[i] = i < head.length ? head.charCodeAt(i) & 0x7f : 32;
  const dv = new DataView(out.buffer, headLen, dataLen);
  for (let p = 0; p < planes; p++) for (let k = 0; k < w * h; k++) {
    const v = o.interleaved ? data[k * planes + p] : data[p * w * h + k];
    dv.setFloat32(4 * (p * w * h + k), v, false);
  }
  return out;
}

/**
 * Read a FITS file written by writeFits (or any single-HDU float32 image): header cards and the data, plane-major.
 * @param {Uint8Array} b @returns {{header: Record<string, string|number|boolean>, comments: string[], w: number, h: number, planes: number, data: Float32Array}}
 */
export function readFits(b) {
  /** @type {Record<string, string|number|boolean>} */
  const header = {};
  const comments = [];
  let p = 0;
  for (;; p += 80) {
    if (p + 80 > b.length) throw new Error('FITS: no END card');
    const line = String.fromCharCode(...b.subarray(p, p + 80));
    const key = line.slice(0, 8).trim();
    if (key === 'END') break;
    if (key === 'COMMENT') { comments.push(line.slice(8).trimEnd()); continue; }
    if (line.slice(8, 10) !== '= ') continue;
    let v = line.slice(10).trim();
    if (v.startsWith("'")) {
      // a quoted string: '' is a quote inside it
      let t = '';
      for (let i = 1; i < v.length; i++) {
        if (v[i] === "'") { if (v[i + 1] === "'") { t += "'"; i++; continue; } break; }
        t += v[i];
      }
      header[key] = t.trimEnd();
    } else {
      v = v.split('/')[0].trim();
      header[key] = v === 'T' ? true : v === 'F' ? false : Number(v);
    }
  }
  const dataStart = Math.ceil((p + 80) / 2880) * 2880;
  const w = Number(header.NAXIS1), h = Number(header.NAXIS2), planes = Number(header.NAXIS3 ?? 1);
  if (header.BITPIX !== -32) throw new Error(`FITS: BITPIX ${header.BITPIX} (expected -32)`);
  const n = w * h * planes, data = new Float32Array(n);
  const dv = new DataView(b.buffer, b.byteOffset + dataStart, 4 * n);
  for (let k = 0; k < n; k++) data[k] = dv.getFloat32(4 * k, false);
  return { header, comments, w, h, planes, data };
}

/**
 * CSV text of rows (numbers formatted with full precision).
 * @param {string[]} cols @param {(number|string)[][]} rows
 */
export function csv(cols, rows) {
  return [cols.join(','), ...rows.map((r) => r.map((x) => (typeof x === 'number' ? (Number.isFinite(x) ? String(x) : '') : `"${String(x).replace(/"/g, '""')}"`)).join(','))].join('\n') + '\n';
}
