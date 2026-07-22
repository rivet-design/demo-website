// Single "Add Rivet to your agent" button. On click it opens a popover menu
// with one row per coding agent (logo + title). Every row copies a
// paste-ready prompt the user drops into the agent, which then runs `npx -y
// rivet-design@latest install <agent>` — rivet core's CLI-first install
// (skill / rules file + command allowlist per harness; Cursor adds `--mcp`
// to also register the MCP server in ~/.cursor/mcp.json). The install's
// global bootstrap makes everything durable: it installs the CLI globally
// and re-executes from there, so registrations never point into the
// ephemeral npx cache. This replaced the Cursor deep link, whose npx-based
// registration re-resolved `@latest` on every launch and ran the loopback
// auth flow inside a disposable process.
import { useState } from 'react';
import { toast } from 'sonner';
import { posthog } from '@/lib/posthog';
import {
  AGENT_LOGOS as TOOL_LOGOS,
  INSTALL_COMMANDS,
  type InstallAgentId as AgentLogo,
} from '@/lib/install';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';

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

type AgentItem = {
  id: string;
  label: string;
  logo: AgentLogo;
  prompt: string;
};

// Menu rows, in display order. Each copies a paste-ready install prompt; the
// commands mirror rivet core's harness registry ids (`install claude` /
// `cursor` / `codex`). Users rarely know which Claude surface they're on, so
// the Claude row names both explicitly — the command itself shows what gets
// set up (Claude Code + Claude Desktop chat MCP).
const AGENT_ITEMS: AgentItem[] = [
  {
    id: 'claude',
    label: 'Claude',
    logo: 'claude',
    prompt: `Please set up Rivet for Claude Code and Claude Desktop by running: ${INSTALL_COMMANDS.claude}`,
  },
  {
    id: 'cursor',
    label: 'Cursor',
    logo: 'cursor',
    prompt: `Please set up Rivet for Cursor by running: ${INSTALL_COMMANDS.cursor}`,
  },
  {
    id: 'codex',
    label: 'Codex',
    logo: 'codex',
    prompt: `Please set up Rivet for Codex by running: ${INSTALL_COMMANDS.codex}`,
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
  label?: string;
};

const PromptInstallButton = ({
  tone = 'orange',
  size = 'md',
  fullWidth = false,
  label = 'Add Rivet to your agent',
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

    navigator.clipboard.writeText(item.prompt).then(() => {
      toast.success('Prompt copied to clipboard', {
        description: `Paste into ${item.label} to install the Rivet MCP.`,
      });
    });
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
        {/* Already-fanned icon row, leading the label. At rest each icon is
            fully visible with a clear gap. On hover/focus the gap widens and
            each icon lifts up with a soft drop shadow. `motion-reduce` keeps
            the icons static. */}
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
        <span className="whitespace-nowrap">{label}</span>
      </PopoverTrigger>

      {/* Dropdown menu — one row per agent, on the dark menu surface. */}
      {/* The menu matches the trigger's width exactly, so the dropdown reads
          as an extension of the button it opens from. */}
      <PopoverContent
        align={fullWidth ? 'center' : 'start'}
        sideOffset={6}
        matchTriggerWidth
        className="py-1"
        onKeyDown={handleMenuKeyDown}
      >
        {AGENT_ITEMS.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => activate(item)}
            onMouseEnter={() => setHighlight(i)}
            className={`group flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white transition-colors hover:bg-[hsl(0_0%_25%)] focus:outline-none ${
              i === highlight ? 'bg-[hsl(0_0%_22%)]' : ''
            }`}
          >
            {/* Same lift as the trigger's fanned icons: the logo rises with a
                soft shadow while the row is hovered or keyboard-highlighted.
                drop-shadow (not box-shadow) so it hugs the logo shape. */}
            <span
              className={`flex shrink-0 transition-[transform,filter] duration-200 ease-out will-change-transform group-hover:-translate-y-0.5 group-hover:drop-shadow-md motion-reduce:!translate-y-0 motion-reduce:!drop-shadow-none motion-reduce:transition-none ${
                i === highlight ? '-translate-y-0.5 drop-shadow-md' : ''
              }`}
            >
              <ToolLogo id={item.logo} label={item.label} />
            </span>
            <span className="flex-1 font-main">{item.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default PromptInstallButton;
