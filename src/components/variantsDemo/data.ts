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
  /** Run tag shown as the chip on the direction row. */
  tag: string;
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
    brief: 'Tactile brushed-metal deck with glowing LEDs.',
    src: '/demos/jersey/skeuomorphic-deck.html',
    tag: 'Legacy Apple',
  },
  {
    id: '9ad7cb99-cf44-41d4-be97-db768e91ad4d',
    label: 'Liquid Glass',
    brief: 'Frosted glass islands over a live pitch.',
    src: '/demos/jersey/liquid-glass.html',
    tag: 'Legacy Apple',
  },
  {
    id: '00368aee-9194-4bdd-be73-00f40704dbf2',
    label: 'Macintosh System',
    brief: 'Faithful 1984 black-and-white Macintosh, bitmap type.',
    src: '/demos/jersey/macintosh-system.html',
    tag: 'Legacy Apple',
  },
  {
    id: 'c4318c43-f680-4200-a141-4ad08aa11318',
    label: 'Frutiger Aero',
    brief: 'Glossy mid-2000s Aqua pods and shine.',
    src: '/demos/jersey/frutiger-aero.html',
    tag: 'Retro flair',
  },
  {
    id: '8a4fd242-4c19-486c-a2b3-79f5e8b82dac',
    label: 'Halftone',
    brief: 'Retro CMYK Ben-Day halftone dots.',
    src: '/demos/jersey/halftone.html',
    tag: 'Retro flair',
  },
  {
    id: '8acd812d-13fc-405c-a82d-f27932bdec94',
    label: 'Discomorphic',
    brief: '1980s CRT teletext over disco green.',
    src: '/demos/jersey/discomorphic.html',
    tag: 'Retro flair',
  },
];
