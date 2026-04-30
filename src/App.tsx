import { useState, useRef } from 'react';
import { toast, Toaster } from 'sonner';
import { posthog } from '@/lib/posthog';
import { motion, useInView } from 'motion/react';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import DownloadButton from './components/DownloadButton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './components/ui/Popover';

type InstallTool = 'claude' | 'cursor' | 'codex';

const TOOL_LOGOS: Record<InstallTool, string> = {
  claude: '/images/claude.svg',
  cursor: '/images/cursor.svg',
  codex: '/images/codex.svg',
};

const ToolLogo = ({ id, label }: { id: InstallTool; label: string }) => (
  <img
    src={TOOL_LOGOS[id]}
    alt={label}
    width={16}
    height={16}
    className="shrink-0 brightness-0 invert"
  />
);

type ToolOption =
  | { id: InstallTool; label: string; action: 'copy'; command: string }
  | { id: InstallTool; label: string; action: 'deeplink'; url: string };

const TOOL_OPTIONS: ToolOption[] = [
  {
    id: 'claude',
    label: 'Claude Code',
    action: 'copy',
    command:
      'Please install the Rivet MCP server by running: npx rivet-design install claude',
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

/* ------------------------------------------------------------------ */
/*  Animate-on-scroll wrapper                                          */
/* ------------------------------------------------------------------ */
const FadeUp = ({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  Prompt install split button                                        */
/* ------------------------------------------------------------------ */
const PromptInstallButton = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [committedIndex, setCommittedIndex] = useState(0);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const current = TOOL_OPTIONS[selectedIndex];
  const committed = TOOL_OPTIONS[committedIndex];

  const handleMainClick = () => {
    posthog.capture('download_clicked', {
      source: 'landing',
      download_type: current.id,
    });

    if (current.action === 'deeplink') {
      window.location.href = current.url;
    } else {
      navigator.clipboard.writeText(current.command).then(() => {
        setCopied(true);
        toast.success('Prompt copied to clipboard', {
          description: `Paste into ${current.label} to get started.`,
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
      setCommittedIndex(selectedIndex);
      setPopoverOpen(false);
    } else if (e.key === 'Escape') {
      setSelectedIndex(committedIndex);
      setPopoverOpen(false);
    }
  };

  const maxLabel = TOOL_OPTIONS.reduce(
    (longest, tool) =>
      tool.label.length > longest.length ? tool.label : longest,
    '',
  );

  return (
    <Popover
      open={popoverOpen}
      onOpenChange={(open) => {
        if (!open) setSelectedIndex(committedIndex);
        setPopoverOpen(open);
      }}
    >
      <button
        type="button"
        onClick={handleMainClick}
        onKeyDown={handleKeyDown}
        className="type-label-lg relative flex items-center gap-2 rounded-l-lg border border-r-0 border-primary/20 bg-primary px-5 py-3.5 text-sm text-white transition-colors hover:bg-primary-hover focus:outline-none"
      >
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
        <span className="absolute inset-0 flex items-center gap-2 px-5">
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
            <ToolLogo id={committed.id} label={committed.label} />
          )}
          <span className="flex-1 whitespace-nowrap">
            {`Add to ${committed.label}`}
          </span>
        </span>
      </button>

      <PopoverTrigger
        className="flex items-center justify-center rounded-r-lg border border-primary/20 bg-primary px-2.5 text-white transition-colors hover:bg-primary-hover focus:outline-none"
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
              setCommittedIndex(i);
              setPopoverOpen(false);
            }}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white transition-colors hover:bg-[hsl(0_0%_25%)] focus:outline-none ${i === selectedIndex ? 'bg-[hsl(0_0%_22%)]' : ''}`}
          >
            <ToolLogo id={tool.id} label={tool.label} />
            <span className="flex-1 font-main">{tool.label}</span>
            {i === committedIndex && (
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

/* ------------------------------------------------------------------ */
/*  Hero mockup (CSS-only product UI illustration)                     */
/* ------------------------------------------------------------------ */
const HeroMockup = () => (
  <div className="relative mx-auto w-full max-w-[1120px] overflow-hidden rounded-xl border border-green/[0.08] bg-[#F5F4F0] shadow-[0_8px_60px_rgba(31,32,21,0.10)]">
    {/* Browser chrome */}
    <div className="flex items-center gap-2 border-b border-green/[0.06] bg-[#FAFAF8] px-5 py-3">
      <span className="h-3 w-3 rounded-full bg-black/10" />
      <span className="h-3 w-3 rounded-full bg-black/10" />
      <span className="h-3 w-3 rounded-full bg-black/10" />
      <div className="ml-4 flex-1">
        <div className="mx-auto flex h-6 w-72 items-center rounded-md bg-black/[0.04] px-3">
          <span className="font-main text-[11px] text-black/30">app.yourproduct.com</span>
        </div>
      </div>
    </div>

    <div className="flex min-h-[420px]">
      {/* App content area */}
      <div className="flex-1 p-8">
        {/* Simulated app header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-black/[0.06]" />
            <div className="h-4 w-28 rounded bg-black/[0.08]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 rounded-md bg-black/[0.05]" />
            <div className="h-8 w-8 rounded-full bg-black/[0.06]" />
          </div>
        </div>

        {/* Simulated card with selection highlight */}
        <div className="relative mb-6 max-w-md rounded-lg border-2 border-primary bg-white p-6 shadow-sm">
          <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-sm border-2 border-primary bg-white" />
          <span className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-sm border-2 border-primary bg-white" />
          <span className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-sm border-2 border-primary bg-white" />
          <span className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-sm border-2 border-primary bg-white" />
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] text-white">24px</span>

          <div className="mb-3 h-4 w-40 rounded bg-black/[0.1]" />
          <div className="mb-2 h-3 w-full rounded bg-black/[0.06]" />
          <div className="mb-4 h-3 w-3/4 rounded bg-black/[0.06]" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 rounded-md bg-primary/10" />
            <div className="h-8 w-20 rounded-md bg-black/[0.04]" />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="h-24 flex-1 rounded-lg bg-black/[0.03]" />
          <div className="h-24 flex-1 rounded-lg bg-black/[0.03]" />
          <div className="h-24 flex-1 rounded-lg bg-black/[0.03]" />
        </div>
      </div>

      {/* Rivet side panel */}
      <div className="w-[280px] shrink-0 border-l border-black/[0.06] bg-white">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
          <span className="font-cta text-sm font-bold text-primary">rivet</span>
          <div className="flex items-center gap-1.5 rounded-full bg-accent-success/10 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-success" />
            <span className="font-main text-[10px] font-medium text-accent-success">Agent: Claude Code connected</span>
          </div>
        </div>

        <div className="border-b border-black/[0.06] px-4 py-3">
          <span className="font-main text-[10px] font-medium uppercase tracking-wider text-black/40">Selected element</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[11px] text-black/60">&lt;div&gt;</span>
            <span className="font-main text-xs text-black/50">.card-container</span>
          </div>
        </div>

        <div className="border-b border-black/[0.06] px-4 py-3">
          <span className="font-main text-[10px] font-medium uppercase tracking-wider text-black/40">Spacing</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {['Top: 24', 'Right: 24', 'Bottom: 24', 'Left: 24'].map((v) => (
              <div key={v} className="flex items-center justify-between rounded-md border border-black/[0.08] px-2 py-1.5">
                <span className="font-main text-[11px] text-black/50">{v.split(':')[0]}</span>
                <span className="font-mono text-[11px] font-medium text-black/80">{v.split(':')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-black/[0.06] px-4 py-3">
          <span className="font-main text-[10px] font-medium uppercase tracking-wider text-black/40">Layout</span>
          <div className="mt-2 flex gap-1.5">
            {['Flex', 'Grid', 'Block'].map((l, i) => (
              <span key={l} className={`rounded-md px-2.5 py-1 font-main text-[11px] font-medium ${i === 0 ? 'bg-primary/10 text-primary' : 'bg-black/[0.04] text-black/40'}`}>
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="border-b border-black/[0.06] px-4 py-3">
          <span className="font-main text-[10px] font-medium uppercase tracking-wider text-black/40">Typography</span>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-main text-[11px] text-black/50">Font</span>
              <span className="font-main text-[11px] font-medium text-black/80">Inter</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-main text-[11px] text-black/50">Size</span>
              <span className="font-mono text-[11px] font-medium text-black/80">16px</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-main text-[11px] text-black/50">Weight</span>
              <span className="font-mono text-[11px] font-medium text-black/80">500</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3">
          <span className="font-main text-[10px] font-medium uppercase tracking-wider text-black/40">Colors</span>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-5 w-5 rounded-md border border-black/10" style={{ background: '#1a1a1a' }} />
            <span className="font-mono text-[11px] text-black/60">#1A1A1A</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="h-5 w-5 rounded-md border border-black/10" style={{ background: '#ffffff' }} />
            <span className="font-mono text-[11px] text-black/60">#FFFFFF</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Section: How it works                                              */
/* ------------------------------------------------------------------ */
const HowItWorks = () => {
  const steps = [
    {
      num: '01',
      title: 'Open Rivet on your app',
      desc: 'Point Rivet at your app or staging environment. It works on any web product.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="6" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 11h24" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="8.5" r="1" fill="currentColor" />
          <circle cx="11" cy="8.5" r="1" fill="currentColor" />
          <circle cx="14" cy="8.5" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Select and refine visually',
      desc: 'Click any element. Adjust spacing, layout, typography, and colors with precision controls.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M8 8l8 20 3-8 8-3L8 8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M19 19l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Approve and merge',
      desc: 'Review agent-authored code changes. Approve clean diffs and merge directly to your repo.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M10 16l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="4" y="6" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-32">
      <FadeUp>
        <p className="type-overline mb-4 uppercase tracking-widest text-primary">How it works</p>
        <h2 className="mb-16 max-w-2xl font-main text-[32px] font-medium leading-tight tracking-tight text-green md:text-[40px]">
          How Rivet works in your real product
        </h2>
      </FadeUp>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <FadeUp key={step.num} delay={i * 0.12}>
            <div className="group relative flex h-full flex-col gap-5 rounded-xl border border-green/[0.08] bg-white p-8 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_4px_24px_rgba(255,51,0,0.06)]">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary/[0.10] group-hover:text-primary">
                  {step.icon}
                </div>
                <span className="font-mono text-sm text-green/25">{step.num}</span>
              </div>
              <h3 className="font-main text-lg font-semibold text-green">{step.title}</h3>
              <p className="font-main text-[15px] leading-relaxed text-green/55">{step.desc}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Section: Why Rivet exists (before/after)                           */
/* ------------------------------------------------------------------ */
const WhyRivetExists = () => {
  const today = [
    'Broken UI details pile up.',
    'Designers file tickets that take too long to ship.',
    'Engineers are too busy to fix polish.',
  ];
  const withRivet = [
    'Designers fix real UI directly on the live product.',
    'Agents handle the code changes.',
    'Engineers focus on deeper work.',
  ];

  return (
    <section className="w-full bg-green">
      <div className="mx-auto max-w-6xl px-6 py-32">
        <FadeUp>
          <p className="type-overline mb-4 uppercase tracking-widest text-white/40">Why Rivet exists</p>
          <h2 className="mb-16 max-w-2xl font-main text-[32px] font-medium leading-tight tracking-tight text-white md:text-[40px]">
            Design polish shouldn&apos;t require an engineering sprint
          </h2>
        </FadeUp>

        <div className="grid gap-6 md:grid-cols-2">
          <FadeUp delay={0.08}>
            <div className="flex h-full flex-col rounded-xl border border-white/[0.08] bg-white/[0.06] p-8">
              <span className="type-overline mb-6 inline-block w-fit rounded-full bg-white/[0.08] px-3 py-1 uppercase tracking-widest text-white/50">Today</span>
              <div className="flex flex-col gap-4">
                {today.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
                    <span className="font-main text-[15px] leading-relaxed text-white/55">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.16}>
            <div className="flex h-full flex-col rounded-xl border border-primary/30 bg-primary/[0.08] p-8">
              <span className="type-overline mb-6 inline-block w-fit rounded-full bg-primary/20 px-3 py-1 uppercase tracking-widest text-primary">With Rivet</span>
              <div className="flex flex-col gap-4">
                {withRivet.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <svg className="mt-0.5 shrink-0 text-primary" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-main text-[15px] leading-relaxed text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Section: Design with agents                                        */
/* ------------------------------------------------------------------ */
const DesignWithAgents = () => {
  const useCases = [
    {
      title: 'Burn down UI polish backlogs',
      desc: 'Ship dozens of visual fixes in hours, not sprints. Designers work through polish items directly on the live product.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: 'Align spacing and layout across screens',
      desc: 'Catch and fix inconsistencies in padding, margins, and layout structures across every screen.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      title: 'Refactor messy UI into a design system',
      desc: 'Standardize one-off components into reusable, token-driven patterns with agent-generated code.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-32">
      <FadeUp>
        <p className="type-overline mb-4 uppercase tracking-widest text-primary">Agents, not prompts</p>
        <h2 className="mb-6 max-w-2xl font-main text-[32px] font-medium leading-tight tracking-tight text-green md:text-[40px]">
          Design with agents, not in prompts
        </h2>
        <p className="mb-16 max-w-xl font-main text-[17px] leading-relaxed text-green/55">
          Rivet gives coding agents a visual surface. Designers manipulate the UI directly, and the agent writes or refactors the code.
        </p>
      </FadeUp>

      <div className="grid gap-6 md:grid-cols-3">
        {useCases.map((uc, i) => (
          <FadeUp key={uc.title} delay={i * 0.1}>
            <div className="group flex h-full flex-col gap-4 rounded-xl border border-green/[0.08] bg-white p-8 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_4px_24px_rgba(255,51,0,0.06)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary/[0.10] group-hover:text-primary">
                {uc.icon}
              </div>
              <h3 className="font-main text-lg font-semibold text-green">{uc.title}</h3>
              <p className="font-main text-[15px] leading-relaxed text-green/55">{uc.desc}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Section: Trust                                                     */
/* ------------------------------------------------------------------ */
const Trust = () => (
  <section className="w-full border-y border-primary/[0.08] bg-[#FFF8F5]">
    <div className="mx-auto max-w-6xl px-6 py-24">
      <FadeUp>
        <div className="flex flex-col items-center gap-10 text-center">
          <div className="flex items-center gap-3 rounded-full border border-primary/[0.12] bg-white px-5 py-2.5 shadow-sm">
            <svg width="24" height="24" viewBox="0 0 256 256" fill="none">
              <rect width="256" height="256" rx="40" fill="#FF5100" />
              <text x="128" y="170" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="140">Y</text>
            </svg>
            <span className="font-main text-sm font-medium text-green/70">Backed by Y Combinator</span>
          </div>

          <blockquote className="max-w-2xl">
            <p className="font-main text-2xl font-medium leading-snug tracking-tight text-green md:text-3xl">
              &ldquo;Rivet helps product designers own every detail in their live product.&rdquo;
            </p>
          </blockquote>

          <div className="flex items-center gap-10 opacity-40">
            {['Company A', 'Company B', 'Company C', 'Company D'].map((name) => (
              <div key={name} className="flex h-8 w-24 items-center justify-center rounded bg-green/[0.06]">
                <span className="font-main text-[11px] font-medium text-green/40">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  Section: Who it's for                                              */
/* ------------------------------------------------------------------ */
const WhoItsFor = () => {
  const personas = [
    {
      title: 'Product designers',
      desc: "Fix real UI, not just Figma files. Select elements in the live product, refine them visually, and let agents write the code.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="1.5" />
          <path d="M14 3C14 3 19 10 19 14s-2.24 7-5 7-5-3-5-7 5-11 5-11z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 14h22" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      title: 'Product & engineering leaders',
      desc: "Ship polish without slowing developers down. Rivet lets your design team handle UI quality directly, so engineering stays focused on architecture.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="6" width="22" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 14l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-32">
      <FadeUp>
        <p className="type-overline mb-4 uppercase tracking-widest text-primary">Who it&apos;s for</p>
        <h2 className="mb-16 max-w-2xl font-main text-[32px] font-medium leading-tight tracking-tight text-green md:text-[40px]">
          Built for people who care about craft
        </h2>
      </FadeUp>

      <div className="grid gap-6 md:grid-cols-2">
        {personas.map((p, i) => (
          <FadeUp key={p.title} delay={i * 0.1}>
            <div className="group flex h-full flex-col gap-5 rounded-xl border border-green/[0.08] bg-white p-10 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_4px_24px_rgba(255,51,0,0.06)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary/[0.10] group-hover:text-primary">
                {p.icon}
              </div>
              <h3 className="font-main text-xl font-semibold text-green">{p.title}</h3>
              <p className="font-main text-[15px] leading-relaxed text-green/55">{p.desc}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Section: Final CTA                                                 */
/* ------------------------------------------------------------------ */
const FinalCTA = () => (
  <section className="relative w-full overflow-hidden bg-green">
    {/* Subtle gradient accent */}
    <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/[0.08] blur-[120px]" />
    <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-yellow/[0.06] blur-[100px]" />
    <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-28 text-center">
      <FadeUp>
        <h2 className="font-main text-[32px] font-medium leading-tight tracking-tight text-white md:text-[44px]">
          Ready to design your live product with agents?
        </h2>
      </FadeUp>
      <FadeUp delay={0.1}>
        <p className="max-w-md font-main text-[17px] leading-relaxed text-white/55">
          Start fixing real UI today. No config. No setup. Just design.
        </p>
      </FadeUp>
      <FadeUp delay={0.2}>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <DownloadButton className="type-label-lg rounded-lg bg-primary px-8 py-4 text-base text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
            Get the editor
          </DownloadButton>
          <a
            href="https://docs.rivet.design"
            target="_blank"
            rel="noopener noreferrer"
            className="no-external-icon type-label-lg rounded-lg border border-white/20 px-8 py-4 text-base text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            Read the docs
          </a>
        </div>
      </FadeUp>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */
const App = () => {
  return (
    <>
      <Toaster position="bottom-right" theme="light" duration={8000} />
      <div className="flex min-h-screen flex-col bg-[#FAF9F7] font-main">
        {/* Sticky nav */}
        <div className="px-[5vw]">
          <NavBar />
        </div>

        {/* Hero */}
        <section className="relative mx-auto w-full max-w-6xl px-6 pb-8 pt-16 md:pb-16 md:pt-28">
          {/* Subtle radial glow behind hero */}
          <div className="pointer-events-none absolute inset-0 -top-32 mx-auto h-[600px] w-[800px] rounded-full bg-primary/[0.04] blur-[120px]" />
          <div className="relative flex flex-col items-center text-center">
            <FadeUp>
              <h1 className="mx-auto max-w-3xl font-main text-[40px] font-medium leading-[1.1] tracking-tight text-green md:text-[64px]">
                Design your live product with agents.
              </h1>
            </FadeUp>
            <FadeUp delay={0.12}>
              <p className="mx-auto mt-6 max-w-xl font-main text-[17px] leading-relaxed text-green/60 md:text-[19px]">
                Select any element in your app, refine it visually, and ship clean code straight to your repo.
              </p>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="mx-auto mt-3 max-w-lg font-main text-[15px] text-green/40">
                Rivet is built for product designers who want to fix real UI, not just mockups.
              </p>
            </FadeUp>
            <FadeUp delay={0.3}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <PromptInstallButton />
                <DownloadButton className="type-label-lg rounded-lg bg-green px-6 py-3.5 text-white transition-colors hover:bg-green-hover disabled:cursor-not-allowed disabled:opacity-50">
                  Get the editor
                </DownloadButton>
                <a
                  href="#demo"
                  className="type-label-lg rounded-lg border border-green/[0.15] px-6 py-3.5 text-green/60 transition-colors hover:border-green/30 hover:text-green"
                >
                  Watch 90-second demo
                </a>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* Hero mockup */}
        <section className="px-6 pb-32 pt-8 md:pt-12" id="demo">
          <FadeUp delay={0.15}>
            <HeroMockup />
          </FadeUp>
        </section>

        {/* How it works */}
        <HowItWorks />

        {/* Why Rivet exists */}
        <WhyRivetExists />

        {/* Design with agents */}
        <DesignWithAgents />

        {/* Trust */}
        <Trust />

        {/* Who it's for */}
        <WhoItsFor />

        {/* Final CTA */}
        <FinalCTA />

        {/* Footer */}
        <div className="px-[5vw]">
          <Footer />
        </div>

        {/* Mobile sticky button */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-green/[0.08] bg-[#FAF9F7]/80 px-4 py-4 backdrop-blur-md md:hidden">
          <DownloadButton className="type-label-lg block w-full rounded-lg bg-primary px-3 py-3 text-center text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
            Get the editor
          </DownloadButton>
        </div>
      </div>
    </>
  );
};

export default App;