import { useEffect, useRef, useState } from 'react';
import type { ResponseBlock, Turn } from './terminalScript';

// Drives a scripted terminal session: types each command into the input one
// character at a time, "submits" it, then reveals the agent's response blocks
// one after another. Output blocks fade/slide in as whole units (the per-line
// typing happens only for the user command, which is where the eye is). When
// the script ends it pauses, clears, and loops so the sandbox always shows
// motion.
//
// Returns everything the view needs to render — it owns no styling, so any
// visual variant can consume the same state.

export type CommittedTurn = {
  command: string;
  // How many response blocks of this turn are currently visible.
  revealed: number;
  blocks: ResponseBlock[];
  done: boolean;
};

export type TerminalState = {
  /** Turns already submitted (with partial/complete responses). */
  history: CommittedTurn[];
  /** The command currently being typed into the prompt (may be partial). */
  draft: string;
  /** True while the agent is "working" (between submit and first block). */
  thinking: boolean;
  /** True when every turn has finished — used to show an idle prompt. */
  idle: boolean;
};

type Phase =
  | { t: 'typing'; turn: number; pos: number }
  | { t: 'submit'; turn: number }
  | { t: 'thinking'; turn: number }
  | { t: 'responding'; turn: number; block: number }
  | { t: 'turnPause'; turn: number }
  | { t: 'restart' };

const TYPE_MS = 42; // per-character typing speed for commands
const THINK_MS = 620; // pause showing the working indicator
const BLOCK_MS = 520; // gap between streamed response blocks
const TURN_GAP_MS = 1100; // pause between turns
const LOOP_GAP_MS = 2600; // pause before clearing + looping

export const useTerminalPlayer = (
  script: Turn[],
  { loop = true }: { loop?: boolean } = {},
): TerminalState => {
  const [history, setHistory] = useState<CommittedTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [phase, setPhase] = useState<Phase>({ t: 'typing', turn: 0, pos: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const clear = () => {
      if (timer.current) clearTimeout(timer.current);
    };
    const next = (p: Phase, ms: number) => {
      clear();
      timer.current = setTimeout(() => setPhase(p), ms);
    };

    switch (phase.t) {
      case 'typing': {
        const turn = script[phase.turn];
        if (!turn) {
          setPhase({ t: 'restart' });
          break;
        }
        if (phase.pos < turn.command.length) {
          setDraft(turn.command.slice(0, phase.pos + 1));
          next({ t: 'typing', turn: phase.turn, pos: phase.pos + 1 }, TYPE_MS);
        } else {
          next({ t: 'submit', turn: phase.turn }, 360);
        }
        break;
      }
      case 'submit': {
        const turn = script[phase.turn];
        setDraft('');
        setHistory((h) => [
          ...h,
          { command: turn.command, revealed: 0, blocks: turn.response, done: false },
        ]);
        next({ t: 'thinking', turn: phase.turn }, 30);
        break;
      }
      case 'thinking': {
        next({ t: 'responding', turn: phase.turn, block: 0 }, THINK_MS);
        break;
      }
      case 'responding': {
        const turn = script[phase.turn];
        const total = turn.response.length;
        setHistory((h) =>
          h.map((ct, i) =>
            i === h.length - 1 ? { ...ct, revealed: phase.block + 1 } : ct,
          ),
        );
        if (phase.block + 1 < total) {
          next({ t: 'responding', turn: phase.turn, block: phase.block + 1 }, BLOCK_MS);
        } else {
          setHistory((h) =>
            h.map((ct, i) => (i === h.length - 1 ? { ...ct, done: true } : ct)),
          );
          next({ t: 'turnPause', turn: phase.turn }, BLOCK_MS);
        }
        break;
      }
      case 'turnPause': {
        const nextTurn = phase.turn + 1;
        if (nextTurn < script.length) {
          next({ t: 'typing', turn: nextTurn, pos: 0 }, TURN_GAP_MS);
        } else {
          next({ t: 'restart' }, LOOP_GAP_MS);
        }
        break;
      }
      case 'restart': {
        if (!loop) break;
        setHistory([]);
        setDraft('');
        next({ t: 'typing', turn: 0, pos: 0 }, 400);
        break;
      }
    }

    return clear;
  }, [phase, script, loop]);

  const last = history[history.length - 1];
  const thinking = phase.t === 'thinking' || (phase.t === 'responding' && !!last && last.revealed === 0);
  const idle = phase.t === 'restart' || phase.t === 'turnPause';

  return { history, draft, thinking, idle };
};
