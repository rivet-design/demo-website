// Opens the selected desktop agent with a CLI-first install prompt ready to
// review and send. Cursor receives a prompt link, not an MCP registration link,
// so the install still uses the CLI's durable global bootstrap.
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { toast } from 'sonner';
import useClipboard from '@/hooks/useClipboard';
import { telemetry, type PromptInstallSource } from '@/lib/telemetry';
import {
  AGENT_LOGOS as TOOL_LOGOS,
  copiedInstallCommand,
  copiedAgentInstallPrompt,
  type InstallAgentId as AgentLogo,
} from '@/lib/install';
import { generateInstallRef } from '@/lib/installRef';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';

const ICON_PX = 20;
const ToolLogo = ({
  id,
  label,
  size = ICON_PX,
}: {
  id: AgentLogo;
  label: string;
  size?: number;
}) => (
  <span
    role="img"
    aria-label={label}
    className="block shrink-0"
    style={{
      width: size,
      height: size,
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
  id: Exclude<AgentLogo, 'claude-code'>;
  label: string;
  prompt: (command: string) => string;
  deepLink: string;
};

// Claude opens its Code view so the agent can run the install command.
const AGENT_ITEMS: AgentItem[] = [
  {
    id: 'codex',
    label: 'Codex',
    prompt: (command) => `Please set up Rivet for Codex by running: ${command}`,
    deepLink: 'codex://new?prompt=',
  },
  {
    id: 'claude',
    label: 'Claude',
    prompt: (command) =>
      `Please set up Rivet for Claude Code and Claude Desktop by running: ${command}`,
    deepLink: 'claude://code/new?q=',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    prompt: (command) =>
      `Please set up Rivet for Cursor by running: ${command}`,
    deepLink: 'cursor://anysphere.cursor-deeplink/prompt?text=',
  },
];

const continuationLabel = (item: AgentItem) => `Continue in ${item.label}`;

const BUTTON_TONES = {
  orange: {
    frame:
      'border-primary/20 bg-primary bg-[linear-gradient(137.74deg,rgb(236,68,35)_41.128%,rgb(243,138,118)_121.74%)] text-white',
    action: 'hover:bg-white/[0.06]',
    chevron: 'border-white/20 bg-white/[0.06] hover:bg-white/[0.12]',
  },
  secondary: {
    frame: 'border-[#642e39] bg-transparent text-[#642e39]',
    action: 'hover:bg-[#642e39]/5',
    chevron: 'border-[#642e39]/20 hover:bg-[#642e39]/5',
  },
  light: {
    frame: 'border-black/10 bg-white text-[#171715]',
    action: 'hover:bg-black/[0.04]',
    chevron: 'border-black/10 bg-black/[0.03] hover:bg-black/[0.06]',
  },
};

type PromptInstallButtonProps = {
  source: PromptInstallSource;
  tone?: keyof typeof BUTTON_TONES;
  size?: 'md' | 'lg' | 'hero';
  fullWidth?: boolean;
  label?: string;
  /** Dismiss when the page or one of the button's ancestors scrolls. */
  dismissOnScroll?: boolean;
};

const PromptInstallButton = ({
  source,
  tone = 'orange',
  size = 'md',
  fullWidth = false,
  label,
  dismissOnScroll = true,
}: PromptInstallButtonProps) => {
  const splitRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(AGENT_ITEMS[0]);
  const [open, setOpen] = useState(false);
  const { isCopied, copyToClipboard } = useClipboard();
  const [copyFailed, setCopyFailed] = useState(false);
  // Keyboard highlight within the menu (-1 = no row highlighted).
  const [highlight, setHighlight] = useState(-1);

  useEffect(() => {
    if (!open || !dismissOnScroll) return;
    const dismiss = (event: Event) => {
      const anchor = splitRef.current;
      const target = event.target;
      // The chooser and unrelated demo panes keep their own native scroll.
      if (
        target === window ||
        target === document ||
        (anchor && target instanceof Element && target.contains(anchor))
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('scroll', dismiss, {
      passive: true,
      capture: true,
    });
    return () => window.removeEventListener('scroll', dismiss, true);
  }, [open, dismissOnScroll]);

  const buttonSize =
    size === 'lg'
      ? 'px-6 py-4 font-main text-lg'
      : size === 'hero'
        ? 'px-5 py-[10px] font-aileron text-base leading-[1.164] tracking-[-0.16px]'
        : 'px-4 py-2 font-main text-sm';
  const actionLabel = continuationLabel(selected);
  const buttonTone = BUTTON_TONES[tone];

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
    setOpen(false);
    window.open(
      `${item.deepLink}${encodeURIComponent(prompt)}`,
      '_blank',
      'noopener,noreferrer',
    );
    toast.success(`Opening ${item.label}…`, { duration: 3000 });
  };

  const copyPrompt = async () => {
    setCopyFailed(false);
    const installRef = generateInstallRef();
    try {
      await copyToClipboard(copiedAgentInstallPrompt(installRef));
      telemetry.trackDownloadClicked({
        source,
        downloadType: 'agent',
        copyMethod: 'row_click',
        installRef,
      });
      toast.success('Prompt copied', {
        description: 'Paste it into your agent to install Rivet.',
        duration: 5000,
      });
    } catch {
      setCopyFailed(true);
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
        if (highlight === AGENT_ITEMS.length) void copyPrompt();
        else activate(AGENT_ITEMS[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Popover
      className={fullWidth ? 'flex w-full' : 'max-w-full'}
      open={open}
      onOpenChange={(next) => {
        setHighlight(-1);
        setOpen(next);
      }}
    >
      <div
        ref={splitRef}
        className={`flex min-w-0 overflow-hidden rounded-xl border ${buttonTone.frame} ${fullWidth ? 'w-full' : ''}`}
      >
        <button
          type="button"
          onClick={() => activate(selected)}
          title={actionLabel}
          className={`flex min-w-0 flex-1 items-center justify-center gap-2.5 font-normal ${buttonSize} transition-colors duration-150 ${buttonTone.action} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current motion-reduce:transition-none`}
        >
          <span aria-hidden>
            <ToolLogo id={selected.id} label={selected.label} size={16} />
          </span>
          <span className="truncate">{label ?? actionLabel}</span>
        </button>
        <PopoverTrigger
          aria-label="Choose your agent"
          aria-haspopup="dialog"
          onKeyDown={handleMenuKeyDown}
          className={`flex w-10 shrink-0 items-center justify-center border-l ${buttonTone.chevron} transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current motion-reduce:transition-none`}
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
        minWidth={240}
        anchorRef={splitRef}
        collisionPadding={12}
        data-lenis-prevent
        aria-label="Choose where to install Rivet"
        className="overflow-y-auto overscroll-contain rounded-2xl border-black/[0.12] bg-white p-2 text-black shadow-[0_12px_32px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)]"
        onKeyDown={handleMenuKeyDown}
      >
        <div role="group" aria-label="Open in desktop">
          <p className="px-3 pb-1 pt-2 font-main text-xs font-normal text-[#646464]">
            Open in desktop
          </p>
          {AGENT_ITEMS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={continuationLabel(item)}
              onClick={() => activate(item)}
              onMouseEnter={() => setHighlight(index)}
              onFocus={() => setHighlight(index)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left font-main text-sm text-black transition-colors duration-150 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/30 motion-reduce:transition-none ${index === highlight ? 'bg-black/[0.04]' : ''}`}
            >
              <span aria-hidden>
                <ToolLogo id={item.id} label={item.label} />
              </span>
              <span className="flex-1">{item.label}</span>
              {selected.id === item.id && (
                <Check aria-hidden size={15} className="text-[#969696]" />
              )}
            </button>
          ))}
        </div>
        <div
          role="group"
          aria-label="Copy prompt to install"
          className="mt-2 border-t border-black/10 pt-2"
        >
          <p className="px-3 pb-1 pt-2 font-main text-xs font-normal text-[#646464]">
            Copy prompt to install
          </p>
          <button
            type="button"
            onClick={() => void copyPrompt()}
            aria-label="Copy prompt for agent"
            onMouseEnter={() => setHighlight(AGENT_ITEMS.length)}
            onFocus={() => setHighlight(AGENT_ITEMS.length)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left font-main text-sm text-black transition-colors duration-150 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/30 motion-reduce:transition-none ${highlight === AGENT_ITEMS.length ? 'bg-black/[0.04]' : ''}`}
          >
            <Copy
              size={20}
              strokeWidth={1.7}
              aria-hidden
              className="text-[#818181]"
            />
            <span>{isCopied ? 'Copied' : 'Copy prompt for agent'}</span>
          </button>
          <span
            role="status"
            className={
              copyFailed
                ? 'block px-3 pb-2 font-main text-xs text-black'
                : 'sr-only'
            }
          >
            {copyFailed
              ? 'Couldn’t copy. Try again.'
              : isCopied
                ? 'Prompt copied'
                : ''}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PromptInstallButton;
