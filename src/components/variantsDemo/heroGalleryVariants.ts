import type { DemoVariant } from './data';

/**
 * Gallery layout directions for the HERO showcase — the same gallery example
 * (and the same direction set) as `variants/data.ts`, expressed as
 * `DemoVariant`s so DirectionsPanel renders them with the standard
 * skeleton→resolved loading and the preview restyles a live <Gallery> instead
 * of loading jersey iframes.
 *
 * `src` is required by the type but never rendered in gallery mode (the hero
 * shows a real <Gallery>, not an iframe); it doubles as the stable key.
 *
 * MUST stay a stable module-level constant — `useVariantsDemo` keys its
 * generation effect on the array identity.
 */

export const HERO_GALLERY_RUN_LABEL = 'Gallery Layouts';

export const HERO_GALLERY_VARIANTS: DemoVariant[] = [
  {
    id: 'gallery-original',
    label: 'Original',
    brief: 'The gallery as it ships today — a clean three-up grid.',
    src: 'gallery:original',
    tag: HERO_GALLERY_RUN_LABEL,
    gallery: {},
  },
  {
    id: 'gallery-artful-grid',
    label: 'Try an artful grid layout',
    brief: 'An organic bento where item sizes vary by content.',
    src: 'gallery:artful-grid',
    tag: HERO_GALLERY_RUN_LABEL,
    gallery: { layout: { view: 'bento' } },
  },
  {
    id: 'gallery-compact-layout',
    label: 'Try a more compact layout',
    brief: 'A denser four-up archive with tighter gutters.',
    src: 'gallery:compact-layout',
    tag: HERO_GALLERY_RUN_LABEL,
    gallery: {
      layout: { view: 'grid', cols: 4 },
      cssVars: { '--gallery-gap': '4px' },
    },
  },
  {
    id: 'gallery-single-list',
    label: 'Stack into a single list',
    brief: 'Everything in one scannable vertical flow.',
    src: 'gallery:single-list',
    tag: HERO_GALLERY_RUN_LABEL,
    gallery: { layout: { view: 'list' } },
  },
];

/** Pinned initial selection for the hero (the app's real starting state). */
export const HERO_GALLERY_INITIAL_ID = 'gallery-original';
