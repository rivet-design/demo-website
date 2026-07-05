import { useEffect, useRef, useState } from 'react';

/**
 * Scripted drag-to-comment timeline for the "Explore with precision" demo.
 *
 * A stepped-timeout phase machine (same shape as the terminal player in
 * `sandbox/useTerminalPlayer.ts`) that fakes a user dragging a selection box
 * over the gallery and leaving the comment "Try simpler layouts". It owns
 * NO variant state — when the script reaches `generating` the shell mounts the
 * real directions controller, which runs its own skeleton→resolved loading.
 *
 * All geometry is in the gallery's fixed DESIGN-space px (see SCRIPT_DESIGN_*),
 * so the overlay can live inside the same scaled box as the gallery and the
 * coordinates need no manual scaling.
 */

// Fixed design box the gallery + overlay are authored against, then scaled to
// fit the (narrower, since the copy sits beside it) left pane. Smaller than the
// standalone variants section (900) so the scaled-down gallery stays legible.
export const SCRIPT_DESIGN_W = 760;
export const SCRIPT_DESIGN_H = 520;

export type ScriptPhase =
  | 'idle' // before scroll-into-view
  | 'cursorIn' // cursor eases to the drag start
  | 'dragging' // selection box grows start → end
  | 'popover' // popover open, request shown
  | 'reachVary' // cursor travels from the pin to the "Vary" button
  | 'clickVary' // cursor presses "Vary" (click pulse) — not yet loading
  | 'varying' // in-button generating state, after the click
  | 'generating' // popover closed, marker placed, directions generating
  | 'done';

// Geometry (DESIGN px). The selection covers the gallery's full CONTENT segment
// — flush against the sidebar on the left, out to the gallery's right edge, and
// from the "All Works" header down to the bottom — so the drag grabs the whole
// works area, not an inset slice. The drag runs BOTTOM-RIGHT → TOP-LEFT, released
// at the top-left where the comment popover opens (below the pin). The bottom
// edge tracks the live design height (which tracks the pane aspect).
// TOPBAR / SIDEBAR mirror the gallery's `.app` grid (gallery.css: 52px row,
// 180px column) so the box lines up exactly with the rendered chrome.
const TOPBAR = 52; // gallery topbar height (.app grid row)
const SIDEBAR = 180; // gallery sidebar width (.app grid column)

// Timeline (ms). GEN_OFFSET is the time from `start` to the moment the comment
// resolves into directions (the panel slides in) — after the cursor has dragged,
// the popover has been read, and "Vary" has been reached, clicked, and shown
// generating. The vary interaction is three distinct beats so the click reads
// as causing the loading: the cursor travels to the button (REACH), presses it
// (CLICK), and only then does the in-button loader run (LOADING).
const CURSOR_MS = 650;
const DRAG_MS = 800;
const POPOVER_DWELL_MS = 1400;
const REACH_VARY_MS = 600; // cursor springs from the pin onto the button
const CLICK_VARY_MS = 280; // press pulse before anything loads
// Dwell on the Vary button's loading state before the options generate — kept a
// touch long so the "generating" beat reads clearly between click and result.
const LOADING_MS = 1900;
export const GEN_OFFSET =
  CURSOR_MS +
  DRAG_MS +
  POPOVER_DWELL_MS +
  REACH_VARY_MS +
  CLICK_VARY_MS +
  LOADING_MS;

export type ScriptedCommentState = {
  phase: ScriptPhase;
  cursor: { x: number; y: number };
  cursorVisible: boolean;
  /** True while the cursor is pressing the Vary button (click feedback). */
  cursorPressed: boolean;
  /** True while the cursor is hovering the Vary button — overlay shows the hand. */
  overButton: boolean;
  /** Full selection box (present from `dragging` onward), or null before. */
  box: { left: number; top: number; width: number; height: number } | null;
  /** Corner the drag starts from — the box grows out of this point. */
  boxOrigin: { x: number; y: number };
  /** True only during the grow animation so the overlay animates from collapsed. */
  growBox: boolean;
  showPopover: boolean;
  /** Drives the popover's "Vary" button into its generating state. */
  varying: boolean;
  showMarker: boolean;
  popoverAt: { x: number; y: number };
};

export const useScriptedCommentDemo = ({
  enabled,
  start,
  designH = SCRIPT_DESIGN_H,
  contentLeft = SIDEBAR,
  onDraftOpen,
  onSubmit,
}: {
  /** Whether the scripted intro should play (false → jump straight to resolved). */
  enabled: boolean;
  /** Flips true when the panel scrolls into view; starts the timeline. */
  start: boolean;
  /** Live design-box height so the selection spans the full (dynamic) gallery. */
  designH?: number;
  /** Left edge of the gallery content area; mobile compact layout has no sidebar. */
  contentLeft?: number;
  /** Fired once when the popover opens (telemetry: draft created). */
  onDraftOpen?: () => void;
  /** Fired once at submit (telemetry: comment created). */
  onSubmit?: () => void;
}): ScriptedCommentState => {
  const [phase, setPhase] = useState<ScriptPhase>(
    enabled ? 'idle' : 'generating',
  );
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const firedRef = useRef({ draft: false, submit: false });

  useEffect(() => {
    if (!enabled || !start) return;
    const timers = timersRef.current;
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    setPhase('cursorIn');
    at(CURSOR_MS, () => setPhase('dragging'));
    at(CURSOR_MS + DRAG_MS, () => {
      setPhase('popover');
      if (!firedRef.current.draft) {
        firedRef.current.draft = true;
        onDraftOpen?.();
      }
    });
    const reachAt = CURSOR_MS + DRAG_MS + POPOVER_DWELL_MS;
    at(reachAt, () => setPhase('reachVary'));
    at(reachAt + REACH_VARY_MS, () => setPhase('clickVary'));
    at(reachAt + REACH_VARY_MS + CLICK_VARY_MS, () => setPhase('varying'));
    at(GEN_OFFSET, () => {
      setPhase('generating');
      if (!firedRef.current.submit) {
        firedRef.current.submit = true;
        onSubmit?.();
      }
    });

    return () => {
      timers.forEach(clearTimeout);
      timersRef.current = [];
    };
    // onDraftOpen/onSubmit are stable callbacks from the shell; intentionally
    // not deps so the timeline isn't rebuilt mid-run.
  }, [enabled, start]);

  // The selection box spans the entire content segment: flush against the
  // sidebar (left), out to the gallery's right edge (full width), and from the
  // "All Works" header down to the bottom. Bottom tracks the live design height.
  const CONTENT_TOP = TOPBAR + 12; // top edge sits at the "All Works" header text
  const box = {
    left: contentLeft,
    top: CONTENT_TOP,
    width: SCRIPT_DESIGN_W - contentLeft,
    height: Math.max(0, designH - CONTENT_TOP),
  };
  // Drag runs bottom-right → top-left, released at the top-left. The grab corner
  // is pulled a little inside the box's bottom-right so the cursor glyph stays
  // within the panel (the box itself still grows out to the true corner).
  const GRAB_INSET = 22;
  const dragStart = {
    x: box.left + box.width - GRAB_INSET,
    y: box.top + box.height - GRAB_INSET,
  };
  const dragEnd = { x: box.left, y: box.top };
  // Release point (popover + marker anchor) at the box's TOP-LEFT corner — y near
  // the top (< 0.6 of height) so the popover opens BELOW the pin, top-left.
  const popoverAt = dragEnd;
  // The popover opens below the pin; its "Vary" pill sits in the action bar's
  // right-hand cluster, left of the circular send button. This targets the pill
  // so the open-hand cursor's palm (its center, ~11×13px into the 24px glyph)
  // lands on it — the offset is the pill center minus that palm offset.
  // Geometry (chat-composer popover): top = pin.y + 14 offset; pill center sits
  // ~84px below the popover top (16 pad + 44 one-line textarea + 8 gap + half
  // the 32px action row) and ~65px right of the pin (popover left = pin.x −
  // 160, clamped to 20; right cluster hugs the card's right padding edge).
  const varyAt = { x: popoverAt.x + 54, y: popoverAt.y + 85 };
  // Cursor fades in up-and-left of the start corner, then eases onto it.
  const entry = { x: dragStart.x - 70, y: dragStart.y - 50 };

  // Cursor target by phase: enters near the start corner, presses there, drags
  // to the opposite corner, then travels to the Vary button and stays there
  // through the click and the loading.
  const atVaryButton =
    phase === 'reachVary' || phase === 'clickVary' || phase === 'varying';
  const cursor =
    phase === 'idle'
      ? entry
      : phase === 'cursorIn'
        ? dragStart
        : atVaryButton
          ? varyAt
          : dragEnd;

  // The dashed selection box only renders while the comment is being authored —
  // the drag, the open popover, and the vary interaction. Once the comment is
  // applied (generating onward) the marker stands in for it, so the box is gone.
  const selectionVisible =
    phase === 'dragging' ||
    phase === 'popover' ||
    phase === 'reachVary' ||
    phase === 'clickVary' ||
    phase === 'varying';

  return {
    phase,
    cursor,
    // The cursor is only "present" while it's doing the work — it leaves once
    // the comment is applied (generating onward), so it doesn't hover over the
    // generating directions.
    cursorVisible:
      enabled &&
      (phase === 'cursorIn' ||
        phase === 'dragging' ||
        phase === 'popover' ||
        atVaryButton),
    // Press pulse fires only on the dedicated click beat — after the cursor has
    // reached the button and before the loader starts.
    cursorPressed: phase === 'clickVary',
    overButton: atVaryButton,
    box: selectionVisible ? box : null,
    boxOrigin: dragStart,
    growBox: phase === 'dragging',
    showPopover:
      phase === 'popover' ||
      phase === 'reachVary' ||
      phase === 'clickVary' ||
      phase === 'varying',
    varying: phase === 'varying',
    showMarker: phase === 'generating' || phase === 'done',
    popoverAt,
  };
};
