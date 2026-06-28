import type { DemoVariant } from '../variantsDemo/data';

/**
 * Layout directions for the "Explore with precision" demo. These feed the SAME
 * pipes as the hero's jersey run: each is a `DemoVariant` so the Directions
 * panel (`DirectionsPanel`) renders it with the identical skeleton→resolved
 * loading, and the optional `gallery` config restyles the live <Gallery> on the
 * left when the direction is selected.
 *
 * `src` is required by the type but never rendered here (the comments demo shows
 * a real <Gallery>, not an iframe), so it points at an inert hero page.
 *
 * MUST stay a stable module-level constant — `useVariantsDemo` keys its
 * generation effect on the array identity.
 */

export const FLUID_RUN_LABEL = 'Fluid Layouts';

export const FLUID_VARIANTS: DemoVariant[] = [
  {
    id: 'fluid-flowing-grid',
    label: 'Flowing masonry grid',
    brief: 'Items breathe into an organic bento where sizes vary by content.',
    src: '/demos/jersey/skeuomorphic-deck.html',
    tag: FLUID_RUN_LABEL,
    gallery: { layout: { view: 'bento' } },
  },
  {
    id: 'fluid-airy-columns',
    label: 'Airy two-column',
    brief: 'Roomier cards in a relaxed two-up rhythm with generous gutters.',
    src: '/demos/jersey/frutiger-aero.html',
    tag: FLUID_RUN_LABEL,
    gallery: { layout: { view: 'grid', cols: 2 }, cssVars: { '--gallery-gap': '16px' } },
  },
  {
    id: 'fluid-edge-to-edge',
    label: 'Edge-to-edge gallery',
    brief: 'A wider four-up grid that lets work run to the panel edges.',
    src: '/demos/jersey/liquid-glass.html',
    tag: FLUID_RUN_LABEL,
    gallery: { layout: { view: 'grid', cols: 4 }, cssVars: { '--gallery-gap': '4px' } },
  },
  {
    id: 'fluid-reading-list',
    label: 'Continuous reading list',
    brief: 'Stack everything into one scannable vertical flow.',
    src: '/demos/jersey/halftone.html',
    tag: FLUID_RUN_LABEL,
    gallery: { layout: { view: 'list' } },
  },
];

/** The direction that resolves first and is pinned as the initial selection. */
export const FLUID_INITIAL_ID = 'fluid-flowing-grid';
