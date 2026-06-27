import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { ResponseBlock, Turn } from './terminalScript';
import { SESSION } from './terminalScript';
import { useTerminalPlayer, type CommittedTurn } from './useTerminalPlayer';

/**
 * Agent-terminal prototype for the /sandbox route — "Warm paper light" variant.
 *
 * Plays a scripted session: sample commands type into the prompt, then the
 * agent's response streams back block-by-block (thinking, tool calls, a diff,
 * and a result). Styling is deliberately self-contained here so Rivet can fork
 * it into stylistic variants without touching the playback engine.
 *
 * Visual direction: a calm LIGHT terminal on warm paper. Dark ink typography on
 * a cream surface, soft tan borders, muted sage-green and clay/terracotta
 * accents for tool calls and diffs. Gentle opacity fades instead of glow — a
 * refined, editorial light theme. No dark background anywhere.
 */

// Palette — kept as inline constants so the cream/ink/sage/clay system reads in
// one place and stays consistent across every block.
const INK = '#3a342b'; // primary dark-ink text
const INK_SOFT = '#6f675a'; // muted ink for secondary text
const INK_FAINT = '#9a9082'; // faintest ink (signs, meta)
const CREAM = '#f5f0e6'; // main paper surface
const CREAM_HI = '#faf6ee'; // lighter paper (title bar / cards)
const TAN = '#e3d8c4'; // soft tan border
const TAN_SOFT = '#ece3d3'; // softer tan (inner dividers)
const SAGE = '#5f7a52'; // muted sage-green accent
const CLAY = '#a8604a'; // muted clay / terracotta accent

// Blinking orange cursor — draws the eye to the prompt as the text types in.
const Caret = () => (
  <span
    className="ml-0.5 inline-block h-[1.05em] w-[0.55ch] translate-y-[0.16em] rounded-[1px]"
    style={{
      backgroundColor: '#E14017',
      animation: 'rivet-caret-blink 1.05s steps(1, end) infinite',
    }}
  />
);

const Spinner = () => (
  <span
    className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-[1.5px]"
    style={{ borderColor: TAN, borderTopColor: SAGE }}
  />
);

// Mounts hidden, then flips to visible on the next frame so the fade/slide-in
// plays the moment a block is first rendered. Only revealed blocks are mounted
// (see Turn), so nothing occupies layout height before it appears — which lets
// the transcript's scroll-to-bottom anchor on freshly revealed content rather
// than an invisible tail of not-yet-shown blocks.
const Reveal = ({ children }: { children: ReactNode }) => {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className={`transition-all duration-500 ease-out ${
        shown
          ? 'translate-y-0 opacity-100 blur-0'
          : 'translate-y-1.5 opacity-0 blur-[1px]'
      }`}
    >
      {children}
    </div>
  );
};

const Block = ({ block }: { block: ResponseBlock }) => {
  switch (block.kind) {
    case 'thinking':
      return (
        <div className={`flex items-center gap-2.5`} style={{ color: INK_FAINT }}>
          <Spinner />
          <span className="italic tracking-[0.01em]">{block.text}</span>
        </div>
      );

    case 'text':
      return (
        <div className={`max-w-[64ch] leading-[1.7]`} style={{ color: INK }}>
          {block.text}
        </div>
      );

    case 'tool':
      // Claude Code's signature tool-call shape: `⏺ tool(args)` with the
      // result hanging beneath on a `⎿` connector line.
      return (
        <div className={`flex flex-col gap-1`}>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="translate-y-[1px] text-[11px] leading-none" style={{ color: SAGE }} aria-hidden>
              ⏺
            </span>
            <span className="font-semibold tracking-[0.01em]" style={{ color: INK }}>
              {block.tool}
            </span>
            <span style={{ color: INK_SOFT }}>({block.arg})</span>
          </div>
          {block.result && (
            <div className="flex items-baseline gap-2 pl-[3px]" style={{ color: INK_FAINT }}>
              <span aria-hidden style={{ color: TAN }}>
                ⎿
              </span>
              <span>{block.result}</span>
            </div>
          )}
        </div>
      );

    case 'diff':
      return (
        <div
          className={`overflow-hidden rounded-lg border`}
          style={{ borderColor: TAN, backgroundColor: CREAM_HI }}
        >
          <div
            className="flex items-center justify-between border-b px-3.5 py-2 text-[12px]"
            style={{ borderColor: TAN_SOFT, color: INK_SOFT }}
          >
            <span className="flex items-center gap-1.5">
              <span aria-hidden style={{ color: INK_FAINT }}>
                ◇
              </span>
              <span style={{ color: INK }}>{block.file}</span>
            </span>
            <span className="flex items-center gap-2 tabular-nums">
              <span style={{ color: SAGE }}>+{block.added}</span>
              <span style={{ color: CLAY }}>−{block.removed}</span>
            </span>
          </div>
          <pre className="overflow-x-auto px-3.5 py-2.5 text-[12.5px] leading-[1.6]">
            {block.lines.map((l, i) => {
              const isAdd = l.sign === '+';
              const isDel = l.sign === '-';
              return (
                <div
                  key={i}
                  className="-mx-3.5 flex px-3.5"
                  style={{
                    backgroundColor: isAdd
                      ? 'rgba(95,122,82,0.10)'
                      : isDel
                        ? 'rgba(168,96,74,0.10)'
                        : 'transparent',
                    color: isAdd ? SAGE : isDel ? CLAY : INK_SOFT,
                    boxShadow: isAdd
                      ? `inset 2px 0 0 ${SAGE}`
                      : isDel
                        ? `inset 2px 0 0 ${CLAY}`
                        : 'none',
                  }}
                >
                  <span
                    className="select-none pr-3"
                    style={{ color: isAdd || isDel ? 'inherit' : INK_FAINT, opacity: 0.7 }}
                  >
                    {l.sign === ' ' ? ' ' : l.sign}
                  </span>
                  <span>{l.text}</span>
                </div>
              );
            })}
          </pre>
        </div>
      );

    case 'result':
      return (
        <div
          className={`flex items-start gap-2.5 rounded-md border px-3.5 py-2`}
          style={{
            borderColor: 'rgba(95,122,82,0.35)',
            backgroundColor: 'rgba(95,122,82,0.08)',
            color: SAGE,
          }}
        >
          <span
            className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]"
            style={{ backgroundColor: SAGE, color: CREAM_HI }}
            aria-hidden
          >
            ✓
          </span>
          <span className="font-medium">{block.text}</span>
        </div>
      );
  }
};

// Render a typed command, highlighting any reference URL (e.g. a Pinterest
// board) so the user's own input — the taste they're bringing — stands out from
// the rest of the prompt.
const renderCommand = (command: string) => {
  // Pull off a leading slash-command (e.g. "/rivet") and render it in the brand
  // orange so it reads as a real Rivet command — highlights progressively as it
  // types in.
  const slash = command.match(/^\/\w[\w-]*/);
  const head = slash ? (
    <span className="font-semibold" style={{ color: '#E14017' }}>
      {slash[0]}
    </span>
  ) : null;
  const rest = slash ? command.slice(slash[0].length) : command;

  const m = rest.match(/(?:https?:\/\/)?(?:www\.)?pinterest\.com\/\S+/i);
  if (!m)
    return (
      <>
        {head}
        {rest}
      </>
    );
  const url = m[0];
  const at = rest.indexOf(url);
  return (
    <>
      {head}
      {rest.slice(0, at)}
      <span
        className="underline decoration-dotted underline-offset-2"
        style={{ color: CLAY }}
      >
        {url}
      </span>
      {rest.slice(at + url.length)}
    </>
  );
};

const Turn = ({ turn }: { turn: CommittedTurn }) => (
  <div className="flex flex-col gap-2.5">
    {/* The submitted command */}
    <div className="flex items-baseline gap-2.5">
      <span className="select-none font-semibold" style={{ color: CLAY }} aria-hidden>
        ❯
      </span>
      <span className="font-medium tracking-[0.01em]" style={{ color: INK }}>
        {renderCommand(turn.command)}
      </span>
    </div>
    {/* Streamed response */}
    <div
      className="ml-[0.4rem] flex flex-col gap-2.5 border-l pl-4"
      style={{ borderColor: TAN_SOFT }}
    >
      {turn.blocks.slice(0, turn.revealed).map((b, i) => (
        <Reveal key={i}>
          <Block block={b} />
        </Reveal>
      ))}
    </div>
  </div>
);

const AgentTerminal = ({
  script = SESSION,
  loop = true,
  compact = false,
  className,
}: {
  script?: Turn[];
  loop?: boolean;
  /** Smaller padding / type for the floating hero chat. */
  compact?: boolean;
  className?: string;
} = {}) => {
  const { history, draft, thinking, idle } = useTerminalPlayer(script, { loop });

  // Keep the latest streamed output in view as blocks reveal — without this the
  // fixed-height transcript would leave the diff / commit payoff below the fold.
  const scrollRef = useRef<HTMLDivElement>(null);
  const revealed = history.reduce((n, t) => n + t.revealed, 0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [history.length, revealed, draft, thinking, idle]);

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden border font-mono shadow-[0_18px_50px_-24px_rgba(58,52,43,0.45)]',
        compact
          ? 'rounded-xl text-[12.5px]'
          : 'mx-auto h-[60vh] min-h-[480px] w-full max-w-3xl rounded-2xl text-[13.5px]',
        className,
      )}
      style={{ borderColor: TAN, backgroundColor: CREAM }}
    >
      {/* Title bar */}
      <div
        className={cn(
          'flex shrink-0 items-center gap-2 border-b',
          compact ? 'px-3 py-2' : 'px-4 py-2.5',
        )}
        style={{ borderColor: TAN, backgroundColor: CREAM_HI }}
      >
        <span className={cn('rounded-full', compact ? 'h-2 w-2' : 'h-2.5 w-2.5')} style={{ backgroundColor: '#d98a6a' }} />
        <span className={cn('rounded-full', compact ? 'h-2 w-2' : 'h-2.5 w-2.5')} style={{ backgroundColor: '#d9b96a' }} />
        <span className={cn('rounded-full', compact ? 'h-2 w-2' : 'h-2.5 w-2.5')} style={{ backgroundColor: SAGE }} />
        <span className={cn('ml-2 font-semibold tracking-[0.02em]', compact ? 'text-[10.5px]' : 'text-[12px]')} style={{ color: INK }}>
          Claude Code
        </span>
        <span
          className={cn('ml-auto flex items-center gap-1.5', compact ? 'text-[9.5px]' : 'text-[11px]')}
          style={{ color: INK_FAINT }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SAGE }} />
          rivet mcp
        </span>
      </div>

      {/* Transcript — flexes to fill the window so the overall terminal height
          stays constant; only this region scrolls. */}
      <div
        ref={scrollRef}
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-y-auto leading-[1.65]',
          compact ? 'gap-4 p-3.5' : 'gap-6 p-6',
        )}
        style={{
          color: INK,
          backgroundImage:
            'radial-gradient(rgba(58,52,43,0.045) 0.5px, transparent 0.5px)',
          backgroundSize: '14px 14px',
        }}
      >
        {history.map((turn, i) => (
          <Turn key={i} turn={turn} />
        ))}

        {thinking && (
          <div
            className="ml-[0.4rem] flex items-center gap-2.5 border-l pl-4"
            style={{ borderColor: TAN_SOFT, color: INK_FAINT }}
          >
            <Spinner />
            <span className="italic">working…</span>
          </div>
        )}
      </div>

      {/* Persistent input box — user input is typed HERE (then committed into
          the transcript above as a ❯ line) rather than appearing inline in the
          scroll, mirroring a real Claude Code prompt pinned to the bottom. It
          grows within the fixed-height window (the transcript shrinks to match)
          so the terminal itself never changes height. */}
      <div
        className={cn('shrink-0 border-t', compact ? 'px-2.5 py-2' : 'px-3.5 py-3')}
        style={{ borderColor: TAN, backgroundColor: CREAM_HI }}
      >
        <div
          className={cn(
            'flex items-start gap-2.5 rounded-lg border',
            compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5',
          )}
          style={{ borderColor: TAN, backgroundColor: CREAM }}
        >
          <span
            className="select-none pt-[1px] font-semibold"
            style={{ color: CLAY }}
            aria-hidden
          >
            ❯
          </span>
          <div
            className="min-w-0 flex-1 font-medium leading-[1.6]"
            style={{ color: draft ? INK : INK_FAINT }}
          >
            {draft ? (
              renderCommand(draft)
            ) : (
              <span className="italic">Message Claude Code…</span>
            )}
            <Caret />
          </div>
          {!compact && (
            <span
              className="shrink-0 pt-[2px] text-[11px] tracking-[0.02em]"
              style={{ color: INK_FAINT }}
              aria-hidden
            >
              ⏎ send
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentTerminal;
