import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { measurePageGrid } from '../lib/pageGrid';

/**
 * The column-grid overlay: the page's own layout grid, drawn on top of it, so
 * the columns a block is sitting on can be checked against the ones it is
 * supposed to be sitting on. Toggle with the corner button or ⌘/Ctrl-G; `[`
 * and `]` change the column count live.
 *
 * Ported from the grid on jean-portfolio, and it keeps that one's rule: the
 * bars are painted at whatever the page frame ACTUALLY reports (see
 * lib/pageGrid), never at a replica of the layout's numbers in a parallel
 * stylesheet — a replica sat a few px off and the error compounded across the
 * columns.
 */

/** How long the exit takes: the bars slide out before they leave the DOM. */
const EXIT_MS = 520;
/** Per-bar stagger, so the columns arrive as a sweep rather than all at once. */
const STAGGER_MS = 26;
const MIN_COLS = 2;
const MAX_COLS = 24;

type Bar = {
  kind: 'col' | 'mar';
  left: number;
  width: number;
  /** The offset it flies in from. Columns alternate up/down across the page;
   *  the margins come in from the edge each one marks. */
  fromX: string;
  fromY: string;
  delay: number;
};

type Props = {
  /** Starting column count. `[` and `]` change it live. */
  defaultColumns?: number;
};

/**
 * Internal only. This is a tool for checking the layout against its own grid
 * while the page is being drawn, not part of the page — so it is gated here,
 * at the component, rather than at the call site: a second `<GridOverlay />`
 * added later inherits the gate instead of quietly shipping the button.
 * Vite folds `import.meta.env.DEV` to `false` in a build, so the whole
 * component tree-shakes out of production rather than merely rendering null.
 */
const GridOverlay = ({ defaultColumns = 12 }: Props) => {
  const [columns, setColumns] = useState(defaultColumns);
  // `on` is the intent; `mounted` and `entered` are the two steps the exit
  // needs — drop `entered` so the bars can slide out, and only then unmount.
  const [on, setOn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [bars, setBars] = useState<Bar[]>([]);
  const [buttonLeft, setButtonLeft] = useState<number | null>(null);
  const exitTimer = useRef<number | undefined>(undefined);

  const measure = useCallback(() => {
    const grid = measurePageGrid(columns);
    if (!grid) return;
    // The bars are fixed, so frame coordinates have to be shifted into the
    // viewport by the frame's own left.
    const { rect, pad, columnWidth, lines } = grid;
    setButtonLeft(rect.left + pad);

    const next: Bar[] = [];
    const push = (bar: Omit<Bar, 'delay'>) =>
      next.push({ ...bar, delay: next.length * STAGGER_MS });

    // lines[] carries one entry per column plus the field's right edge; the
    // bars are the columns, so the trailing edge is not one of them.
    for (let i = 0; i < columns; i += 1) {
      push({
        kind: 'col',
        left: rect.left + lines[i],
        width: columnWidth,
        fromX: '0',
        fromY: i % 2 ? '112%' : '-112%',
      });
    }
    if (pad > 0.5) {
      push({ kind: 'mar', left: rect.left, width: pad, fromX: '-140%', fromY: '0' });
      push({ kind: 'mar', left: rect.right - pad, width: pad, fromX: '140%', fromY: '0' });
    }
    setBars(next);
  }, [columns]);

  // Before paint, so the first frame the bars animate from is already the
  // right geometry. Re-runs when the count changes (via `measure`'s identity).
  useLayoutEffect(measure, [measure, mounted]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    window.clearTimeout(exitTimer.current);
    if (on) {
      setMounted(true);
      return;
    }
    setEntered(false);
    exitTimer.current = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(exitTimer.current);
  }, [on]);

  // Flip `entered` on the NEXT frame — same frame would collapse the
  // transition into no transition at all.
  useEffect(() => {
    if (!on || !mounted || bars.length === 0) return;
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [on, mounted, bars.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'g' || e.key === 'G') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOn((v) => !v);
        return;
      }
      // Bare brackets, so they can't fire while something is being typed.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.isContentEditable) return;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === '[') setColumns((n) => Math.max(MIN_COLS, n - 1));
      if (e.key === ']') setColumns((n) => Math.min(MAX_COLS, n + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  return (
    <>
      {mounted && (
        <div aria-hidden className={`grid-overlay${entered ? ' is-in' : ''}`}>
          {bars.map((bar, i) => (
            <span
              key={`${bar.kind}-${i}`}
              className={`grid-overlay__bar grid-overlay__bar--${bar.kind}`}
              style={
                {
                  left: `${bar.left}px`,
                  width: `${bar.width}px`,
                  '--gx': bar.fromX,
                  '--gy': bar.fromY,
                  '--gd': `${bar.delay}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
      <button
        type="button"
        aria-pressed={on}
        onClick={() => setOn((v) => !v)}
        title="Toggle the column grid (⌘G). [ and ] change the column count."
        className="grid-overlay__btn"
        style={buttonLeft != null ? { left: `${buttonLeft}px` } : undefined}
      >
        {`grid ${columns}`}
      </button>
    </>
  );
};

export default import.meta.env.DEV ? GridOverlay : () => null;
