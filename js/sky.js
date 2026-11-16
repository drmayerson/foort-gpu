// @ts-check
// Review U3 (2026-11-16): the background sky behind the disc. Display only: each escaped ray's final direction (theta,
// phi + azimuth, in the record) picks a colour, so the sky is lensed for free and the azimuth drag visibly turns it.
//   stars: a generated star field (after the bh-camera's star sky)
//   pictures (the bh-camera's backgrounds/, sky/*.jpg): hung behind the black hole, filling the default field of view,
//     continued mirrored beyond their edges (no seam), also for light that arrives from behind the camera (the photon
//     ring shows the picture too), as in the bh-camera.

/** @type {Record<string, {file: string, credit: {en: string, nl: string}}>} */
export const SKY_PICTURES = {
  'deep-field': { file: 'deep-field.jpg', credit: { en: 'NASA and ESA, Hubble Ultra Deep Field (2004).', nl: 'NASA en ESA, Hubble Ultra Deep Field (2004).' } },
  pillars: { file: 'pillars.jpg', credit: { en: 'NASA, ESA and the Hubble Heritage Team (2014).', nl: 'NASA, ESA en het Hubble Heritage Team (2014).' } },
  earth: { file: 'earth.jpg', credit: { en: 'NASA, Apollo 17 (1972).', nl: 'NASA, Apollo 17 (1972).' } },
  moon: { file: 'moon.jpg', credit: { en: 'NASA, Apollo 11 (1969).', nl: 'NASA, Apollo 11 (1969).' } },
  earthrise: { file: 'earthrise.jpg', credit: { en: 'NASA, Bill Anders, Apollo 8 (1968).', nl: 'NASA, Bill Anders, Apollo 8 (1968).' } },
};

/** sky mode for the shader: 0 none, 2 a picture behind the hole (the star field too; 1, equirectangular, is unused) @param {string} name */
export const skyMode = (name) => (name === 'none' ? 0 : 2);

/** small seeded random generator, so the sky is the same every time @param {number} seed */
function rng(seed) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

/**
 * A generated star field, after the bh-camera's star sky (its nebula of soft coloured blobs and its star sizes and
 * colours), as a flat 2048 x 2048 picture: the viewer's field of view is narrow (0.9 degrees by default), so it hangs
 * behind the hole like the photos (an equirectangular sky would put 5 texels across the image).
 * @returns {HTMLCanvasElement}
 */
export function makeStarSky() {
  const W = 2048, r = rng(20261029);
  const sw = 256, small = document.createElement('canvas');
  small.width = small.height = sw;
  const sctx = /** @type {CanvasRenderingContext2D} */ (small.getContext('2d')), img = sctx.createImageData(sw, sw);
  const blobs = [];
  for (let i = 0; i < 14; i++) {
    const hue = r();
    blobs.push({ x: r(), y: r(), k: 20 + 120 * r(), a: 0.3 + 0.6 * r(), c: hue < 0.55 ? [40, 80, 190] : hue < 0.8 ? [120, 50, 150] : [170, 70, 60] });
  }
  for (let j = 0; j < sw; j++) for (let i = 0; i < sw; i++) {
    const x = (i + 0.5) / sw, y = (j + 0.5) / sw;
    let R = 6, G = 8, B = 22;
    for (const b of blobs) {
      // periodic distance, so the tile has no seam where it is mirrored
      const dx = Math.min(Math.abs(x - b.x), 1 - Math.abs(x - b.x)), dy = Math.min(Math.abs(y - b.y), 1 - Math.abs(y - b.y));
      const w = b.a * Math.exp(-b.k * (dx * dx + dy * dy));
      R += w * b.c[0] * 0.45; G += w * b.c[1] * 0.45; B += w * b.c[2] * 0.45;
    }
    const o = 4 * (j * sw + i);
    img.data[o] = Math.min(255, R); img.data[o + 1] = Math.min(255, G); img.data[o + 2] = Math.min(255, B); img.data[o + 3] = 255;
  }
  sctx.putImageData(img, 0, 0);
  const c = document.createElement('canvas');
  c.width = c.height = W;
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(small, 0, 0, W, W);
  for (let i = 0; i < 2500; i++) {
    const x = r() * W, y = r() * W;
    const m = Math.pow(r(), 6), rad = 0.7 + 2.6 * m, al = 0.35 + 0.65 * Math.sqrt(m);
    const t = r(), col = t < 0.15 ? '255,210,170' : t < 0.35 ? '190,215,255' : '255,255,250';
    ctx.fillStyle = `rgba(${col},${al.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, 2 * Math.PI);
    ctx.fill();
  }
  return c;
}

/** @type {Map<string, Promise<HTMLCanvasElement|HTMLImageElement|null>>} */
const loading = new Map();
/**
 * The image of a sky (cached): the generated star field or a picture from sky/.
 * @param {string} name @returns {Promise<HTMLCanvasElement|HTMLImageElement|null>}
 */
export function skyImage(name) {
  if (!loading.has(name)) {
    loading.set(name, name === 'stars' ? Promise.resolve(makeStarSky())
      : SKY_PICTURES[name] ? new Promise((res) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => { console.warn(`sky picture ${name} not loaded`); res(null); };
        im.src = new URL(`../sky/${SKY_PICTURES[name].file}`, import.meta.url).href;
      }) : Promise.resolve(null));
  }
  return /** @type {Promise<HTMLCanvasElement|HTMLImageElement|null>} */ (loading.get(name));
}
