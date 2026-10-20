import { useEffect, useRef, useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { telemetry, type PromptInstallSource } from '@/lib/telemetry';
import {
  AGENT_LOGOS as TOOL_LOGOS,
  installDeepLink,
  installPrompt,
  type DeepLinkAgentId,
  type InstallAgentId as AgentLogo,
} from '@/lib/install';
import { generateInstallRef } from '@/lib/installRef';
import useClipboard from '@/hooks/useClipboard';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';

// Logo painted in the button's own text colour rather than rendered as
// artwork. The files are single-colour marks on transparency, so they go
// through a mask and take `currentColor` as their fill — which means every
// tone's icons match its label for free.
//
// The brightness-0/invert filter pair this replaces could only ever reach
// black or white, so the outline tone (a #642e39 label on no fill) was stuck
// with black icons beside maroon text. Masking is also what makes the three
// files agree: they ship black, unfilled, and #ffffff respectively, and a
// mask reads their alpha, not their colour.
const ICON_PX = 16;
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

type AgentItem = { id: DeepLinkAgentId | 'agent'; label: string };

const AGENT_ITEMS: AgentItem[] = [
  { id: 'codex', label: 'Continue with Codex' },
  { id: 'claude', label: 'Continue with Claude' },
  { id: 'agent', label: 'Copy to agent' },
];

type Tone = 'orange' | 'dark' | 'light' | 'secondary';

const TONES: Record<
  Tone,
  { bg: string; border: string; text: string; ring: string }
> = {
  orange: {
    bg: 'bg-primary hover:bg-primary-hover',
    border: 'border-primary/20',
    text: 'text-white',
    // Ring color around each icon so it reads as a distinct chip.
    ring: 'ring-primary',
  },
  dark: {
    bg: 'bg-accent-foreground hover:bg-[hsl(0_0%_20%)]',
    border: 'border-white/15',
    text: 'text-white',
    ring: 'ring-accent-foreground',
  },
  light: {
    bg: 'bg-white hover:bg-white/80',
    border: 'border-black/10',
    text: 'text-accent-foreground',
    ring: 'ring-white',
  },
  // The nav links' outline treatment (the Community pill, the old Watch
  // demo): transparent over whatever ground the bar sits on. The icon chips
  // drop their fill and ring with it — filled chips are the primary's dress.
  secondary: {
    bg: 'bg-transparent hover:bg-[#642e39]/5',
    border: 'border-[#642e39]',
    text: 'text-[#642e39]',
    ring: 'ring-transparent',
  },
};

type PromptInstallButtonProps = {
  source: PromptInstallSource;
  tone?: Tone;
  /** `hero` matches the hero CTA pills (px-5 py-[10px] text-base). */
  size?: 'md' | 'lg' | 'hero';
  fullWidth?: boolean;
  label?: string;
  /** Close when the page scrolls, before the nav becomes part of the demo. */
  dismissOnScroll?: boolean;
};

const PromptInstallButton = ({
  source,
  tone = 'orange',
  size = 'md',
  fullWidth = false,
  label = 'Add Rivet to your agent',
  dismissOnScroll = false,
}: PromptInstallButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [installRef, setInstallRef] = useState(generateInstallRef);
  const menuItemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>(
    [],
  );
  const { copyToClipboard } = useClipboard();
  // Keyboard highlight within the menu (-1 = no row highlighted).
  const [highlight, setHighlight] = useState(-1);

  useEffect(() => {
    if (!isOpen || !dismissOnScroll) return;
    const dismiss = () => setIsOpen(false);
    // Only page scrolling dismisses the menu. Nested demo transcripts can
    // scroll independently while the user is choosing an agent.
    window.addEventListener('scroll', dismiss, { passive: true });
    return () => window.removeEventListener('scroll', dismiss);
  }, [isOpen, dismissOnScroll]);

  const t = TONES[tone];

  const mainSize =
    size === 'lg'
      ? 'px-6 py-4 text-lg'
      : size === 'hero'
        ? 'px-5 py-[10px] font-aileron text-base leading-[1.164] tracking-[-0.16px]'
        : 'px-[16px] py-[8px] text-sm';
  // Orange gets the hero CTA's gradient rather than a flat fill, so the two
  // primary buttons on the page read as the same object. As a CLASS, not a
  // style prop: the trigger is a PopoverTrigger, which forwards className but
  // has no `style` in its props. Other tones stay flat — a gradient on the
  // dark/light variants would just muddy them.
  const gradient =
    tone === 'orange'
      ? 'bg-[linear-gradient(137.74deg,rgb(236,68,35)_41.128%,rgb(243,138,118)_121.74%)]'
      : '';
  const iconBox = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  const activate = (target: AgentItem['id']) => {
    telemetry.trackDownloadClicked({
      source,
      downloadType: target,
      installRef,
    });
    if (target === 'agent') {
      copyToClipboard(installPrompt(target, installRef)).then(
        () => {
          toast.success('Prompt copied to clipboard', {
            description: 'Paste into your coding agent to install Rivet.',
          });
        },
        () => toast.error("Couldn't copy the prompt. Try again."),
      );
    }
    setIsOpen(false);
  };

  // Arrow keys move the highlight; Enter activates; Escape closes. Shared by the
  // trigger and the menu so keyboard users can drive the whole thing.
  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((i) => (i + 1) % AGENT_ITEMS.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((i) => (i - 1 + AGENT_ITEMS.length) % AGENT_ITEMS.length);
    } else if (e.key === 'Enter') {
      if (highlight >= 0) {
        e.preventDefault();
        menuItemRefs.current[highlight]?.click();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <Popover
      className={fullWidth ? 'flex w-full' : undefined}
      open={isOpen}
      onOpenChange={(next) => {
        setHighlight(-1);
        if (next) setInstallRef(generateInstallRef());
        setIsOpen(next);
      }}
    >
      {/* The trigger: label + agent icon row. Hover is a plain background
          fade (via t.bg's hover variant) — no lift/fan animation. */}
      <PopoverTrigger
        onKeyDown={handleMenuKeyDown}
        className={`type-label-lg group flex items-center gap-2.5 rounded-lg border font-normal ${t.border} ${t.bg} ${gradient} ${t.text} ${mainSize} ${
          fullWidth ? 'w-full justify-center' : 'w-fit'
        } transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
      >
        <span className="flex shrink-0 items-center gap-1" aria-hidden>
          {(['codex', 'claude', 'cursor'] as AgentLogo[]).map((logo) => (
            <span
              key={logo}
              className={`relative flex ${iconBox} items-center justify-center rounded-full ${t.bg} ring-2 ${t.ring}`}
            >
              <ToolLogo id={logo} label={logo} />
            </span>
          ))}
        </span>
        <span className="whitespace-nowrap">{label}</span>
      </PopoverTrigger>
      {/* The menu matches the trigger's width exactly, so the dropdown reads
          as an extension of the button it opens from. */}
      <PopoverContent
        align={fullWidth ? 'center' : 'start'}
        sideOffset={6}
        matchTriggerWidth
        className="py-1"
        onKeyDown={handleMenuKeyDown}
      >
        {AGENT_ITEMS.map((item, i) => {
          const className = `group flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white transition-colors hover:bg-[hsl(0_0%_25%)] focus:outline-none ${
            i === highlight ? 'bg-[hsl(0_0%_22%)]' : ''
          }`;
          const content = (
            <>
              <span
                aria-hidden
                className={`flex shrink-0 transition-[transform,filter] duration-200 ease-out will-change-transform group-hover:-translate-y-0.5 group-hover:drop-shadow-md motion-reduce:!translate-y-0 motion-reduce:!drop-shadow-none motion-reduce:transition-none ${
                  i === highlight ? '-translate-y-0.5 drop-shadow-md' : ''
                }`}
              >
                {item.id === 'agent' ? (
                  <Copy size={ICON_PX} aria-hidden />
                ) : (
                  <ToolLogo id={item.id} label={item.id} />
                )}
              </span>
              <span className="flex-1 font-main">{item.label}</span>
            </>
          );

          return item.id === 'agent' ? (
            <button
              key={item.id}
              ref={(element) => {
                menuItemRefs.current[i] = element;
              }}
              type="button"
              onClick={() => activate(item.id)}
              onMouseEnter={() => setHighlight(i)}
              onFocus={() => setHighlight(i)}
              className={className}
            >
              {content}
            </button>
          ) : (
            <a
              key={item.id}
              ref={(element) => {
                menuItemRefs.current[i] = element;
              }}
              href={installDeepLink(item.id, installRef)}
              onClick={() => activate(item.id)}
              onMouseEnter={() => setHighlight(i)}
              onFocus={() => setHighlight(i)}
              className={className}
            >
              {content}
            </a>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};

export default PromptInstallButton;
