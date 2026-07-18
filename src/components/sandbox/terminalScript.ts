// Scripted content for the agent-terminal prototype.
//
// A session is an ordered list of turns. Each turn is a user command that gets
// "typed" into the input, followed by the agent's streamed response made of
// typed blocks: plain assistant text, tool calls, diffs, and a result.
// The renderer (useTerminalPlayer) walks this script with timers so the whole
// thing plays back like a live agent session — no backend involved.
//
// The tool rows are the REAL Rivet MCP tools, in the order a coding agent drives
// them for a source-grounded run: `fetch_pinterest` reads the user's board (pins
// + palettes via their connected account), `capture_design_evidence` renders the
// references and pulls out design tokens/type/screenshot, and `start_variants`
// (mode "existing", with the board passed as `userContext`) turns that captured
// context into N parallel directions in isolated worktrees + the visual editor.
// Then `continue_variants` (action `refine_variant`) forks a chosen direction
// with a follow-up instruction, and `commit_variant` + `get_pending_changes`
// apply the winner's diff. The story: pull real visual taste from a Pinterest
// board, explore directions grounded in it, then refine and commit one.

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
        tool: 'capture_design_evidence',
        arg: 'snapshot the current jersey app',
        result: 'palette · display type · layout → DESIGN.md',
      },
      {
        kind: 'tool',
        tool: 'start_variants',
        arg: 'mode: "existing", briefs × 6',
        result: '6 worktrees · editor → :4000',
      },
      {
        kind: 'tool',
        tool: 'report_variant_complete',
        arg: '6 × status: "succeeded"',
        result: 'Skeuomorphic · Liquid Glass · Halftone · …',
      },
      { kind: 'result', text: '6 texture directions ready — cycle them in the preview.' },
    ],
  },
];

// Turn 1 EXPLORES directions grounded in the user's Pinterest board; turn 2
// REFINES the chosen one and commits it. Every tool row is a real Rivet MCP
// call with arguments/results shaped like the live ones.
export const SESSION: Turn[] = [
  {
    command: 'Restyle my jersey app — refs: pinterest.com/maya/football-kits',
    response: [
      { kind: 'thinking', text: 'Reading your Pinterest board…' },
      {
        kind: 'tool',
        tool: 'fetch_pinterest',
        arg: 'pinterest.com/maya/football-kits',
        result: '42 pins · retro, neon, halftone',
      },
      {
        kind: 'tool',
        tool: 'capture_design_evidence',
        arg: 'synthesize a design system',
        result: 'palette · type · motifs → DESIGN.md',
      },
      {
        kind: 'tool',
        tool: 'start_variants',
        arg: 'mode: "existing", briefs × 4',
        result: '4 worktrees · editor → :4001',
      },
      { kind: 'result', text: '4 directions ready — cycle them in the preview.' },
    ],
  },
  {
    command: 'refine "Halftone" — punchier dots, team colors',
    response: [
      { kind: 'thinking', text: 'Forking the “Halftone” direction…' },
      {
        kind: 'tool',
        tool: 'continue_variants',
        arg: 'action: "refine_variant", variantId: "Halftone"',
        result: 'regenerating',
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
        tool: 'commit_variant',
        arg: 'variantId: "Halftone"',
        result: 'applied to working tree',
      },
      { kind: 'result', text: 'Committed “Halftone”.' },
    ],
  },
];
