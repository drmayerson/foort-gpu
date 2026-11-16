// @ts-check
// Review packages 7-8 (2026-11-16): the simple panel's caption, the "What am I looking at?" labels, the help table and
// the fitting of the image into the window.
import { t, getLang } from './i18n.js';
import { SKY_PICTURES } from '../sky.js';
import { RECORD_FLOATS } from '../gpu/traceConfig.js';

/** @param {number} a */
const spinWord = (a) => t(Math.abs(a) < 0.05 ? 'spinNone' : Math.abs(a) < 0.4 ? 'spinSlow' : Math.abs(a) < 0.85 ? 'spinMid' : 'spinFast');
/** @param {number} inc */
const viewWord = (inc) => {
  const d = Math.min(inc, 180 - inc);
  return d < 12 ? t('viewFaceOn') : d > 78 ? t('viewEdgeOn') : t('viewTilted', { deg: Math.round(d) });
};

/**
 * One plain caption for the state (review U1), in the current language.
 * @param {Record<string, any>} s @param {{fuzzball: boolean, bh0: boolean}} kind @param {string} [otherName] compare: the other side
 */
export function captionText(s, kind, otherName) {
  let c;
  if (s.compare !== 'off' && otherName) c = t('capCompare', { a: kind.fuzzball ? t('cmpFb') : t('cmpBh'), b: otherName });
  else if (!kind.fuzzball) c = t('capKerr', { spin: spinWord(s.a), view: viewWord(s.inc) });
  else if (kind.bh0) c = t('capFbBh');
  else c = t('capFb', { lam: t('lamText', { lam: Number(s.lambda).toPrecision(2) }) });
  if (s.timeAvg) c += t('calm');
  else if (s.play && s.sigmaN > 0) c += t('flicker');
  const pic = SKY_PICTURES[s.sky];
  if (pic) c += t('skyCredit', { credit: pic.credit[getLang()] });
  return c;
}

/**
 * Where to put the explanation labels (review U1), from the coarse records of a trace (w x h texels, row 0 at the
 * bottom) and their disc intensities. Positions are fractions of the image from its top-left corner.
 * @param {Float32Array} rec @param {number} w @param {number} h @param {Float32Array} I disc intensity per texel
 * @param {{fuzzball: boolean, inc: number}} o
 * @returns {{key: string, x: number, y: number}[]}
 */
export function labelSpots(rec, w, h, I, o) {
  const fx = (/** @type {number} */ i) => (i + 0.5) / w, fy = (/** @type {number} */ j) => 1 - (j + 0.5) / h;
  let n = 0, sx = 0, sy = 0, top = -1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if ((Math.round(rec[RECORD_FLOATS * (j * w + i)]) & 15) !== 1) continue;
    n++; sx += i; sy += j; top = Math.max(top, j);
  }
  /** @type {{key: string, x: number, y: number}[]} */
  const out = [];
  const cx = n ? sx / n : (w - 1) / 2, cy = n ? sy / n : (h - 1) / 2;
  if (n > 4) {
    out.push({ key: 'lShadow', x: fx(cx), y: fy(cy) });
    // the photon ring just outside the top of the shadow
    out.push({ key: 'lRing', x: fx(cx), y: fy(Math.min(h - 1, top + 1)) });
  } else if (o.fuzzball) out.push({ key: 'lCentreFb', x: 0.5, y: 0.5 });
  // brighter and dimmer sides: the intensity-weighted centres of the left and right halves
  const side = [{ s: 0, x: 0, y: 0 }, { s: 0, x: 0, y: 0 }];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const v = I[j * w + i];
    if (!(v > 0)) continue;
    const b = side[i < cx ? 0 : 1];
    b.s += v; b.x += v * i; b.y += v * j;
  }
  if (side[0].s > 0 && side[1].s > 0) {
    const hi = side[0].s > side[1].s ? 0 : 1, lo = 1 - hi;
    if (side[hi].s > 1.3 * side[lo].s) {
      out.push({ key: 'lBright', x: fx(side[hi].x / side[hi].s), y: fy(side[hi].y / side[hi].s) });
      out.push({ key: 'lDim', x: fx(side[lo].x / side[lo].s), y: fy(side[lo].y / side[lo].s) });
    }
  }
  // the far side of the disc lensed over the top (inclined views): the brightest texel above the ring in the centre column
  const d = Math.min(o.inc, 180 - o.inc);
  if (d > 25 && n > 4) {
    let best = 0, bj = -1;
    const ci = Math.round(cx);
    for (let j = top + 2; j < h; j++) { const v = I[j * w + ci]; if (v > best) { best = v; bj = j; } }
    if (bj > 0) out.push({ key: 'lDisc', x: fx(ci), y: fy(bj) });
  }
  return out;
}

/** label boxes sit in fixed slots near the image edges (no two labels share one), joined to their spots by a line */
const SLOTS = /** @type {Record<string, [number, number]>} */ ({ TL: [0.25, 0.07], TR: [0.75, 0.07], BL: [0.25, 0.93], BR: [0.75, 0.93], L: [0.15, 0.5], R: [0.85, 0.5] });

/**
 * Draw the labels: a dot at each spot, its text in a slot near the edge of the image, and a line between them.
 * @param {HTMLElement} el @param {{key: string, x: number, y: number}[]} spots
 */
export function renderLabels(el, spots) {
  const bright = spots.find((sp) => sp.key === 'lBright');
  const brightLeft = bright ? bright.x < 0.5 : true;
  /** @type {Record<string, string>} */
  const slotOf = { lRing: 'TL', lDisc: 'TR', lCentreFb: 'TL', lBright: brightLeft ? 'BL' : 'BR', lDim: brightLeft ? 'BR' : 'BL', lShadow: brightLeft ? 'R' : 'L' };
  const lines = [], boxes = [];
  for (const sp of spots) {
    const slot = slotOf[sp.key] ?? 'TL', [bx, by] = SLOTS[slot];
    lines.push(`<line x1="${100 * sp.x}%" y1="${100 * sp.y}%" x2="${100 * bx}%" y2="${100 * by}%" stroke="white" stroke-width="1.5" stroke-opacity="0.75"/>`
      + `<circle cx="${100 * sp.x}%" cy="${100 * sp.y}%" r="4" fill="white" stroke="black" stroke-width="1.5"/>`);
    boxes.push(`<div class="lbl${slot === 'L' || slot === 'R' ? ' side' : ''}" style="left:${100 * bx}%;top:${100 * by}%">${t(sp.key)}</div>`);
  }
  el.innerHTML = `<svg>${lines.join('')}</svg>${boxes.join('')}`;
}

/** the help table rows, in the current language @returns {string} */
export function helpRows() {
  const nl = getLang() === 'nl';
  const rows = nl ? [
    ['links–rechts slepen', 'rondwandelen (meteen)'], ['op–neer slepen', 'kijkhoek (voorbeeld tijdens het slepen)'], ['scrollwiel / knijpen', 'zoomen'],
    ['shift-slepen / met twee vingers slepen', 'verschuiven'], ['spatie', 'afspelen / pauzeren'], ['← → / ↑ ↓', 'rondwandelen / kijkhoek'], ['+ −', 'zoomen'],
    ['c', 'vergelijken aan / uit; b: met de hand wisselen'], ['e', 'eenvoudig paneel / expertpaneel'], ['h', 'paneel verbergen'], ['f', 'volledig scherm'],
    ['s', 'foto (PNG)'], ['r', 'video opnemen'], ['?', 'deze hulp; Esc sluit'],
  ] : [
    ['drag left–right', 'walk around (instant)'], ['drag up–down', 'viewing angle (preview while dragging)'], ['wheel / pinch', 'zoom'],
    ['shift-drag / two-finger drag', 'pan'], ['space', 'play / pause'], ['← → / ↑ ↓', 'walk around / viewing angle'], ['+ −', 'zoom'],
    ['c', 'compare on / off; b: switch by hand'], ['e', 'simple / expert panel'], ['h', 'hide the panel'], ['f', 'fullscreen'],
    ['s', 'snapshot (PNG)'], ['r', 'record a video'], ['?', 'this help; Esc closes it'],
  ];
  return rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
}

/**
 * Review U5/U9: the largest image that fits. Desktop: the image column's box (the panel scrolls on its own). Narrow
 * windows: the full width, at most 55% of the window height (the image is pinned at the top).
 * @param {HTMLElement} col @param {HTMLElement} wrap @param {number} aspect width / height (2: compare side by side)
 * @returns {number} the width of one view in CSS pixels
 */
export function fitImage(col, wrap, aspect) {
  const narrow = window.innerWidth <= 820;
  const r = col.getBoundingClientRect();
  const W = Math.max(64, r.width), H = Math.max(64, narrow ? 0.55 * window.innerHeight : r.height);
  const h = Math.floor(Math.min(H, W / aspect));
  wrap.style.width = `${Math.floor(h * aspect)}px`;
  wrap.style.height = `${h}px`;
  return h;
}
