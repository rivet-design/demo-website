// Single one-click install button. The three agent icons (Codex, Cursor,
// Claude) are always fanned and fully visible — evenly separated with clear
// gaps. On hover/focus each icon LIFTS (translates up) and gains a soft drop
// shadow, and the gaps widen a touch. One click copies a single generic/
// all-agents install prompt. Replaces the older split button (main
// "Add to <tool>" action + chevron dropdown).
import { useState } from 'react';
import { toast } from 'sonner';
import { posthog } from '@/lib/posthog';

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

// Laid out left-to-right (Claude, Cursor, Codex), each fully visible with a
// clear gap between them. Hover/focus lifts each icon and widens the gap.
const FAN_TOOLS: { id: InstallTool; label: string }[] = [
  { id: 'claude', label: 'Claude' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'codex', label: 'Codex' },
];

// One generic prompt that wires up every agent at once — the single click no
// longer needs a per-tool choice now that the dropdown is gone.
const INSTALL_PROMPT =
  'Please install the Rivet MCP server for my coding agent by running: npx rivet-design install';

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
  const [copied, setCopied] = useState(false);

  const t = TONES[tone];

  const mainSize = size === 'lg' ? 'px-6 py-4 text-lg' : 'px-4 py-3 text-sm';
  const iconBox = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  const handleClick = () => {
    posthog.capture('download_clicked', {
      source: 'landing',
      download_type: 'all',
    });

    navigator.clipboard.writeText(INSTALL_PROMPT).then(() => {
      setCopied(true);
      toast.success('Prompt copied to clipboard', {
        description: 'Paste into your coding agent to get started.',
        action: {
          label: 'Learn more',
          onClick: () =>
            window.open('https://docs.rivet.design/mcp-guide', '_blank'),
        },
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    // `group` drives the lift: hover/focus-within on the button raises each
    // icon and widens the gap via per-icon `group-hover` / `group-focus-within`
    // transform + spacing utilities.
    <button
      type="button"
      onClick={handleClick}
      className={`group type-label-lg flex items-center gap-2.5 rounded-lg border ${t.border} ${t.bg} ${t.text} ${mainSize} ${
        fullWidth ? 'w-full justify-center' : 'w-fit'
      } transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
    >
      <span className="whitespace-nowrap">Add to your agent</span>
      {/* Icon area. The fanned row stays mounted so the button keeps a constant
          width; once copied it goes invisible (still reserving its space) and
          the confirmation check is overlaid on the right edge. */}
      <span className="relative flex shrink-0 items-center">
        {/* Already-fanned icon row. At rest each icon is fully visible with a
            clear gap. On hover/focus the gap widens and each icon lifts up with
            a soft drop shadow. `motion-reduce` keeps the icons static (no lift
            or translate) for reduced-motion users. */}
        <span
          className={`flex shrink-0 items-center gap-1 transition-[gap] duration-200 ease-out motion-reduce:transition-none ${
            copied
              ? 'invisible'
              : 'group-hover:gap-1.5 group-focus-within:gap-1.5 motion-reduce:!gap-1'
          }`}
          aria-hidden
        >
          {FAN_TOOLS.map((tool) => (
            <span
              key={tool.id}
              className={`relative flex ${iconBox} items-center justify-center rounded-full ${t.bg} ring-2 ${t.ring} transition-[transform,box-shadow] duration-200 ease-out will-change-transform group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-within:-translate-y-0.5 group-focus-within:shadow-md motion-reduce:!translate-y-0 motion-reduce:!shadow-none motion-reduce:transition-none`}
            >
              <ToolLogo id={tool.id} label={tool.label} invert={t.invertLogo} />
            </span>
          ))}
        </span>

        {/* Confirmation check — overlaid at the right edge of the reserved icon
            area after a click, so the button width never changes. */}
        {copied && (
          <span className="absolute inset-y-0 right-0 flex items-center">
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
          </span>
        )}
      </span>
    </button>
  );
};

export default PromptInstallButton;
