// Opens the selected desktop agent with a CLI-first install prompt ready to
// review and send. Cursor receives a prompt link, not an MCP registration link,
// so the install still uses the CLI's durable global bootstrap.
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, Monitor, Terminal } from 'lucide-react';
import { telemetry, type PromptInstallSource } from '@/lib/telemetry';
import {
  AGENT_LOGOS as TOOL_LOGOS,
  copiedInstallCommand,
  type InstallAgentId as AgentLogo,
} from '@/lib/install';
import { generateInstallRef } from '@/lib/installRef';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import InstallAccordion from './InstallAccordion';

const ICON_PX = 20;
const ToolLogo = ({ id, label }: { id: AgentLogo; label: string }) => (
  <span
    role="img"
    aria-label={label}
    className="block shrink-0"
    style={{
      width: ICON_PX,
      height: ICON_PX,
      backgroundColor: 'currentColor',
      WebkitMaskImage: `url("${TOOL_LOGOS[id]}")`,
      maskImage: `url("${TOOL_LOGOS[id]}")`,
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
    }}
  />
);

type AgentItem = {
  id: AgentLogo;
  group: 'codex' | 'claude' | 'cursor';
  label: string;
  logo: AgentLogo;
  prompt: (command: string) => string;
  deepLink: string;
};

// ChatGPT Desktop retains the codex:// scheme and Codex install target.
// Claude opens its Code view so the agent can run the install command.
const AGENT_ITEMS: AgentItem[] = [
  {
    id: 'codex',
    group: 'codex',
    label: 'ChatGPT',
    logo: 'codex',
    prompt: (command) =>
      `Please set up Rivet for ChatGPT Desktop (Codex) by running: ${command}`,
    deepLink: 'codex://new?prompt=',
  },
  {
    id: 'claude',
    group: 'claude',
    label: 'Claude',
    logo: 'claude',
    prompt: (command) =>
      `Please set up Rivet for Claude Code and Claude Desktop by running: ${command}`,
    deepLink: 'claude://code/new?q=',
  },
  {
    id: 'claude-code',
    group: 'claude',
    label: 'Claude Code',
    logo: 'claude-code',
    prompt: (command) =>
      `Please set up Rivet for Claude Code by running: ${command}`,
    deepLink: 'claude-cli://open?q=',
  },
  {
    id: 'cursor',
    group: 'cursor',
    label: 'Cursor',
    logo: 'cursor',
    prompt: (command) =>
      `Please set up Rivet for Cursor by running: ${command}`,
    deepLink: 'cursor://anysphere.cursor-deeplink/prompt?text=',
  },
];

const AGENT_GROUPS = [
  { id: 'codex', label: 'ChatGPT' },
  { id: 'claude', label: 'Claude' },
  { id: 'cursor', label: 'Cursor' },
] as const;

const continuationLabel = (item: AgentItem) =>
  `Continue in ${item.label}${item.id === 'claude-code' ? ' (Terminal)' : ' (Desktop)'}`;

type PromptInstallButtonProps = {
  source: PromptInstallSource;
  size?: 'md' | 'lg' | 'hero';
  fullWidth?: boolean;
  label?: string;
  /** Close when the page scrolls, before the nav becomes part of the demo. */
  dismissOnScroll?: boolean;
};

const PromptInstallButton = ({
  source,
  size = 'md',
  fullWidth = false,
  label,
  dismissOnScroll = false,
}: PromptInstallButtonProps) => {
  const splitRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(AGENT_ITEMS[0]);
  const [open, setOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [handoff, setHandoff] = useState<{ prompt: string } | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );
  // Keyboard highlight within the menu (-1 = no row highlighted).
  const [highlight, setHighlight] = useState(-1);

  useEffect(() => {
    if (!open || !dismissOnScroll) return;
    const dismiss = () => setOpen(false);
    // Only page scrolling dismisses the menu. Nested demo transcripts can
    // scroll independently while the user is choosing an agent.
    window.addEventListener('scroll', dismiss, { passive: true });
    return () => window.removeEventListener('scroll', dismiss);
  }, [open, dismissOnScroll]);

  const buttonSize =
    size === 'lg'
      ? 'min-h-[60px] text-base'
      : size === 'hero'
        ? 'min-h-[52px] text-base'
        : 'min-h-11 text-sm';
  const actionLabel = continuationLabel(selected);

  const activate = (item: AgentItem) => {
    setSelected(item);
    const installRef = generateInstallRef();
    telemetry.trackDownloadClicked({
      source,
      downloadType: item.id,
      installRef,
    });

    const prompt = item.prompt(copiedInstallCommand(item.id, installRef));
    // Keep navigation in the click/keyboard gesture; clipboard permissions
    // must not delay or block the desktop handoff.
    setHandoff({ prompt });
    setCopyState('idle');
    window.open(
      `${item.deepLink}${encodeURIComponent(prompt)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const openTerminal = () => {
    setOpen(false);
    setTerminalOpen(true);
  };

  const copyPrompt = async () => {
    if (!handoff) return;
    try {
      await navigator.clipboard.writeText(handoff.prompt);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  // Arrow keys move the highlight; Enter activates; Escape closes. Shared by the
  // trigger and the menu so keyboard users can drive the whole thing.
  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
        setHighlight(e.key === 'ArrowDown' ? 0 : AGENT_ITEMS.length);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((i) => (i + 1) % (AGENT_ITEMS.length + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((i) => (i <= 0 ? AGENT_ITEMS.length : i - 1));
    } else if (e.key === 'Enter') {
      if (highlight >= 0) {
        e.preventDefault();
        if (highlight === AGENT_ITEMS.length) openTerminal();
        else activate(AGENT_ITEMS[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <>
      <Popover
        className={fullWidth ? 'flex w-full' : 'max-w-full'}
        open={open}
        onOpenChange={(next) => {
          setHighlight(-1);
          setCopyState('idle');
          setOpen(next);
        }}
      >
        <div
          ref={splitRef}
          className={`flex min-w-0 overflow-hidden rounded-xl border border-black/10 bg-[#171715] text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] ${buttonSize} ${fullWidth ? 'w-full' : ''}`}
        >
          <button
            type="button"
            onClick={() => activate(selected)}
            title={actionLabel}
            className="flex min-w-0 flex-1 items-center justify-center gap-3 px-5 py-3 font-main font-normal transition-colors duration-150 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 motion-reduce:transition-none"
          >
            <span aria-hidden>
              <ToolLogo id={selected.logo} label={selected.label} />
            </span>
            <span className="truncate">{label ?? actionLabel}</span>
          </button>
          <PopoverTrigger
            aria-label="Choose your agent"
            aria-haspopup="dialog"
            onKeyDown={handleMenuKeyDown}
            className="flex w-12 shrink-0 items-center justify-center border-l border-white/15 bg-white/[0.06] transition-colors duration-150 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 motion-reduce:transition-none sm:w-[52px]"
          >
            <ChevronDown
              aria-hidden
              size={18}
              className={`transition-transform duration-150 ease-out motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
            />
          </PopoverTrigger>
        </div>

        <PopoverContent
          align={fullWidth ? 'center' : 'start'}
          sideOffset={6}
          matchTriggerWidth
          anchorRef={splitRef}
          collisionPadding={12}
          aria-label="Choose where to install Rivet"
          className="overflow-y-auto rounded-2xl border-black/[0.12] bg-white p-2 text-[#202020] shadow-[0_12px_32px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)]"
          onKeyDown={handleMenuKeyDown}
        >
          {AGENT_GROUPS.map((group, groupIndex) => (
            <div
              key={group.id}
              role="group"
              aria-label={group.label}
              className={
                groupIndex > 0 ? 'mt-2 border-t border-black/10 pt-2' : ''
              }
            >
              <div className="flex items-center gap-3 px-3 pb-1 pt-2.5 font-main text-[15px] font-semibold">
                <span aria-hidden>
                  <ToolLogo id={group.id} label={group.label} />
                </span>
                {group.label}
              </div>
              {AGENT_ITEMS.filter((item) => item.group === group.id).map(
                (item) => {
                  const index = AGENT_ITEMS.indexOf(item);
                  const isTerminal = item.id === 'claude-code';
                  const SurfaceIcon = isTerminal ? Terminal : Monitor;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={continuationLabel(item)}
                      onClick={() => activate(item)}
                      onMouseEnter={() => setHighlight(index)}
                      onFocus={() => setHighlight(index)}
                      className={`flex w-full items-center gap-3 rounded-lg py-2.5 pl-11 pr-3 text-left font-main text-sm text-[#646464] transition-colors duration-150 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/30 motion-reduce:transition-none ${index === highlight ? 'bg-black/[0.04]' : ''}`}
                    >
                      <SurfaceIcon
                        aria-hidden
                        size={18}
                        strokeWidth={1.7}
                        className="shrink-0 text-[#818181]"
                      />
                      <span className="flex-1">
                        {isTerminal ? 'Claude Code' : 'Desktop'}
                      </span>
                      {selected.id === item.id && (
                        <Check
                          aria-hidden
                          size={15}
                          className="text-[#969696]"
                        />
                      )}
                    </button>
                  );
                },
              )}
            </div>
          ))}
          <div className="mt-2 border-t border-black/10 pt-2">
            <button
              type="button"
              onClick={openTerminal}
              onMouseEnter={() => setHighlight(AGENT_ITEMS.length)}
              onFocus={() => setHighlight(AGENT_ITEMS.length)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left font-main text-sm text-[#646464] transition-colors duration-150 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/30 motion-reduce:transition-none ${highlight === AGENT_ITEMS.length ? 'bg-black/[0.04]' : ''}`}
            >
              <Copy
                size={20}
                strokeWidth={1.7}
                aria-hidden
                className="text-[#818181]"
              />
              <span>Copy instructions</span>
            </button>
          </div>
          {handoff && (
            <div
              onKeyDown={(event) => {
                if (event.key !== 'Escape') event.stopPropagation();
              }}
              className="mt-2 border-t border-black/10 px-3 py-2.5 text-xs text-[#646464]"
            >
              <div className="flex items-center justify-between gap-2">
                <span>Didn't open?</span>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="rounded px-1 py-1 text-[#202020] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
                >
                  {copyState === 'copied' ? 'Copied' : 'Copy prompt'}
                </button>
              </div>
              <span role="status" className="sr-only">
                {copyState === 'copied' ? 'Install prompt copied' : ''}
              </span>
              {copyState === 'failed' && (
                <label className="mt-2 block">
                  Select and copy the prompt
                  <textarea
                    readOnly
                    value={handoff.prompt}
                    onFocus={(event) => event.currentTarget.select()}
                    className="mt-1 block w-full rounded border border-black/15 bg-white p-2 text-xs text-[#202020]"
                  />
                </label>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
      <Dialog open={terminalOpen} onOpenChange={setTerminalOpen}>
        <DialogContent
          overlayClassName="z-[1001]"
          className="z-[1002] max-h-[80vh] overflow-y-auto"
        >
          <DialogHeader className="mb-4">
            <DialogTitle>Install from your terminal</DialogTitle>
            <DialogDescription>
              Copy a command and run it in your terminal.
            </DialogDescription>
          </DialogHeader>
          <InstallAccordion collapsible={false} source={source} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PromptInstallButton;
