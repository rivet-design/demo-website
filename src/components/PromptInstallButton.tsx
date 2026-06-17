import { useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { posthog } from '@/lib/posthog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';

type InstallTool = 'claude' | 'cursor' | 'codex';

const TOOL_LOGOS: Record<InstallTool, string> = {
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
  id: InstallTool;
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

type ToolOption =
  | { id: InstallTool; label: string; action: 'copy'; command: string }
  | { id: InstallTool; label: string; action: 'deeplink'; url: string };

const TOOL_OPTIONS: ToolOption[] = [
  {
    id: 'claude',
    label: 'Claude',
    action: 'copy',
    command:
      'Please install the Rivet MCP server for Claude Code and the Claude desktop app by running: npx rivet-design install claude && npx rivet-design install claude-desktop',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    action: 'deeplink',
    url: 'cursor://anysphere.cursor-deeplink/mcp/install?name=rivet&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsInJpdmV0LWRlc2lnbkBsYXRlc3QiLCJtY3AiLCItLWVkaXRvciIsImN1cnNvciJdfQ==',
  },
  {
    id: 'codex',
    label: 'Codex',
    action: 'copy',
    command:
      'Please install the Rivet MCP server by running: npx rivet-design install codex',
  },
];

// Shared selection store so every PromptInstallButton on the page stays in
// sync: committing "Add to Codex" in one updates them all. Only the committed
// choice is global — per-instance UI (open popover, keyboard highlight, the
// copied checkmark) stays local.
let committedIndex = 0;
const listeners = new Set<() => void>();
const subscribeCommitted = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getCommittedIndex = () => committedIndex;
const commitIndex = (i: number) => {
  committedIndex = i;
  listeners.forEach((l) => l());
};

type Tone = 'orange' | 'dark' | 'light';

const TONES: Record<
  Tone,
  { bg: string; border: string; text: string; invertLogo: boolean }
> = {
  orange: {
    bg: 'bg-primary hover:bg-primary-hover',
    border: 'border-primary/20',
    text: 'text-white',
    invertLogo: true,
  },
  dark: {
    bg: 'bg-accent-foreground hover:bg-[hsl(0_0%_20%)]',
    border: 'border-white/15',
    text: 'text-white',
    invertLogo: true,
  },
  light: {
    bg: 'bg-white hover:bg-white/80',
    border: 'border-black/10',
    text: 'text-accent-foreground',
    invertLogo: false,
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
  const committedIdx = useSyncExternalStore(
    subscribeCommitted,
    getCommittedIndex,
  );

  const [selectedIndex, setSelectedIndex] = useState(committedIdx);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const committed = TOOL_OPTIONS[committedIdx];
  const t = TONES[tone];

  const padX = size === 'lg' ? 'px-6' : 'px-4';
  const mainSize = size === 'lg' ? 'px-6 py-4 text-lg' : 'px-4 py-3 text-sm';
  const chevronSize = size === 'lg' ? 'px-3.5' : 'px-2.5';

  const handleMainClick = () => {
    posthog.capture('download_clicked', {
      source: 'landing',
      download_type: committed.id,
    });

    if (committed.action === 'deeplink') {
      window.location.href = committed.url;
    } else {
      navigator.clipboard.writeText(committed.command).then(() => {
        setCopied(true);
        toast.success('Prompt copied to clipboard', {
          description: `Paste into ${committed.label} to get started.`,
          action: {
            label: 'Learn more',
            onClick: () =>
              window.open('https://docs.rivet.design/mcp-guide', '_blank'),
          },
        });
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!popoverOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % TOOL_OPTIONS.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(
        (i) => (i - 1 + TOOL_OPTIONS.length) % TOOL_OPTIONS.length,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commitIndex(selectedIndex);
      setPopoverOpen(false);
    } else if (e.key === 'Escape') {
      setSelectedIndex(committedIdx);
      setPopoverOpen(false);
    }
  };

  // Measure the widest label so the main button stays a fixed width
  const maxLabel = TOOL_OPTIONS.reduce(
    (longest, tool) =>
      tool.label.length > longest.length ? tool.label : longest,
    '',
  );

  return (
    <Popover
      className={fullWidth ? 'flex w-full' : undefined}
      open={popoverOpen}
      onOpenChange={(open) => {
        // Sync the keyboard highlight to the committed choice whenever the
        // popover toggles, so it always opens on the current selection.
        setSelectedIndex(committedIdx);
        setPopoverOpen(open);
      }}
    >
      <div className={`flex ${fullWidth ? 'w-full' : 'w-fit'}`}>
        {/* Main action button */}
        <button
          type="button"
          onClick={handleMainClick}
          onKeyDown={handleKeyDown}
          className={`type-label-lg relative flex items-center gap-2 rounded-l-lg border border-r-0 ${t.border} ${t.bg} ${t.text} ${mainSize} ${fullWidth ? 'flex-1' : ''} transition-colors focus:outline-none`}
        >
          {/* Invisible ghost: logo + widest label — fixes button width */}
          <img
            aria-hidden
            width="16"
            height="16"
            className="invisible shrink-0"
            alt=""
          />
          <span aria-hidden className="invisible whitespace-nowrap">
            {`Add to ${maxLabel}`}
          </span>
          {/* Visible content: logo + label */}
          <span
            className={`absolute inset-0 flex items-center gap-2 ${padX} ${fullWidth ? 'justify-center' : ''}`}
          >
            {copied ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <ToolLogo
                id={committed.id}
                label={committed.label}
                invert={t.invertLogo}
              />
            )}
            <span
              className={`whitespace-nowrap ${fullWidth ? '' : 'flex-1'}`}
            >
              {`Add to ${committed.label}`}
            </span>
          </span>
        </button>

        {/* Chevron trigger — opens the popover */}
        <PopoverTrigger
          className={`flex items-center justify-center rounded-r-lg border ${t.border} ${t.bg} ${t.text} ${chevronSize} transition-colors focus:outline-none`}
          onKeyDown={handleKeyDown}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </PopoverTrigger>
      </div>

      {/* Dropdown via PopoverContent — always the dark menu surface */}
      <PopoverContent
        align="start"
        sideOffset={6}
        className="min-w-[calc(100%+2rem)]"
        onKeyDown={handleKeyDown}
      >
        {TOOL_OPTIONS.map((tool, i) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => {
              setSelectedIndex(i);
              commitIndex(i);
              setPopoverOpen(false);
            }}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white transition-colors hover:bg-[hsl(0_0%_25%)] focus:outline-none ${i === selectedIndex ? 'bg-[hsl(0_0%_22%)]' : ''}`}
          >
            <ToolLogo id={tool.id} label={tool.label} />
            <span className="flex-1 font-main">{tool.label}</span>
            {i === committedIdx && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default PromptInstallButton;
