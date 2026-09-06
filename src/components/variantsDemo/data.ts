// Rivet variant metadata for the self-contained variants demo.
//
// Recursive/self-referential: each variant reimagines THIS landing page's
// own hero in a different visual direction (the "Landing Directions" run) —
// Rivet, used on itself. Each variant's static page is hosted under
// public/demos/landing/<slug>.html and rendered in an <iframe>.

export type DemoVariant = {
  /** The Rivet variantId from the manifest. */
  id: string;
  /** Display label (manifest `label`). */
  label: string;
  /**
   * One-line direction description (manifest `brief`). Kept to roughly 30
   * characters — the Directions panel is a narrow column, and anything longer
   * wrapped to three lines and pushed the folders below it off-screen.
   */
  brief: string;
  /** URL of the hosted static page for this variant. */
  src: string;
  /** Run label retained as a fallback folder name for older demo data. */
  tag: string;
  /** Folder label used by the current Rivet directions-panel grouping. */
  folder?: string;
  /**
   * Optional in-app gallery restyle config. Unused by the hero (which renders
   * `src` in an iframe) and ignored by DirectionsPanel; the comments demo uses
   * it to restyle its live <Gallery> when a direction is selected, so the SAME
   * variant drives both the directions list and the left-hand preview.
   */
  gallery?: {
    cssVars?: Record<string, string>;
    layout?: { view?: 'grid' | 'list' | 'bento'; cols?: 2 | 3 | 4 };
  };
};

/** Shared run label (manifest `runLabel`) shown as the chip on each direction. */
export const RUN_LABEL = 'Landing Directions';

/** The 1984 Macintosh System — the one genuinely off-the-wall direction. */
export const MACINTOSH_SYSTEM_ID = '00368aee-9194-4bdd-be73-00f40704dbf2';

/** Cyanotype drafting sheet: same composition, drawn instead of designed. */
export const BLUEPRINT_DRAFT_ID = '5b1c0f7e-92a4-4c31-9f66-2c8ad4e10b73';

/**
 * The three directions that are THIS app, re-rendered with a different
 * treatment. They load the real site in the preview iframe rather than a
 * static export, so what you see is genuinely the running page — `embed=1`
 * tells that copy to skip the pinned hero sequence, which is what stops it
 * recursing into another prototype container inside itself.
 */
export const ORIGINAL_ID = 'original';
export const WITH_SPLASH_ID = 'with-splash';
export const LEFT_ALIGNED_ID = 'left-aligned';

/** The prompt that produced the run (manifest `sessionPrompt`). */
export const SESSION_PROMPT =
  "Reimagine this landing page's hero across every visual direction as a Rivet variant.";

export const VARIANTS: DemoVariant[] = [
  {
    id: ORIGINAL_ID,
    label: 'Original',
    brief: 'Exactly as it ships today.',
    src: '/?embed=1&variant=original',
    tag: 'Baseline',
    folder: 'Layout changes',
  },
  {
    id: WITH_SPLASH_ID,
    label: 'With splash',
    brief: 'Splash screen, then the hero.',
    src: '/?embed=1&variant=with-splash',
    tag: 'Baseline',
    folder: 'Layout changes',
  },
  {
    id: LEFT_ALIGNED_ID,
    label: 'Left aligned',
    brief: 'Lockup and copy set flush left.',
    src: '/?embed=1&variant=left-aligned',
    tag: 'Baseline',
    folder: 'Layout changes',
  },
  {
    id: MACINTOSH_SYSTEM_ID,
    label: 'Macintosh System',
    brief: '1984 Mac chrome and bitmap type.',
    src: '/demos/landing/macintosh-system.html',
    tag: 'Random direction',
    folder: 'Rough explorations',
  },
  {
    id: BLUEPRINT_DRAFT_ID,
    label: 'Blueprint Draft',
    brief: 'Cyanotype sheet, drafting marks.',
    src: '/demos/landing/blueprint-draft.html',
    tag: 'Random direction',
    folder: 'Rough explorations',
  },
];

/**
 * The subset that is safe to render INSIDE an embed. Three of the directions
 * are this app itself (`/?embed=1&...`), so showing the full list inside an
 * embedded copy would load the app inside the app inside the app — the `start`
 * flag can't prevent it, because the showcase renders an iframe for any src
 * that has been selected, including the initial one. Filtering the
 * self-referencing srcs out makes the recursion structurally impossible rather
 * than merely deferred. Module-level so the reference stays stable.
 */
export const EMBED_SAFE_VARIANTS: DemoVariant[] = VARIANTS.filter(
  (v) => !v.src.startsWith('/?'),
);

/**
 * Mobile drops the left-aligned direction from the auto-shuffle: it is a
 * two-column layout, and a 32/57 split inside a portrait panel is unreadable.
 * Module-level so the reference stays stable (see useVariantsDemo's `variants`).
 */
export const MOBILE_VARIANTS: DemoVariant[] = VARIANTS.filter(
  (v) => v.id !== LEFT_ALIGNED_ID,
);
