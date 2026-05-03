import type { Variant } from './types';

/**
 * Gallery-targeted variants. Labels follow the design language's imperative
 * rule and each direction departs clearly from the others without overlapping
 * scope. Implementations are mostly CSS-variable overrides on `.rivet-gallery`
 * — the existing classes consume `var(--bg)`, `var(--surface)`, etc., so
 * recoloring is a 6-line change.
 */
export const VARIANTS: Variant[] = [
  {
    id: 'original',
    label: 'Original',
  },
  {
    id: 'artful-grid',
    label: 'Try an artful grid layout',
    layout: { view: 'bento' },
  },
  {
    id: 'compact-layout',
    label: 'Try a more compact layout',
    layout: { view: 'grid', cols: 4 },
    cssVars: {
      // Tighter gap and slightly smaller items for a denser archive feel.
      '--gallery-gap': '4px',
    },
  },
  {
    id: 'stack-into-list',
    label: 'Stack into a single list',
    layout: { view: 'list' },
  },
];
