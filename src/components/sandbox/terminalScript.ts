// Scripted content for the agent-terminal prototype.
//
// A session is an ordered list of turns. Each turn is a user command that gets
// "typed" into the input, followed by the agent's streamed response made of
// typed blocks: plain assistant text, tool calls, diffs, and a result.
// The renderer (useTerminalPlayer) walks this script with timers so the whole
// thing plays back like a live agent session — no backend involved.
//
// The tool rows are the REAL Rivet MCP tools — the updated contract exposes
// exactly three: `rivet_design_context` (pass any URL; Pinterest/Are.na routes
// to the connected account's reference data, anything else is rendered live
// for visual evidence), `rivet_variants` (the variant lifecycle — action
// "start" explores N directions, "start" + `target` refines an existing one,
// "commit" writes the winner to the working tree), and `rivet_status`
// (read-only progress polling). The story: pull real visual taste from a
// Pinterest board, explore directions grounded in it, then refine and commit
// one.

export type ResponseBlock =
  | { kind: 'text'; text: string }
  | { kind: 'thinking'; text: string }
  | { kind: 'tool'; tool: string; arg: string; result?: string }
  | { kind: 'diff'; file: string; added: number; removed: number; lines: DiffLine[] }
  | { kind: 'result'; text: string };

export type DiffLine = { sign: '+' | '-' | ' '; text: string };

export type Turn = {
  /** The command the "user" types into the prompt. */
  command: string;
  /** The agent's streamed reply. */
  response: ResponseBlock[];
};

// Single-turn session for the hero interaction: the user asks for new textures,
// and the agent drives the real Rivet MCP tools to explore directions — captures
// the current app's design, starts a set of variants, and reports them ready.
export const HERO_SESSION: Turn[] = [
  {
    command: '/rivet try some new textures for my world cup jersey app',
    response: [
      { kind: 'thinking', text: 'Exploring new texture directions for your kit studio…' },
      {
        kind: 'tool',
        tool: 'rivet_design_context',
        arg: 'url: "localhost:3000", screenshot: true',
        result: 'screenshot · palette · display type · layout',
      },
      {
        kind: 'tool',
        tool: 'rivet_variants',
        arg: 'action: "start", runLabel: "Jersey textures", briefs × 4',
        result: '4 directions queued · editor → :4000',
      },
      {
        kind: 'tool',
        tool: 'rivet_status',
        arg: 'project: "jersey-app"',
        result: '4/4 succeeded — Macintosh · Skeuomorphic · …',
      },
      { kind: 'result', text: '4 texture directions ready — cycle them in the preview.' },
    ],
  },
];

// Turn 1 EXPLORES directions grounded in the user's Pinterest board; turn 2
// REFINES the chosen one and commits it. Every tool row is a real Rivet MCP
// call with arguments/results shaped like the live ones.
export const SESSION: Turn[] = [
  {
    command:
      'Try some different creative textures for my app — refs: pinterest.com/samjgorman/orange',
    response: [
      { kind: 'thinking', text: 'Reading your Pinterest board for visual direction…' },
      {
        kind: 'tool',
        tool: 'rivet_design_context',
        arg: 'url: "pinterest.com/samjgorman/orange"',
        result: '42 pins · retro print, neon, halftone palettes',
      },
      {
        kind: 'tool',
        tool: 'rivet_design_context',
        arg: 'url: "localhost:3000", screenshot: true',
        result: 'rendered evidence · palette · display type',
      },
      {
        kind: 'text',
        text: 'Pulled the recurring themes from your board — bold retro palettes, halftone print texture, and chunky display type — and grounded four directions in them.',
      },
      {
        kind: 'tool',
        tool: 'rivet_variants',
        arg: 'action: "start", runLabel: "Board looks", briefs × 4',
        result: '4 directions queued · editor → :4001',
      },
      {
        kind: 'tool',
        tool: 'rivet_status',
        arg: 'project: "jersey-app"',
        result: '4/4 succeeded — Retro print · Neon night · Halftone · Chrome foil',
      },
      { kind: 'result', text: '4 directions drawn from your board — cycle them in the preview.' },
    ],
  },
  {
    command: 'refine "Halftone" — punchier dots, use the team colors',
    response: [
      { kind: 'thinking', text: 'Forking the “Halftone” direction with your refinement…' },
      {
        kind: 'tool',
        tool: 'rivet_variants',
        arg: 'action: "start", target: "…:halftone", briefs × 1',
        result: 'vary queued — regenerating in worktree',
      },
      {
        kind: 'diff',
        file: 'src/components/KitCanvas.tsx',
        added: 2,
        removed: 2,
        lines: [
          { sign: ' ', text: '<pattern id="halftone" patternUnits="userSpaceOnUse"' },
          { sign: '-', text: '  width={8} height={8}>' },
          { sign: '+', text: '  width={5} height={5}>' },
          { sign: '-', text: '  <circle r={1.4} fill="#9aa3ad" />' },
          { sign: '+', text: '  <circle r={2.3} fill="var(--team-primary)" />' },
        ],
      },
      {
        kind: 'tool',
        tool: 'rivet_variants',
        arg: 'action: "commit", variantId: "halftone"',
        result: '1 file changed · applied to working tree',
      },
      { kind: 'result', text: 'Committed “Halftone” — drawn from your board and applied.' },
    ],
  },
];
