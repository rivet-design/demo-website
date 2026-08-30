// The two canonical marks, used together — never morphed or cropped into
// one another. RIVET_ICON_SRC (128x128 viewBox) is the bare mark;
// RIVET_TEXT_SRC (333x105 viewBox) is "rivet" alone, starting cleanly at
// the left edge of the "r" with no icon baked in.
export const RIVET_ICON_SRC = '/images/rivet-icon-mark.svg';
export const RIVET_TEXT_SRC = '/images/rivet-wordmark-text.svg';

// Shared proportions, all expressed as fractions of the icon's own rendered
// size — used by both the splash screen and the real hero lockup so a FLIP
// transition between them scales every sub-element (icon, gap, text) in
// lockstep instead of just matching the overall bounding box. Native height
// ratio 105:128 matches the Figma lockup's own 127.7:104.4 row proportions.
export const RIVET_TEXT_NATIVE_ASPECT = 333 / 105;
export const RIVET_TEXT_TO_ICON_HEIGHT = 105 / 128;
export const RIVET_LOCKUP_GAP_RATIO = 0.12;
