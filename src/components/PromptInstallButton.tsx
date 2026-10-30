// Opens the Codex plugin listing or the selected desktop agent with an
// install prompt ready to review and send. Cursor receives a prompt link,
// not an MCP registration link, so its install uses the durable global bootstrap.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { toast } from 'sonner';
import useClipboard from '@/hooks/useClipboard';
import { telemetry, type PromptInstallSource } from '@/lib/telemetry';
import {
  AGENT_LOGOS as TOOL_LOGOS,
  CODEX_PLUGIN_URL,
  installDeepLink,
  installPrompt,
  type DeepLinkAgentId,
  type InstallAgentId as AgentLogo,
} from '@/lib/install';
import { generateInstallRef, type InstallRef } from '@/lib/installRef';
import { openDeepLink, watchHandoff } from '@/lib/handoff';
import HandoffFallback from './HandoffFallback';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import {
  FluidMenuGroup,
  FluidMenuItem,
  type MenuInputMode,
} from './ui/FluidMenuGroup';

const ICON_PX = 20;
const MENU_ICON_CLASS_NAME =
  'flex shrink-0 motion-safe:transition-[transform,filter] motion-safe:duration-200 motion-safe:ease-out motion-safe:group-data-[highlighted]/menu-item:-translate-y-0.5 motion-safe:group-data-[highlighted]/menu-item:drop-shadow-md group-data-[input-mode=keyboard]/menu:transition-none';
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
  id: DeepLinkAgentId;
  label: string;
};

type Handoff = {
  agent: AgentItem & { id: Exclude<DeepLinkAgentId, 'codex'> };
  installRef: InstallRef;
};

// Claude opens its Code view so the agent can run the install command.
const AGENT_ITEMS: AgentItem[] = [
  {
    id: 'codex',
    label: 'Codex',
  },
  {
    id: 'claude',
    label: 'Claude',
  },
  {
    id: 'cursor',
    label: 'Cursor',
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
  const [inputMode, setInputMode] = useState<MenuInputMode>('pointer');
  const highlightItem = useCallback((index: number, mode: MenuInputMode) => {
    setHighlight(index);
    setInputMode(mode);
  }, []);
  // The click whose deep link did not take focus; drives the fallback panel.
  const [fallback, setFallback] = useState<Handoff | null>(null);
  // Every attempt reports its own result; only the latest drives the panel.
  const watchersRef = useRef(new Set<() => void>());
  const latestAttemptRef = useRef(0);
  // Refs, not state: Popover keeps its first-render outside-click handler.
  const fallbackShownRef = useRef(false);
  // Set when the visitor closes the panel, so a retry still being watched
  // reports its result without reopening it.
  const fallbackDismissedRef = useRef(false);
  // A result that lands while the chooser is open must not cover the menu.
  const chooserOpenRef = useRef(false);
  useEffect(() => {
    chooserOpenRef.current = open;
  }, [open]);

  const showFallback = (handoff: Handoff | null) => {
    fallbackShownRef.current = handoff !== null;
    setFallback(handoff);
  };
  const dismissFallback = () => {
    if (fallbackShownRef.current) fallbackDismissedRef.current = true;
    showFallback(null);
  };

  useEffect(() => {
    const watchers = watchersRef.current;
    return () => watchers.forEach((stop) => stop());
  }, []);

  // Focus usually stays on the CTA, outside the portaled panel.
  useEffect(() => {
    if (!fallback) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissFallback();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [fallback]);

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

  // Listeners go up before navigating so an immediate blur is not missed.
  const handOff = ({ agent, installRef }: Handoff) => {
    const attempt = ++latestAttemptRef.current;
    fallbackDismissedRef.current = false;
    const toastId = toast.success(`Opening ${agent.label}…`, {
      duration: 3000,
    });
    const stop = watchHandoff((leftPage) => {
      watchersRef.current.delete(stop);
      telemetry.trackDownloadHandoff({
        source,
        downloadType: agent.id,
        installRef,
        result: leftPage ? 'left_page' : 'fallback_shown',
      });
      if (attempt !== latestAttemptRef.current) return;
      if (leftPage) {
        showFallback(null);
        return;
      }
      toast.dismiss(toastId);
      if (!fallbackDismissedRef.current && !chooserOpenRef.current) {
        showFallback({ agent, installRef });
      }
    });
    watchersRef.current.add(stop);
    openDeepLink(installDeepLink(agent.id, installRef));
  };

  const activate = (item: AgentItem) => {
    setSelected(item);
    showFallback(null);
    // Keep navigation in the click/keyboard gesture; clipboard permissions
    // must not delay or block the desktop handoff.
    setOpen(false);
    if (item.id === 'codex') {
      telemetry.trackDownloadClicked({
        source,
        downloadType: 'codex',
        installMethod: 'plugin_directory',
      });
      ++latestAttemptRef.current;
      window.open(CODEX_PLUGIN_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    const installRef = generateInstallRef();
    telemetry.trackDownloadClicked({
      source,
      downloadType: item.id,
      installRef,
    });
    handOff({ agent: { ...item, id: item.id }, installRef });
  };

  const copyPrompt = async () => {
    setCopyFailed(false);
    const installRef = generateInstallRef();
    try {
      await copyToClipboard(installPrompt('agent', installRef));
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
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') setInputMode('keyboard');
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        dismissFallback();
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

  const wrapperClassName = fullWidth ? 'flex w-full' : 'max-w-full';

  return (
    <Popover
      className={wrapperClassName}
      open={fallback !== null}
      onOpenChange={(next) => {
        if (!next) dismissFallback();
      }}
    >
      <Popover
        className={wrapperClassName}
        open={open}
        onOpenChange={(next) => {
          setHighlight(-1);
          setInputMode('pointer');
          if (next) dismissFallback();
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
          <FluidMenuGroup
            label="Install in your agent"
            startIndex={0}
            activeIndex={highlight}
            inputMode={inputMode}
            onHighlight={highlightItem}
          >
            {AGENT_ITEMS.map((item, index) => (
              <FluidMenuItem
                key={item.id}
                index={index}
                aria-label={continuationLabel(item)}
                onClick={() => activate(item)}
              >
                <span aria-hidden className={MENU_ICON_CLASS_NAME}>
                  <ToolLogo id={item.id} label={item.label} />
                </span>
                <span className="flex-1">{item.label}</span>
                {selected.id === item.id && (
                  <Check aria-hidden size={15} className="text-[#969696]" />
                )}
              </FluidMenuItem>
            ))}
          </FluidMenuGroup>
          <FluidMenuGroup
            label="Copy prompt to install"
            startIndex={AGENT_ITEMS.length}
            activeIndex={highlight}
            inputMode={inputMode}
            onHighlight={highlightItem}
            className="mt-2 border-t border-black/10 pt-2"
          >
            <FluidMenuItem
              index={0}
              onClick={() => void copyPrompt()}
              aria-label="Copy prompt"
            >
              <span aria-hidden className={MENU_ICON_CLASS_NAME}>
                <Copy size={20} strokeWidth={1.7} className="text-[#818181]" />
              </span>
              <span>{isCopied ? 'Copied' : 'Copy prompt'}</span>
            </FluidMenuItem>
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
          </FluidMenuGroup>
        </PopoverContent>
      </Popover>
      <PopoverContent
        align={fullWidth ? 'center' : 'start'}
        sideOffset={6}
        matchTriggerWidth
        minWidth={320}
        anchorRef={splitRef}
        collisionPadding={12}
        data-lenis-prevent
        aria-label={`Install Rivet in ${fallback?.agent.label ?? ''}`}
        className="overflow-y-auto overscroll-contain rounded-2xl border-black/[0.12] bg-white text-black shadow-[0_12px_32px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)]"
      >
        {fallback && (
          <HandoffFallback
            key={fallback.installRef}
            agent={fallback.agent}
            installRef={fallback.installRef}
            onRetry={() => handOff(fallback)}
            onClose={dismissFallback}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};

export default PromptInstallButton;
