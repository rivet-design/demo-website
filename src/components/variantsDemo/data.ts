// Rivet variant metadata for the self-contained variants demo.
//
// Mirrors the manifests under
//   rivet-direct/demos/jersey-app-texture/.rivet/variants/e2c57d4f-…
// (the "Teletext Designs" run). Each variant's static page is hosted under
// public/demos/jersey/<slug>.html and rendered in an <iframe>.

export type DemoVariant = {
  /** The Rivet variantId from the manifest. */
  id: string;
  /** Display label (manifest `label`). */
  label: string;
  /** One-line direction description (manifest `brief`). */
  brief: string;
  /** URL of the hosted static page for this variant. */
  src: string;
};

/** Shared run label (manifest `runLabel`) shown as the chip on each direction. */
export const RUN_LABEL = 'Teletext Designs';

/** The tactile Skeuomorphic Deck — used as the pinned default for the hero. */
export const SKEUOMORPHIC_DECK_ID = 'ee859344-5023-425f-8db3-7aa596346e09';

/** The prompt that produced the run (manifest `sessionPrompt`). */
export const SESSION_PROMPT =
  'Render every teletext design in the jersey kit studio as a Rivet variant.';

// Curated order — leads with the tactile Skeuomorphic Deck (the project's
// default index.html), then the most visually distinct directions.
export const VARIANTS: DemoVariant[] = [
  {
    id: 'ee859344-5023-425f-8db3-7aa596346e09',
    label: 'Skeuomorphic Deck',
    brief:
      'A tactile hardware control deck in brushed metal, glossy round buttons, glowing LEDs, and realistic depth.',
    src: '/demos/jersey/skeuomorphic-deck.html',
  },
  {
    id: '9ad7cb99-cf44-41d4-be97-db768e91ad4d',
    label: 'Liquid Glass',
    brief:
      'Apple-style frosted glass islands floating over a live WebGL-refracted grass pitch that warps in real time.',
    src: '/demos/jersey/liquid-glass.html',
  },
  {
    id: '00368aee-9194-4bdd-be73-00f40704dbf2',
    label: 'Macintosh System',
    brief:
      'A faithful 1984 black-and-white Macintosh System look — Chicago bitmap type, 1-bit dithered patterns, and pixel-perfect window chrome.',
    src: '/demos/jersey/macintosh-system.html',
  },
  {
    id: 'c4318c43-f680-4200-a141-4ad08aa11318',
    label: 'Frutiger Aero',
    brief:
      'The glossy mid-2000s Frutiger Aero / Aqua look — organic pod shapes, bubbly translucency, and wet candy-button shine.',
    src: '/demos/jersey/frutiger-aero.html',
  },
  {
    id: '8a4fd242-4c19-486c-a2b3-79f5e8b82dac',
    label: 'Halftone',
    brief:
      'A retro print aesthetic of CMYK Ben-Day halftone dots and bold screen-printed color fields.',
    src: '/demos/jersey/halftone.html',
  },
  {
    id: '8acd812d-13fc-405c-a82d-f27932bdec94',
    label: 'Discomorphic',
    brief:
      'Authentic 1980s broadcast teletext on a CRT — chunky color blocks, scanlines, and a subtle flicker over deep disco green.',
    src: '/demos/jersey/discomorphic.html',
  },
];
