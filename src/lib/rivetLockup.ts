// The two canonical marks, used together — never morphed or cropped into
// one another. RIVET_ICON_SRC (128x128 viewBox) is the bare mark;
// RIVET_TEXT_SRC (333x105 viewBox) is "rivet" alone, starting cleanly at
// the left edge of the "r" with no icon baked in.
export const RIVET_ICON_SRC = '/images/rivet-icon-mark.svg';
export const RIVET_TEXT_SRC = '/images/rivet-wordmark-text.svg';

// Shared proportions, all expressed as fractions of the icon's own rendered
// size — used by both the splash screen and the real hero lockup so a FLIP
// transition between them scales every sub-element (icon, gap, text) in
// lockstep instead of just matching the overall bounding box. Text and icon
// sit at EQUAL height (the canonical 105:128 read as an oversized icon next
// to the wordmark); the hero lockup in App.tsx sizes both to the same box,
// so this ratio has to be 1 or the splash's landing ghosts against it.
export const RIVET_TEXT_NATIVE_ASPECT = 333 / 105;
export const RIVET_TEXT_TO_ICON_HEIGHT = 1;
export const RIVET_LOCKUP_GAP_RATIO = 0.12;
