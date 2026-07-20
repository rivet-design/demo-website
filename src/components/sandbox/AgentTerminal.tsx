import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useInView } from '@/hooks/use-in-view';
import { useIcon } from '@/lib/icon-context';
import type { IconName } from '@/lib/icon-context';
import {
  ThinkingSteps,
  ThinkingStepsContent,
  ThinkingStep,
  ThinkingStepDetails,
} from '@/components/ui/thinking-steps';
import { ChatMessage } from '@/components/ui/chat-message';
import type { ResponseBlock, Turn } from './terminalScript';
import { SESSION } from './terminalScript';
import { useTerminalPlayer, type CommittedTurn } from './useTerminalPlayer';

/**
 * Agent window for the /sandbox route — "Thinking-steps forward" variant.
 *
 * Restyles the scripted agent session as a desktop CODING-AGENT UI (à la Claude
 * Code), not a terminal. It KEEPS the playback engine (useTerminalPlayer +
 * terminalScript) and the props API untouched, and leans hard on Fluid
 * Functionalism's ThinkingSteps to present each turn's reasoning + tool calls as
 * a connected, collapsible step list — the active step shimmering while it
 * streams, completed steps settling beneath it with a continuous connector
 * line. Assistant prose renders as a ChatMessage bubble; the user's command as
 * a soft accent bubble; the pinned composer mirrors InputMessage's chrome with
 * a "Type / for commands" placeholder and a slim model bar below.
 *
 * Visual direction: a calm, sans-serif desktop window on a soft light surface —
 * window chrome (traffic lights + project name + folder icon) up top, a roomy
 * conversation in the middle, a composer + model bar pinned to the bottom.
 */

// ─── Block → step classification ────────────────────────────────────────────
// A turn's response is a flat list of blocks. For the step list we group the
// leading run of reasoning/tool blocks (thinking + tool) into ONE ThinkingSteps
// group, and render text / diff / result blocks as their own conversation rows.
// `result` becomes a trailing success step appended to the same group so the
// reasoning reads top-to-bottom as one connected thread.

type StepEntry =
  | { kind: 'thinking'; text: string }
  | { kind: 'tool'; tool: string; arg: string; result?: string }
  | { kind: 'result'; text: string };

const isStepBlock = (b: ResponseBlock) =>
  b.kind === 'thinking' || b.kind === 'tool' || b.kind === 'result';

// Map a tool name to a lucide icon for its step row. Falls back to a generic
// glyph for anything unrecognised so new script tools still render sensibly.
const TOOL_ICON: Record<string, IconName> = {
  // The updated Rivet MCP contract exposes exactly three tools.
  rivet_design_context: 'pipette',
  rivet_variants: 'rocket',
  rivet_status: 'check',
};

const Folder = ({ size = 14 }: { size?: number }) => {
  const Icon = useIcon('square-library');
  return <Icon size={size} strokeWidth={1.75} />;
};

// One connected step list for a turn's reasoning/tool/result run. The active
// step (the most-recently-revealed one while the turn is still streaming)
// shimmers; earlier ones are complete. Tool args/results tuck into a collapsible
// details disclosure so the row stays scannable.
const StepGroup = ({
  entries,
  turnDone,
}: {
  // Only the already-revealed step entries for this group.
  entries: StepEntry[];
  turnDone: boolean;
}) => {
  const visible = entries;
  // The active step is the last revealed one, but only while the turn is still
  // streaming — once done, every step reads as complete.
  const activeIndex = turnDone ? -1 : visible.length - 1;

  return (
    <ThinkingSteps defaultOpen className="w-full max-w-full">
      <ThinkingStepsContent className="gap-0">
        {visible.map((e, i) => {
          const isLast = i === visible.length - 1;
          const status = i === activeIndex ? 'active' : 'complete';

          if (e.kind === 'thinking') {
            return (
              <ThinkingStep
                key={i}
                index={i}
                isLast={isLast}
                status={status}
                showIcon={false}
                label={e.text}
              />
            );
          }

          if (e.kind === 'result') {
            return (
              <ThinkingStep
                key={i}
                index={i}
                isLast={isLast}
                status={status}
                icon="check"
                label={e.text}
              />
            );
          }

          // tool
          return (
            <ThinkingStep
              key={i}
              index={i}
              isLast={isLast}
              status={status}
              icon={TOOL_ICON[e.tool] ?? 'dot'}
              label={e.tool}
              description={e.result}
            >
              <ThinkingStepDetails summary="View call" details={[e.arg]} />
            </ThinkingStep>
          );
        })}
      </ThinkingStepsContent>
    </ThinkingSteps>
  );
};

// Highlight a leading slash-command (e.g. `/rivet`) in Rivet orange so the
// command reads as a recognised action. Works progressively: while the draft is
// still being typed (`/riv`), the partial token is already coloured. Everything
// after the first whitespace is normal-weight body text.
const RIVET_ORANGE = '#E14017';
const renderCommand = (text: string): ReactNode => {
  const match = /^(\/\S*)([\s\S]*)$/.exec(text);
  if (!match) return text;
  return (
    <>
      <span className="font-medium" style={{ color: RIVET_ORANGE }}>
        {match[1]}
      </span>
      {match[2]}
    </>
  );
};

// Fake the feel of tokens streaming back from an agent: split the reply into
// words and cascade them in with a quick fade + de-blur, so prose materialises
// smoothly left-to-right instead of popping in as one block. The stagger is
// tuned fast (~22ms/word) so a sentence lands in well under a second.
const STREAM_CONTAINER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.022 } },
};
const STREAM_WORD = {
  hidden: { opacity: 0, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.18, ease: 'easeOut' as const },
  },
};
const StreamingText = ({ text }: { text: string }) => {
  const words = text.split(' ');
  return (
    <motion.span variants={STREAM_CONTAINER} initial="hidden" animate="visible">
      {words.map((w, idx) => (
        <motion.span key={idx} variants={STREAM_WORD}>
          {w}
          {idx < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </motion.span>
  );
};

// A compact code-diff card — sans-serif chrome, monospace body, soft borders.
const DiffCard = ({
  block,
}: {
  block: Extract<ResponseBlock, { kind: 'diff' }>;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, ease: 'easeOut' }}
    className="w-full overflow-hidden rounded-xl border border-border bg-background"
  >
    <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2 text-[12px]">
      <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
        <span className="shrink-0 text-foreground/70">
          <Folder size={13} />
        </span>
        <span className="truncate font-medium text-foreground">{block.file}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2 font-mono tabular-nums">
        <span className="text-emerald-600">+{block.added}</span>
        <span className="text-rose-500">−{block.removed}</span>
      </span>
    </div>
    <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[12px] leading-[1.6]">
      {block.lines.map((l, i) => {
        const isAdd = l.sign === '+';
        const isDel = l.sign === '-';
        return (
          <div
            key={i}
            className={cn(
              '-mx-3 flex px-3',
              isAdd && 'bg-emerald-500/[0.08] text-emerald-700',
              isDel && 'bg-rose-500/[0.08] text-rose-600',
              !isAdd && !isDel && 'text-muted-foreground',
            )}
          >
            <span className="select-none pr-3 opacity-60">
              {l.sign === ' ' ? ' ' : l.sign}
            </span>
            <span>{l.text}</span>
          </div>
        );
      })}
    </pre>
  </motion.div>
);

// Renders one committed turn: the user's command bubble, then the response as a
// stream of conversation rows (step groups, assistant bubbles, diffs).
const TurnView = ({ turn }: { turn: CommittedTurn }) => {
  const revealed = turn.blocks.slice(0, turn.revealed);

  // Walk the revealed blocks, batching contiguous step-blocks (thinking / tool /
  // result) into a single connected ThinkingSteps group, and emitting text /
  // diff blocks as their own rows. Each emitted node carries enough info to know
  // how many of its steps are currently revealed.
  const rows: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < revealed.length) {
    const block = revealed[i];

    if (isStepBlock(block)) {
      const entries: StepEntry[] = [];
      while (i < revealed.length && isStepBlock(revealed[i])) {
        const b = revealed[i];
        if (b.kind === 'thinking') entries.push({ kind: 'thinking', text: b.text });
        else if (b.kind === 'result') entries.push({ kind: 'result', text: b.text });
        else if (b.kind === 'tool')
          entries.push({ kind: 'tool', tool: b.tool, arg: b.arg, result: b.result });
        i++;
      }
      // This group's tail is "live" only if it's the last revealed block of an
      // unfinished turn.
      const groupEnd = i; // exclusive
      const groupIsTail = groupEnd === revealed.length;
      rows.push(
        <StepGroup
          key={key++}
          entries={entries}
          turnDone={turn.done || !groupIsTail}
        />,
      );
      continue;
    }

    if (block.kind === 'text') {
      rows.push(
        <ChatMessage key={key++} from="assistant" className="max-w-full">
          <StreamingText text={block.text} />
        </ChatMessage>,
      );
      i++;
      continue;
    }

    if (block.kind === 'diff') {
      rows.push(<DiffCard key={key++} block={block} />);
      i++;
      continue;
    }

    i++;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* User command — a soft accent bubble, right-aligned like a sent message. */}
      <div className="flex justify-end">
        <motion.div
          layout="position"
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-[14px] leading-[1.5] text-accent-foreground"
        >
          {renderCommand(turn.command)}
        </motion.div>
      </div>
      {/* Assistant response stream */}
      {rows.length > 0 && <div className="flex flex-col gap-3">{rows}</div>}
    </div>
  );
};

const AgentTerminal = ({
  script = SESSION,
  loop = true,
  compact = false,
  typeMs,
  className,
  onComplete,
}: {
  script?: Turn[];
  loop?: boolean;
  /** Smaller padding / type for the floating hero chat. */
  compact?: boolean;
  /** Per-character typing speed (ms) for commands; omit for the default. */
  typeMs?: number;
  className?: string;
  /** Fires once when the whole script has finished (all blocks revealed). */
  onComplete?: () => void;
} = {}) => {
  // Pause the scripted playback while the window is scrolled out of view so it
  // isn't re-rendering (and running its smooth-scroll catch-up) on every frame
  // while the user is reading elsewhere on the page.
  const { ref: rootRef, inView } = useInView<HTMLDivElement>();
  const { history, draft, thinking } = useTerminalPlayer(script, {
    loop,
    paused: !inView,
    typeMs,
  });

  // Fire onComplete once the last turn's last block has streamed in.
  const lastTurn = history[history.length - 1];
  const allDone = history.length === script.length && !!lastTurn?.done;
  const completedRef = useRef(false);
  useEffect(() => {
    if (allDone && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [allDone, onComplete]);

  // Keep the latest streamed output in view as rows reveal.
  const scrollRef = useRef<HTMLDivElement>(null);
  const revealed = history.reduce((n, t) => n + t.revealed, 0);
  useEffect(() => {
    if (!inView) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [history.length, revealed, draft, thinking, inView]);

  const SendIcon = useIcon('arrow-up');
  const PlusIcon = useIcon('plus');

  return (
    <div
      ref={rootRef}
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-border bg-[hsl(0_0%_98.5%)] font-sans text-foreground shadow-[0_24px_60px_-28px_rgba(20,20,22,0.45)]',
        // Non-compact fills its container (AgentTerminalSection wraps it in a
        // fixed 16/11 box so all three workflow panels match in size); the hero
        // passes its own sizing via className while compact.
        compact ? 'text-[12.5px]' : 'h-full w-full text-[13.5px]',
        className,
      )}
    >
      {/* Window chrome — desktop traffic lights + project name + folder. */}
      <div
        className={cn(
          'flex shrink-0 items-center gap-2 border-b border-border bg-background/80 backdrop-blur',
          compact ? 'px-3 py-2' : 'px-4 py-2.5',
        )}
      >
        <span className="flex items-center gap-1.5">
          <span className={cn('rounded-full bg-[#ff5f57]', compact ? 'h-2 w-2' : 'h-3 w-3')} />
          <span className={cn('rounded-full bg-[#febc2e]', compact ? 'h-2 w-2' : 'h-3 w-3')} />
          <span className={cn('rounded-full bg-[#28c840]', compact ? 'h-2 w-2' : 'h-3 w-3')} />
        </span>
        <span className="ml-2 flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <Folder size={compact ? 12 : 14} />
          <span
            className={cn(
              'truncate font-medium tracking-[-0.01em] text-foreground',
              compact ? 'text-[11px]' : 'text-[13px]',
            )}
          >
            Jersey customizer textures
          </span>
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className={cn(compact ? 'text-[9.5px]' : 'text-[11px]')}>rivet mcp</span>
        </span>
      </div>

      {/* Conversation transcript — the only scrolling region. */}
      <div
        ref={scrollRef}
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-y-auto',
          compact ? 'gap-4 p-3.5' : 'gap-6 p-5',
        )}
      >
        {history.map((turn, idx) => (
          <TurnView key={idx} turn={turn} />
        ))}

        {thinking && (
          <div className="flex items-center gap-2 px-1 text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/70" />
            <span className="shimmer-text text-[13px] font-medium">Working</span>
          </div>
        )}
      </div>

      {/* Composer — mirrors InputMessage chrome; the scripted draft is typed into
          it (then committed above as a user bubble). Read-only by design: the
          playback engine owns the text, so this is a faithful visual, not a live
          textarea. */}
      <div
        className={cn(
          'shrink-0 border-t border-border bg-background/80',
          compact ? 'px-2.5 pb-2 pt-2' : 'px-4 pb-3 pt-3',
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-2 rounded-2xl border border-border bg-background shadow-[0_1px_2px_-1px_rgba(20,20,22,0.12)]',
            compact ? 'px-3 py-2' : 'px-3.5 py-2.5',
          )}
        >
          <div className="flex min-h-[1.4em] items-start gap-1">
            <span
              className={cn('min-w-0 flex-1 leading-[1.5]', draft ? 'text-foreground' : 'text-muted-foreground')}
            >
              {draft ? renderCommand(draft) : 'Type / for commands'}
              <span
                className="ml-px inline-block h-[1.05em] w-[2px] translate-y-[0.18em] rounded-full bg-foreground/70"
                style={{ animation: 'rivet-caret-blink 1.05s steps(1, end) infinite' }}
                aria-hidden
              />
            </span>
          </div>
          {!compact && (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                tabIndex={-1}
                aria-hidden
                className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[12px] text-muted-foreground"
              >
                <PlusIcon size={13} strokeWidth={2} />
                Add context
              </button>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background"
                aria-hidden
              >
                <SendIcon size={16} strokeWidth={2.25} />
              </span>
            </div>
          )}
        </div>

        {/* Slim model bar under the composer. */}
        <div
          className={cn(
            'flex items-center justify-between px-1 pt-1.5 text-muted-foreground',
            compact ? 'text-[9.5px]' : 'text-[11px]',
          )}
        >
          <span>Accept edits ⌥⏎</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
            Fable 5
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgentTerminal;
