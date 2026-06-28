import { useEffect, useRef, useState } from 'react';

/**
 * Scripted drag-to-comment timeline for the "Explore with precision" demo.
 *
 * A stepped-timeout phase machine (same shape as the terminal player in
 * `sandbox/useTerminalPlayer.ts`) that fakes a user dragging a selection box
 * over the gallery and leaving the comment "try more fluid layouts". It owns
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
  | 'varying' // cursor clicks "Vary" — in-button generating state
  | 'generating' // popover closed, marker placed, directions generating
  | 'done';

// Geometry (DESIGN px). The selection covers the gallery's CONTENT section —
// the works grid — not the whole window: it spans from just inside the content
// area (right of the 220px sidebar, below the 52px topbar) to the bottom-right.
// The drag runs BOTTOM-RIGHT → TOP-LEFT, so it's released at the top-left and
// the comment popover renders there (opening below the pin). The bottom edge is
// derived from the live design height (which tracks the pane aspect).
const INSET = 16;
const TOPBAR = 52; // gallery topbar height
const SIDEBAR = 220; // gallery sidebar width

// Timeline (ms). GEN_OFFSET is the time from `start` to the moment the comment
// resolves into directions (the panel slides in) — after the cursor has dragged,
// the popover has been read, and "Vary" has been clicked and shown generating.
const CURSOR_MS = 650;
const DRAG_MS = 800;
const POPOVER_DWELL_MS = 1400;
const VARY_MS = 1500;
export const GEN_OFFSET = CURSOR_MS + DRAG_MS + POPOVER_DWELL_MS + VARY_MS;

export type ScriptedCommentState = {
  phase: ScriptPhase;
  cursor: { x: number; y: number };
  cursorVisible: boolean;
  /** True while the cursor is pressing the Vary button (click feedback). */
  cursorPressed: boolean;
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
  onDraftOpen,
  onSubmit,
}: {
  /** Whether the scripted intro should play (false → jump straight to resolved). */
  enabled: boolean;
  /** Flips true when the panel scrolls into view; starts the timeline. */
  start: boolean;
  /** Live design-box height so the selection spans the full (dynamic) gallery. */
  designH?: number;
  /** Fired once when the popover opens (telemetry: draft created). */
  onDraftOpen?: () => void;
  /** Fired once at submit (telemetry: comment created). */
  onSubmit?: () => void;
}): ScriptedCommentState => {
  const [phase, setPhase] = useState<ScriptPhase>(enabled ? 'idle' : 'generating');
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
    at(CURSOR_MS + DRAG_MS + POPOVER_DWELL_MS, () => setPhase('varying'));
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

  // The selection box = the gallery's content section (right of the sidebar,
  // below the topbar), with the bottom tracking the live design height so it
  // always covers the full works grid.
  const box = {
    left: SIDEBAR + INSET,
    top: TOPBAR + INSET,
    width: SCRIPT_DESIGN_W - SIDEBAR - INSET * 2,
    height: Math.max(0, designH - TOPBAR - INSET * 2),
  };
  // Drag runs bottom-right → top-left, so the box grows out of the bottom-right
  // corner and is released at the top-left.
  const dragStart = { x: box.left + box.width, y: box.top + box.height };
  const dragEnd = { x: box.left, y: box.top };
  // Release point (popover + marker anchor) at the box's TOP-LEFT corner — y near
  // the top (< 0.6 of height) so the popover opens BELOW the pin, top-left.
  const popoverAt = dragEnd;
  // The popover opens below the pin; its "Vary" button sits in the footer below
  // the pin, in the right-hand button group. Approximate the button center so
  // the cursor can move to it for the click.
  const varyAt = { x: popoverAt.x + 25, y: popoverAt.y + 132 };
  // Cursor fades in up-and-left of the start corner, then eases onto it.
  const entry = { x: dragStart.x - 70, y: dragStart.y - 50 };

  // Cursor target by phase: enters near the start corner, presses there, drags
  // to the opposite corner, then moves to the Vary button.
  const cursor =
    phase === 'idle'
      ? entry
      : phase === 'cursorIn'
        ? dragStart
        : phase === 'varying'
          ? varyAt
          : dragEnd;

  const dragStarted =
    phase === 'dragging' ||
    phase === 'popover' ||
    phase === 'varying' ||
    phase === 'generating' ||
    phase === 'done';

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
        phase === 'varying'),
    cursorPressed: phase === 'varying',
    box: dragStarted ? box : null,
    boxOrigin: dragStart,
    growBox: phase === 'dragging',
    showPopover: phase === 'popover' || phase === 'varying',
    varying: phase === 'varying',
    showMarker: phase === 'generating' || phase === 'done',
    popoverAt,
  };
};
