/**
 * The Rivet mark, as its three rigid pieces.
 *
 * A and B are the two ribbons that together form the chevron; C is the
 * diamond. They're split because the brand's motion work animates them as
 * separate bodies — see rivet-brand/animations/logo-motion.html, where the
 * chevron and the diamond travel to different poses on their own springs.
 *
 * Coordinates are the source artboard's, so CX/CY is the composition's centre
 * and the natural pivot for any rotation.
 */
export const MARK_PATH_A =
  'M185.2 16.9245C175.855 7.57953 160.704 7.57951 151.359 16.9245L26.718 141.565C17.3731 150.91 17.373 166.061 26.718 175.406L72.1177 220.806C81.4627 230.151 96.614 230.151 105.959 220.806L240.262 86.5033C244.27 82.4946 244.27 75.9951 240.262 71.9863L185.2 16.9245Z';

export const MARK_PATH_B =
  'M309.829 175.413C319.174 166.068 319.174 150.917 309.829 141.572L185.189 16.931C175.844 7.586 160.692 7.58599 151.348 16.931L88.7259 79.5526L230.287 221.114C239.632 230.459 254.783 230.459 264.128 221.114L309.829 175.413Z';

export const MARK_PATH_C =
  'M167.545 197.004L112.734 251.815C104.671 259.878 104.671 272.949 112.734 281.012L152.425 320.703C160.487 328.765 173.559 328.765 181.621 320.703L221.834 280.49C229.897 272.428 229.897 259.356 221.834 251.293L167.545 197.004Z';

/** The artboard the paths are drawn in. */
export const MARK_VIEWBOX = '0 0 336 337';
