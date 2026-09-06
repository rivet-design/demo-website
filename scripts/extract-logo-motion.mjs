/**
 * Lifts the artwork out of the brand's own motion study — the single source of
 * truth for the mark's geometry, its grain filters and the hand-drawn ink
 * doodle — into a string module the RivetMark component renders verbatim.
 *
 * Nothing here is re-authored: the SVG is copied as-is, and the only edit is
 * namespacing the element ids so a filter/mask reference can't collide with
 * anything else on the page.
 *
 *   node scripts/extract-logo-motion.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = new URL(
  '../../rivet-brand/animations/logo-motion.html',
  import.meta.url,
);
const OUT = new URL('../src/lib/rivetMarkArt.ts', import.meta.url);

const html = readFileSync(SRC, 'utf8');

const slice = (open, close) => {
  const start = html.indexOf(open);
  const end = html.indexOf(close, start);
  if (start === -1 || end === -1) throw new Error(`missing ${open}`);
  return html.slice(start, end + close.length);
};

// The art group runs to the last </g> before the stage closes.
const artStart = html.indexOf('<g id="art"');
const svgEnd = html.indexOf('</svg>', artStart);
const artEnd = html.lastIndexOf('</g>', svgEnd);

let defs = slice('<defs>', '</defs>');
let art = html.slice(artStart, artEnd + 4);

// Namespace every id the source defines, plus every url(#…) that points at one.
const IDS = [
  'filter0_n_789_128',
  'filter1_n_789_128',
  'filter2_n_789_128',
  'ink-reveal-mask',
  'ink-reveal-stroke',
  'piece-a',
  'piece-b',
  'piece-c',
  'ink-blob',
  'art',
];
for (const id of IDS) {
  const re = new RegExp(`(id="|url\\(#)${id}(?=["\\)])`, 'g');
  defs = defs.replace(re, `$1rm-${id}`);
  art = art.replace(re, `$1rm-${id}`);
}

const banner = `/**
 * GENERATED — do not edit by hand.
 *
 * The Rivet mark's artwork, copied verbatim out of
 * rivet-brand/animations/logo-motion.html by scripts/extract-logo-motion.mjs.
 * That file is the brand's motion study and the only place this geometry, the
 * fractal-noise grain filters and the hand-drawn ink doodle are authored; this
 * module exists so the site renders exactly it rather than an approximation.
 *
 * Ids are prefixed \`rm-\` so the filter and mask references can't collide.
 * Re-run the script after any change to the source file.
 */
`;

writeFileSync(
  OUT,
  `${banner}
/** The motion study's own canvas — 480×480, with the 318px artwork centred by
 * the art group's own translate(81 81). The extra room is what the pieces
 * travel through. */
export const MARK_VIEWBOX = '0 0 480 480';

/** <defs>: the three grain filters and the ink's trim-path reveal mask. */
export const MARK_DEFS = ${JSON.stringify(defs)};

/** The artwork itself: pieces A/B (chevron), C (diamond), and the ink doodle. */
export const MARK_ART = ${JSON.stringify(art)};
`,
);

console.log(`wrote ${OUT.pathname} — defs ${defs.length}b, art ${art.length}b`);
