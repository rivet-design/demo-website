// Single "Add Rivet to your agent" button. On click it opens a popover menu
// with one row per coding agent (logo + title). Claude Code and Codex copy a
// paste-ready prompt the user drops into the agent, which then runs `npx -y
// rivet-design@latest install <agent>` — rivet core's CLI-first install
// (skill / rules file + command allowlist per harness). Cursor is a one-click
// deep link straight into Cursor's add-MCP-server dialog: since rivet core
// registers `mcp serve` via a cache-independent `npx rivet-design@latest`
// invocation, a static deeplink config is durable again (the older deeplink
// died with the tombstoned per-tool `rivet mcp --editor` server).
import { useState } from 'react';
import { toast } from 'sonner';
import { posthog } from '@/lib/posthog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';

type AgentLogo = 'claude' | 'cursor' | 'codex';

const TOOL_LOGOS: Record<AgentLogo, string> = {
  claude: '/images/claude.svg',
  cursor: '/images/cursor.svg',
  codex: '/images/codex.svg',
};

// Logo rendered from public/ image files. `invert` flips it white (for dark
// button tones); otherwise it stays black (for the light tone).
const ToolLogo = ({
  id,
  label,
  invert = true,
}: {
  id: AgentLogo;
  label: string;
  invert?: boolean;
}) => (
  <img
    src={TOOL_LOGOS[id]}
    alt={label}
    width={16}
    height={16}
    className={`shrink-0 brightness-0 ${invert ? 'invert' : ''}`}
  />
);

// Cursor's deep link into its add-MCP-server dialog. The base64 `config`
// decodes to
//   {"command":"npx","args":["-y","rivet-design@latest","mcp","serve","--caller-agent","cursor"]}
// — the same cache-independent invocation `rivet install` registers, so the
// entry keeps working across npx cache prunes and rivet updates. The
// cursor:// protocol URL triggers the OS handler directly; the older
// cursor.com/install-mcp web handoff silently dead-ended for signed-out
// visitors.
const CURSOR_DEEPLINK =
  'cursor://anysphere.cursor-deeplink/mcp/install?name=rivet&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsInJpdmV0LWRlc2lnbkBsYXRlc3QiLCJtY3AiLCJzZXJ2ZSIsIi0tY2FsbGVyLWFnZW50IiwiY3Vyc29yIl19';

type AgentItem =
  | { id: string; label: string; logo: AgentLogo; action: 'deeplink'; url: string }
  | { id: string; label: string; logo: AgentLogo; action: 'copy'; prompt: string };

// Menu rows, in display order. Cursor = one-click deep link; the rest copy a
// paste-ready install prompt (no install URL scheme exists for them). The
// commands mirror rivet core's harness registry ids (`install claude` /
// `codex`). Claude Desktop is retired as an install target in rivet core, so
// the Claude row covers Claude Code only.
const AGENT_ITEMS: AgentItem[] = [
  {
    id: 'claude',
    label: 'Claude',
    logo: 'claude',
    action: 'copy',
    prompt:
      'Please set up Rivet for Claude Code by running: npx -y rivet-design@latest install claude',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    logo: 'cursor',
    action: 'deeplink',
    url: CURSOR_DEEPLINK,
  },
  {
    id: 'codex',
    label: 'Codex',
    logo: 'codex',
    action: 'copy',
    prompt:
      'Please set up Rivet for Codex by running: npx -y rivet-design@latest install codex',
  },
];

type Tone = 'orange' | 'dark' | 'light';

const TONES: Record<
  Tone,
  { bg: string; border: string; text: string; invertLogo: boolean; ring: string }
> = {
  orange: {
    bg: 'bg-primary hover:bg-primary-hover',
    border: 'border-primary/20',
    text: 'text-white',
    invertLogo: true,
    // Ring color around each icon so it reads as a distinct chip.
    ring: 'ring-primary',
  },
  dark: {
    bg: 'bg-accent-foreground hover:bg-[hsl(0_0%_20%)]',
    border: 'border-white/15',
    text: 'text-white',
    invertLogo: true,
    ring: 'ring-accent-foreground',
  },
  light: {
    bg: 'bg-white hover:bg-white/80',
    border: 'border-black/10',
    text: 'text-accent-foreground',
    invertLogo: false,
    ring: 'ring-white',
  },
};

type PromptInstallButtonProps = {
  tone?: Tone;
  size?: 'md' | 'lg';
  fullWidth?: boolean;
};

const PromptInstallButton = ({
  tone = 'orange',
  size = 'md',
  fullWidth = false,
}: PromptInstallButtonProps) => {
  const [open, setOpen] = useState(false);
  // Keyboard highlight within the menu (-1 = no row highlighted).
  const [highlight, setHighlight] = useState(-1);

  const t = TONES[tone];

  const mainSize = size === 'lg' ? 'px-6 py-4 text-lg' : 'px-4 py-3 text-sm';
  const iconBox = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  const activate = (item: AgentItem) => {
    posthog.capture('download_clicked', {
      source: 'landing',
      download_type: item.id,
    });

    if (item.action === 'deeplink') {
      // Custom-protocol URLs must navigate in place: browsers block them in
      // new tabs, and the OS "Open Cursor?" dialog appears without leaving
      // the page. The toast covers the no-handler case (Cursor not
      // installed).
      window.location.href = item.url;
      toast.success('Opening Cursor…', {
        description: 'Accept the prompt to add the Rivet MCP server.',
      });
    } else {
      navigator.clipboard.writeText(item.prompt).then(() => {
        toast.success('Prompt copied to clipboard', {
          description: `Paste into ${item.label} to get started.`,
          action: {
            label: 'Learn more',
            onClick: () =>
              window.open('https://docs.rivet.design/mcp-guide', '_blank'),
          },
        });
      });
    }
    setOpen(false);
  };

  // Arrow keys move the highlight; Enter activates; Escape closes. Shared by the
  // trigger and the menu so keyboard users can drive the whole thing.
  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((i) => (i + 1) % AGENT_ITEMS.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((i) => (i - 1 + AGENT_ITEMS.length) % AGENT_ITEMS.length);
    } else if (e.key === 'Enter') {
      if (highlight >= 0) {
        e.preventDefault();
        activate(AGENT_ITEMS[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Popover
      className={fullWidth ? 'flex w-full' : undefined}
      open={open}
      onOpenChange={(next) => {
        setHighlight(-1);
        setOpen(next);
      }}
    >
      {/* The trigger keeps the original look: label + fanned agent icons that
          lift on hover. Clicking opens the menu rather than copying. */}
      <PopoverTrigger
        onKeyDown={handleMenuKeyDown}
        className={`group type-label-lg font-normal flex items-center gap-2.5 rounded-lg border ${t.border} ${t.bg} ${t.text} ${mainSize} ${
          fullWidth ? 'w-full justify-center' : 'w-fit'
        } transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
      >
        <span className="whitespace-nowrap">Add Rivet to your agent</span>
        {/* Already-fanned icon row. At rest each icon is fully visible with a
            clear gap. On hover/focus the gap widens and each icon lifts up with
            a soft drop shadow. `motion-reduce` keeps the icons static. */}
        <span
          className="flex shrink-0 items-center gap-1 transition-[gap] duration-200 ease-out group-hover:gap-1.5 group-focus-within:gap-1.5 motion-reduce:!gap-1 motion-reduce:transition-none"
          aria-hidden
        >
          {(['claude', 'cursor', 'codex'] as AgentLogo[]).map((logo) => (
            <span
              key={logo}
              className={`relative flex ${iconBox} items-center justify-center rounded-full ${t.bg} ring-2 ${t.ring} transition-[transform,box-shadow] duration-200 ease-out will-change-transform group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-within:-translate-y-0.5 group-focus-within:shadow-md motion-reduce:!translate-y-0 motion-reduce:!shadow-none motion-reduce:transition-none`}
            >
              <ToolLogo id={logo} label={logo} invert={t.invertLogo} />
            </span>
          ))}
        </span>
      </PopoverTrigger>

      {/* Dropdown menu — one row per agent, on the dark menu surface. */}
      <PopoverContent
        align={fullWidth ? 'center' : 'start'}
        sideOffset={6}
        className="min-w-[16rem] py-1"
        onKeyDown={handleMenuKeyDown}
      >
        {AGENT_ITEMS.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => activate(item)}
            onMouseEnter={() => setHighlight(i)}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white transition-colors hover:bg-[hsl(0_0%_25%)] focus:outline-none ${
              i === highlight ? 'bg-[hsl(0_0%_22%)]' : ''
            }`}
          >
            <ToolLogo id={item.logo} label={item.label} />
            <span className="flex-1 font-main">{item.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default PromptInstallButton;
