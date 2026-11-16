// @ts-check
// Review U2 (2026-11-16): English and Dutch for the normal panel, the captions and the toolbar; the expert panel stays
// English. The choice is shared with the site's homepage (localStorage 'home-lang'; the same origin), and ?lang=en|nl
// overrides it, as on the homepage.

const KEY = 'home-lang';

/** @typedef {'en'|'nl'} Lang */

/** @returns {Lang} */
export function initialLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'en' || q === 'nl') return q;
  try { const s = localStorage.getItem(KEY); if (s === 'en' || s === 'nl') return s; } catch { /* not available */ }
  return 'en';
}
/** @param {Lang} l */
export function saveLang(l) { try { localStorage.setItem(KEY, l); } catch { /* not available */ } }

/** @type {Lang} */
let lang = 'en';
/** @param {Lang} l */
export const setLang = (l) => { lang = l; document.documentElement.lang = l; };
export const getLang = () => lang;

/**
 * Strings by key, English and Dutch. {name} is replaced by vars[name].
 * @type {Record<string, {en: string, nl: string}>}
 */
const S = {
  // toolbar
  expertPanel: { en: 'Expert panel', nl: 'Expertpaneel' },
  normalPanel: { en: 'Simple panel', nl: 'Eenvoudig paneel' },
  hidePanel: { en: 'Hide panel', nl: 'Paneel verbergen' },
  showPanel: { en: 'Show panel', nl: 'Paneel tonen' },
  fullscreen: { en: 'Fullscreen', nl: 'Volledig scherm' },
  snapshot: { en: 'Snapshot', nl: 'Foto' },
  record: { en: 'Record video', nl: 'Video opnemen' },
  reset: { en: 'Reset to defaults', nl: 'Standaardinstellingen' },
  more: { en: 'More', nl: 'Meer' },
  guide: { en: 'Guide', nl: 'Handleiding (Engels)' },
  tagline: { en: 'A black hole or a fuzzball with its disc of hot gas, ray traced live on your graphics card.',
    nl: 'Een zwart gat of een fuzzball met zijn schijf van heet gas, live berekend op je grafische kaart.' },
  // panel groups and presets
  grpView: { en: 'What you see', nl: 'Wat je ziet' },
  grpMore: { en: 'More settings', nl: 'Meer instellingen' },
  presets: { en: 'Quick views', nl: 'Snelle keuzes' },
  pFaceOn: { en: 'Face-on', nl: 'Van boven' },
  pEdgeOn: { en: 'Edge-on', nl: 'Van opzij' },
  pNoSpin: { en: 'Not spinning', nl: 'Draait niet' },
  pFastSpin: { en: 'Fast spin', nl: 'Draait snel' },
  pCompare: { en: 'Fuzzball next to black hole', nl: 'Fuzzball naast zwart gat' },
  // image
  explain: { en: 'What am I looking at?', nl: 'Wat zie ik hier?' },
  explainHide: { en: 'Hide the labels', nl: 'Labels verbergen' },
  lShadow: { en: 'shadow: light that came too close fell in', nl: 'schaduw: licht dat te dichtbij kwam, viel erin' },
  lRing: { en: 'photon ring: light that circled the hole', nl: 'fotonring: licht dat rond het gat cirkelde' },
  lBright: { en: 'brighter: the gas moves towards you here', nl: 'helderder: hier beweegt het gas naar je toe' },
  lDim: { en: 'dimmer: the gas moves away from you', nl: 'zwakker: hier beweegt het gas van je weg' },
  lCentreFb: { en: 'no shadow: light passes through the centre', nl: 'geen schaduw: licht gaat door het centrum' },
  lDisc: { en: 'the disc of hot gas, bent over the top by gravity', nl: 'de schijf van heet gas, door de zwaartekracht over de bovenkant gebogen' },
  waiting: { en: 'Computing the image…', nl: 'Het beeld wordt berekend…' },
  waitingFirst: { en: 'Measuring this computer, then computing the image…', nl: 'Deze computer wordt gemeten, daarna wordt het beeld berekend…' },
  left: { en: 'left', nl: 'links' },
  right: { en: 'right', nl: 'rechts' },
  failed: { en: 'This image could not be computed. Try another view, or open the expert panel for the details.',
    nl: 'Dit beeld kon niet berekend worden. Probeer een andere kijkrichting, of open het expertpaneel voor de details.' },
  // captions (review U1: one plain caption per spacetime; drafts, for the user to edit)
  capKerr: {
    en: 'A black hole spinning {spin}, seen {view}. The dark centre is its shadow: light that comes too close falls in. The thin bright ring around it is light that circled the black hole before reaching you. The disc of hot gas is brighter on the side where it moves towards you, and gravity bends the far side of the disc up into view over the top.',
    nl: 'Een zwart gat dat {spin} draait, {view} bekeken. Het donkere midden is zijn schaduw: licht dat te dichtbij komt, valt erin. De dunne heldere ring eromheen is licht dat rond het zwarte gat cirkelde voor het bij jou aankwam. De schijf van heet gas is helderder aan de kant waar hij naar je toe beweegt, en de zwaartekracht buigt de achterkant van de schijf over de bovenkant in beeld.',
  },
  capFb: {
    en: 'A fuzzball, an object from string theory that has the mass of a black hole but no horizon ({lam}). Light can pass through its centre, so there is no fully dark shadow. Light that wanders between its structures for a long time makes the fine, grainy pattern in the middle; the disc of hot gas around it looks much like that of a black hole.',
    nl: 'Een fuzzball, een object uit de snaartheorie met de massa van een zwart gat maar zonder horizon ({lam}). Licht kan door het centrum gaan, dus er is geen volledig donkere schaduw. Licht dat lang tussen zijn structuren dwaalt, maakt het fijne, korrelige patroon in het midden; de schijf van heet gas eromheen lijkt sterk op die van een zwart gat.',
  },
  capFbBh: {
    en: 'The limit of the fuzzball in which it becomes a black hole (λ = 0): now there is a horizon, and with it a dark shadow.',
    nl: 'De limiet waarin de fuzzball een zwart gat wordt (λ = 0): nu is er een horizon, en daarmee een donkere schaduw.',
  },
  capCompare: { en: 'Left: {a}. Right: {b}. Both are seen with the same camera.', nl: 'Links: {a}. Rechts: {b}. Beide met dezelfde camera bekeken.' },
  cmpBh: { en: 'a black hole', nl: 'een zwart gat' },
  cmpFb: { en: 'a fuzzball', nl: 'een fuzzball' },
  spinNone: { en: 'not at all', nl: 'helemaal niet' },
  spinSlow: { en: 'slowly', nl: 'traag' },
  spinMid: { en: 'quite fast', nl: 'vrij snel' },
  spinFast: { en: 'almost as fast as possible', nl: 'bijna zo snel als mogelijk' },
  viewFaceOn: { en: 'almost from above', nl: 'bijna van boven' },
  viewTilted: { en: 'at an angle of {deg}° from its spin axis', nl: 'onder een hoek van {deg}° met zijn draaias' },
  viewEdgeOn: { en: 'almost edge-on', nl: 'bijna van opzij' },
  lamText: { en: 'λ = {lam}: the larger λ, the further it is from a black hole', nl: 'λ = {lam}: hoe groter λ, hoe verder van een zwart gat' },
  calm: { en: ' The disc is shown averaged over time.', nl: ' De schijf is gemiddeld over de tijd getoond.' },
  flicker: { en: ' The flickering is turbulence in the gas.', nl: ' Het flikkeren is turbulentie in het gas.' },
  skyCredit: { en: ' Background: {credit}', nl: ' Achtergrond: {credit}' },
  notesIntro: { en: 'Adjusted to keep the view valid:', nl: 'Aangepast om het beeld geldig te houden:' },
  // help
  helpTitle: { en: 'Mouse, touch and keyboard', nl: 'Muis, aanraken en toetsenbord' },
  close: { en: 'Close', nl: 'Sluiten' },
};

/** @param {string} key @param {Record<string, string|number>} [vars] */
export function t(key, vars) {
  const e = S[key];
  let s = e ? e[lang] ?? e.en : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/**
 * Normal-panel labels (and option labels) of the controls, by control key. The expert panel keeps its own labels.
 * @type {Record<string, {en: string, nl: string, options?: Record<string, {en: string, nl: string}>}>}
 */
export const CONTROL_TEXT = {
  family: { en: 'object', nl: 'object', options: { bh: { en: 'black hole', nl: 'zwart gat' }, fuzzball: { en: 'fuzzball (string theory)', nl: 'fuzzball (snaartheorie)' } } },
  a: { en: 'spin', nl: 'draaiing' },
  lambda: { en: 'λ: how far from a black hole (far left: a black hole)', nl: 'λ: hoe ver van een zwart gat (helemaal links: een zwart gat)' },
  inc: { en: 'viewing angle from the spin axis (°)', nl: 'kijkhoek ten opzichte van de draaias (°)' },
  screen: { en: 'field of view (smaller = zoom in)', nl: 'beeldveld (kleiner = inzoomen)' },
  az: { en: 'walk around (°)', nl: 'rondwandelen (°)' },
  sky: { en: 'background', nl: 'achtergrond' },
  play: { en: 'play', nl: 'afspelen' },
  timeAvg: { en: 'calm disc (averaged over time)', nl: 'rustige schijf (gemiddeld over de tijd)' },
  compare: { en: 'compare black hole and fuzzball', nl: 'zwart gat en fuzzball vergelijken',
    options: { off: { en: 'off', nl: 'uit' }, split: { en: 'split screen (drag the divider)', nl: 'gesplitst beeld (sleep de scheiding)' },
      side: { en: 'side by side', nl: 'naast elkaar' }, blink: { en: 'blink', nl: 'knipperen' } } },
  blinkHz: { en: 'blink rate (per second)', nl: 'knippersnelheid (per seconde)' },
  brightness: { en: 'brightness', nl: 'helderheid' },
  speed: { en: 'speed (M per second)', nl: 'snelheid (M per seconde)' },
  blur: { en: 'telescope resolution (blur)', nl: 'telescoopresolutie (vervaging)' },
  beamUas: { en: 'beam width (µas)', nl: 'bundelbreedte (µas)' },
  beamM: { en: 'beam width (M)', nl: 'bundelbreedte (M)' },
  lightcurve: { en: 'light curve (brightness against time)', nl: 'lichtcurve (helderheid tegen de tijd)' },
  units: { en: 'units', nl: 'eenheden' },
  unitMass: { en: 'mass (M☉)', nl: 'massa (M☉)' },
  unitDist: { en: 'distance (kpc)', nl: 'afstand (kpc)' },
  realTime: { en: 'real time (1 s of clock = 1 s)', nl: 'echte tijd (1 s klok = 1 s)' },
  inspect: { en: 'pixel inspector (click the image: the light ray)', nl: 'pixelinspecteur (klik op het beeld: de lichtstraal)' },
  snapBurn: { en: 'snapshot: burn in the scale bar and the clock', nl: 'foto: schaalbalk en klok erin branden' },
  vidSeconds: { en: 'video length (s)', nl: 'videolengte (s)' },
  vidFps: { en: 'video frames per second', nl: 'videobeelden per seconde' },
  vidLoop: { en: 'video: one seamless loop', nl: 'video: één naadloze lus' },
};

/** @param {string} key @returns {string|null} the normal-panel label in the current language */
export const controlLabel = (key) => (CONTROL_TEXT[key] ? CONTROL_TEXT[key][lang] : null);
/** @param {string} key @param {string} opt @returns {string|null} */
export const optionLabel = (key, opt) => CONTROL_TEXT[key]?.options?.[opt]?.[lang] ?? null;
