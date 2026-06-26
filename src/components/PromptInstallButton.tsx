// Single "Add the Rivet MCP" button. On click it opens a popover menu with one
// row per coding agent (logo + title). Cursor installs via a one-click deep
// link (cursor://anysphere.cursor-deeplink/...). Claude Code, the Claude
// desktop app, and Codex have no install URL scheme, so they copy a paste-ready
// prompt the user drops into the agent (which then runs `npx rivet-design
// install <agent>`). Replaces the older split button (main "Add to <tool>"
// action + chevron dropdown).
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

// Cursor's hosted MCP deep link. The base64 `config` decodes to
// {"command":"npx","args":["-y","rivet-design@latest","mcp","--editor","cursor"]}
const CURSOR_DEEPLINK =
  'cursor://anysphere.cursor-deeplink/mcp/install?name=rivet&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsInJpdmV0LWRlc2lnbkBsYXRlc3QiLCJtY3AiLCItLWVkaXRvciIsImN1cnNvciJdfQ==';

type AgentItem =
  | { id: string; label: string; logo: AgentLogo; action: 'deeplink'; url: string }
  | { id: string; label: string; logo: AgentLogo; action: 'copy'; prompt: string };

// Menu rows, in display order. Cursor = one-click deep link; the rest copy a
// paste-ready install prompt (no URL scheme exists for them).
const AGENT_ITEMS: AgentItem[] = [
  {
    id: 'claude',
    label: 'Claude',
    logo: 'claude',
    action: 'copy',
    prompt:
      'Please install the Rivet MCP server for Claude Code and the Claude desktop app by running: npx rivet-design install claude && npx rivet-design install claude-desktop',
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
      'Please install the Rivet MCP server for Codex by running: npx rivet-design install codex',
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
      window.location.href = item.url;
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
        <span className="whitespace-nowrap">Add the Rivet MCP</span>
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
