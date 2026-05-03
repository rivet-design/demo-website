/**
 * A variant for the gallery target. CSS custom-property overrides cascade
 * through the existing `var(--…)` references in gallery.css, so visual
 * directions can be expressed as a small map of variable values rather than
 * per-element style overrides.
 */
export type Variant = {
  id: string;
  /** Imperative chip label, e.g. "Switch to a brighter palette". */
  label: string;
  /** CSS custom properties applied to the `.rivet-gallery` wrapper. */
  cssVars?: Record<string, string>;
  /** Optional layout overrides driven by the variant. */
  layout?: {
    view?: 'grid' | 'list' | 'bento';
    cols?: 2 | 3 | 4;
  };
};
