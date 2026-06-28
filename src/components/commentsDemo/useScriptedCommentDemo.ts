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
  | 'submitting' // Apply pressed
  | 'generating' // popover closed, marker placed, directions generating
  | 'done';

// Geometry (DESIGN px). The gallery renders a ~220px sidebar at this width, so
// the box sits over a 2×2 cluster of items in the content area to its right.
const ENTRY = { x: 250, y: 340 };
const DRAG_START = { x: 300, y: 150 };
const DRAG_END = { x: 624, y: 432 };
const BOX = { left: 300, top: 150, width: 324, height: 282 };
// Popover/marker anchor near the box's lower edge. y/H = 0.83 (> 0.6) so the
// popover flips ABOVE the pin and stays clear of the box.
const POPOVER_AT = { x: 470, y: 430 };

// Timeline (ms). SUBMIT_OFFSET is the total time from `start` to the moment the
// comment is submitted — the shell uses it to align the directions controller's
// generation gate to the same clock.
const CURSOR_MS = 650;
const DRAG_MS = 800;
const POPOVER_DWELL_MS = 1700;
const SUBMIT_MS = 300;
export const SUBMIT_OFFSET =
  CURSOR_MS + DRAG_MS + POPOVER_DWELL_MS + SUBMIT_MS;

export type ScriptedCommentState = {
  phase: ScriptPhase;
  cursor: { x: number; y: number };
  cursorVisible: boolean;
  /** Full selection box (present from `dragging` onward), or null before. */
  box: { left: number; top: number; width: number; height: number } | null;
  /** True only during the grow animation so the overlay animates from collapsed. */
  growBox: boolean;
  showPopover: boolean;
  showMarker: boolean;
  popoverAt: { x: number; y: number };
};

export const useScriptedCommentDemo = ({
  enabled,
  start,
  onDraftOpen,
  onSubmit,
}: {
  /** Whether the scripted intro should play (false → jump straight to resolved). */
  enabled: boolean;
  /** Flips true when the panel scrolls into view; starts the timeline. */
  start: boolean;
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
    at(CURSOR_MS + DRAG_MS + POPOVER_DWELL_MS, () => setPhase('submitting'));
    at(SUBMIT_OFFSET, () => {
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

  // Cursor target by phase. Springs to it in the overlay.
  const cursor =
    phase === 'idle' || phase === 'cursorIn'
      ? phase === 'idle'
        ? ENTRY
        : DRAG_START
      : DRAG_END;

  const dragStarted =
    phase === 'dragging' ||
    phase === 'popover' ||
    phase === 'submitting' ||
    phase === 'generating' ||
    phase === 'done';

  return {
    phase,
    cursor,
    cursorVisible: enabled && phase !== 'idle' && phase !== 'done',
    box: dragStarted ? BOX : null,
    growBox: phase === 'dragging',
    showPopover: phase === 'popover' || phase === 'submitting',
    showMarker: phase === 'generating' || phase === 'done',
    popoverAt: POPOVER_AT,
  };
};
