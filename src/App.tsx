import { useState, useEffect, useRef, memo, useLayoutEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { posthog } from '@/lib/posthog';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import FadeInText, { GeometricLines } from './components/FadeInText';
// import WorkflowPanels from './components/WorkflowPanels';
import CommentDemoSection from './components/CommentDemoSection';
import DownloadButton from './components/DownloadButton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './components/ui/Popover';

const R2_PUBLIC_URL = 'https://releases.rivet.design';
const RELEASES_LINK = 'https://docs.rivet.design/releases';

/**
 * Fetch the latest Rivet version string from the R2 release manifest
 */
const useLatestVersion = () => {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${R2_PUBLIC_URL}/latest-mac.yml`)
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then((yaml) => {
        const match = yaml.match(/^version:\s*(.+)$/m);
        if (match) setVersion(match[1].trim());
      })
      .catch(() => {
        // Silently ignore — the chip will still render without a version
      });
  }, []);

  return version;
};

type InstallTool = 'claude' | 'cursor' | 'codex';

const TOOL_LOGOS: Record<InstallTool, string> = {
  claude: '/images/claude.svg',
  cursor: '/images/cursor.svg',
  codex: '/images/codex.svg',
};

// Logo rendered from public/ image files
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

  // Measure the widest label so the main button stays a fixed width
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
      {/* Main action button */}
      <button
        type="button"
        onClick={handleMainClick}
        onKeyDown={handleKeyDown}
        className="type-label-lg relative flex items-center gap-2 rounded-l-lg border border-r-0 border-primary/20 bg-primary px-4 py-3 text-sm text-white transition-colors hover:bg-primary-hover focus:outline-none"
      >
        {/* Invisible ghost: logo + widest label + copy icon — fixes button width */}
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
        {/* Visible content: logo left · label middle */}
        <span className="absolute inset-0 flex items-center gap-2 px-4">
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

      {/* Chevron trigger — opens the popover */}
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

      {/* Dropdown via PopoverContent */}
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

// const FeaturePanel = () => {
//   return (
//     <div className="-mx-[5vw] flex min-h-[28rem] w-screen flex-col items-start justify-center gap-8 bg-main px-[5vw] py-12 sm:flex-row sm:items-center sm:gap-12">
//       {/* Left: title + subtitle */}
//       <div className="flex max-w-sm flex-col gap-4 text-left font-main">
//         <h2 className="type-heading-2 text-3xl font-normal text-foreground md:text-4xl">
//           Use your design context.
//         </h2>
//         <p className="type-subtitle text-[#555555] md:text-lg">
//           View, edit and change your design tokens for typography, color, spacing and more.
//         </p>
//       </div>

//       {/* Right: product image */}
//       <div className="flex flex-1 items-center justify-end">
//         <div className="w-full max-w-xs overflow-hidden rounded-lg" style={{ backgroundColor: '#2D1B69' }}>
//           <img
//             src="/images/tokens@2x.png"
//             alt="Tokens"
//             className="w-full"
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

const CodePanel = () => {
  return (
    <div className="flex w-full justify-center bg-green px-8 py-20 font-main text-[#FEFFF3] md:py-28">
      <div className="flex w-full max-w-prose flex-col gap-6 text-left">
        <span className="text-[28px] font-normal leading-[1.15] md:text-[36px] lg:text-[44px]">
          Made for people who design.
        </span>
        <span className="text-[18px] font-normal leading-[1.65] md:text-[20px]">
          Coding agents ask designers to become like engineers. That&apos;s
          wrong. They should be more like directors.
        </span>
        <span className="text-[18px] font-normal leading-[1.65] md:text-[20px]">
          Product design was never just about the pixels on a page. Details
          matter. But figuring out what to build matters more.
        </span>
        <span className="text-[18px] font-normal leading-[1.65] md:text-[20px]">
          Code is an infinitely flexible medium to design in. AI tools have
          made it abundant. It&apos;s an ideal medium for the next era of
          design.
        </span>
      </div>
    </div>
  );
};

const RIPPLE_SHAPES = ['circle', 'triangle', 'square'] as const;
type RippleShape = (typeof RIPPLE_SHAPES)[number];

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

// Hash-based pseudo-random in [0, 1) — deterministic per seed
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

type CellProps = {
  cx: number;
  cy: number;
  pathR: number;
  strokeWidth: number;
  shape: RippleShape;
  scale: number;
};

// Memoized so cells whose props don't change skip re-render — critical for
// keeping rAF-driven hover updates cheap (only the ~dozen cells inside the
// morph zone re-render each frame).
const Cell = memo(({ cx, cy, pathR, strokeWidth, shape, scale }: CellProps) => {
  const common = { fill: 'none', stroke: 'black', strokeWidth };
  let path: React.ReactElement;
  if (shape === 'square') {
    path = (
      <rect
        {...common}
        x={-pathR}
        y={-pathR}
        width={pathR * 2}
        height={pathR * 2}
      />
    );
  } else if (shape === 'triangle') {
    const points = [
      `0,${-pathR}`,
      `${pathR * COS30},${pathR * SIN30}`,
      `${-pathR * COS30},${pathR * SIN30}`,
    ].join(' ');
    path = <polygon {...common} points={points} />;
  } else {
    path = <circle {...common} cx={0} cy={0} r={pathR} />;
  }
  return <g transform={`translate(${cx} ${cy}) scale(${scale})`}>{path}</g>;
});
Cell.displayName = 'Cell';

/**
 * Decorative grid for the orange hero panel. Stroke weight is heaviest at the
 * top (filled dots) and thins down to outline rings at the bottom — Mike
 * Tessier "Unoriginal Idea" inspiration. On hover, an organic blob around the
 * cursor (radius wobbles by angle + time) cycles its cells through random
 * shapes at a deliberate pace as long as the user keeps hovering.
 */
const CircleGridArt = () => {
  const cols = 12;
  const maxRows = 14;
  const minRows = 3;
  const spacing = 24;
  // Uniform inner padding from each panel edge to the outer cell edge.
  // Same value used vertically and horizontally for equal padding on all 4
  // sides.
  const gridPadding = 18;
  // Smaller outerR = thinner max stroke (filled top rows) and smaller dots
  // overall, calibrating against the hairline circles in the peach panel.
  const outerR = 4;
  const fallbackWidth = (cols + 2) * spacing;
  const fallbackHeight = (maxRows + 2) * spacing;

  // Each shape holds for 1.2s — slow enough to feel deliberate.
  const shapeDuration = 1200;
  // Snappy ramp: ~110ms at each stage end; quick easing (cubic) so cells stay
  // visible most of the window and clip in/out fast.
  const rampFraction = 0.09;
  // ~30fps keeps the ramp easings smooth without burning frames during holds.
  const frameInterval = 1000 / 30;
  // Organic blob around cursor (angle-based only — no temporal wobble)
  const baseRadius = 50;

  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const startTimeRef = useRef(0);
  const lastFrameRef = useRef(0);
  const [, setTick] = useState(0);

  const svgRef = useRef<SVGSVGElement>(null);
  const [svgSize, setSvgSize] = useState({
    width: fallbackWidth,
    height: fallbackHeight,
  });

  useLayoutEffect(() => {
    const panel = svgRef.current?.parentElement;
    if (!panel) return;

    const measure = () => {
      const { width: rawWidth, height: rawHeight } =
        panel.getBoundingClientRect();
      const width = Math.round(rawWidth);
      const height = Math.round(rawHeight);
      if (width === 0 || height === 0) return;
      setSvgSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    return () => ro.disconnect();
  }, []);

  // Reserve gridPadding + outerR on every side, so the cell edge (not center)
  // sits exactly gridPadding away from the panel edge — matching on x and y.
  // Both axes pick a row/col count from the natural spacing, then stretch
  // their actual spacing to fill the span exactly. That way no leftover gets
  // tossed into asymmetric centering padding.
  const verticalSpan = Math.max(
    0,
    svgSize.height - 2 * (gridPadding + outerR),
  );
  const rows = Math.max(
    minRows,
    Math.min(maxRows, Math.floor(verticalSpan / spacing) + 1),
  );
  const rowSpacing = rows > 1 ? verticalSpan / (rows - 1) : 0;
  const startY = gridPadding + outerR;

  const horizontalSpan = Math.max(
    0,
    svgSize.width - 2 * (gridPadding + outerR),
  );
  const columnSpacing =
    cols > 1 ? Math.max(8, horizontalSpan / (cols - 1)) : 0;
  const startX = gridPadding + outerR;

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      if (
        cursorRef.current !== null &&
        now - lastFrameRef.current >= frameInterval
      ) {
        lastFrameRef.current = now;
        setTick((n) => (n + 1) % 1_000_000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [frameInterval]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const localPt = pt.matrixTransform(ctm.inverse());
    if (cursorRef.current === null) {
      startTimeRef.current = performance.now();
    }
    cursorRef.current = { x: localPt.x, y: localPt.y };
  };

  const handleMouseLeave = () => {
    cursorRef.current = null;
    setTick((n) => (n + 1) % 1_000_000);
  };

  const cursor = cursorRef.current;
  const elapsed = cursor ? performance.now() - startTimeRef.current : 0;

  const cells: React.ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Top filled (t=1) → bottom thin ring (t=0). Gradient adapts to the
      // currently rendered row count so the full thick→thin sweep is always
      // visible, even when we shed rows to match the panel aspect.
      const norm = rows === 1 ? 0 : r / (rows - 1);
      const t = 1 - norm;
      const innerR = (1 - t) * (outerR - 1);
      const strokeWidth = outerR - innerR;
      const pathR = (outerR + innerR) / 2;

      const cx = startX + c * columnSpacing;
      const cy = startY + r * rowSpacing;

      let shape: RippleShape = 'circle';
      let scale = 1;

      if (cursor) {
        const dx = cx - cursor.x;
        const dy = cy - cursor.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        // Pure angular wobble — boundary is stable while cursor is still
        const wobble = 14 * Math.sin(angle * 3) + 7 * Math.sin(angle * 7);
        const boundary = baseRadius + wobble;
        if (dist < boundary) {
          // Per-cell phase offset desyncs boundaries so cells don't all swap
          // together — kills the uniform "group fade" look.
          const cellPhase =
            pseudoRandom(r * 7 + c * 13) * shapeDuration;
          const localElapsed = elapsed + cellPhase;

          // Random per (cell, cycle): each shape change rolls a new shape
          const cycleNum = Math.floor(localElapsed / shapeDuration);
          const seed = r * 131 + c * 37 + cycleNum * 17;
          const idx = Math.floor(pseudoRandom(seed) * RIPPLE_SHAPES.length);
          shape = RIPPLE_SHAPES[idx];

          // Snappy easing: cubic in/out keeps the cell near scale 1 most of
          // the ramp, then clips quickly to/from 0 at the boundary.
          const stageProgress =
            (localElapsed % shapeDuration) / shapeDuration;
          let ramp = 1;
          if (stageProgress < rampFraction) {
            const t = stageProgress / rampFraction;
            ramp = 1 - (1 - t) ** 3; // easeOutCubic — fast rise
          } else if (stageProgress > 1 - rampFraction) {
            const t = (stageProgress - (1 - rampFraction)) / rampFraction;
            ramp = 1 - t ** 3; // easeInCubic flipped — slow then fast drop
          }
          scale = ramp;
        }
      }

      cells.push(
        <Cell
          key={`${r}-${c}`}
          cx={cx}
          cy={cy}
          pathR={pathR}
          strokeWidth={strokeWidth}
          shape={shape}
          scale={scale}
        />,
      );
    }
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
      preserveAspectRatio="none"
      className="absolute inset-0 block h-full w-full"
      aria-hidden
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {cells}
    </svg>
  );
};

const App = () => {
  const latestVersion = useLatestVersion();

  const renderDownloadPanel = () => {
    return (
      <div className="hidden flex-col items-center gap-6 py-16 md:flex">
        <h2 className="type-heading-1 text-center text-[44px] font-normal">
          Own every visual detail.
        </h2>
        <div className="w-full max-w-lg">
          <DownloadButton className="type-label-lg w-full rounded-lg bg-primary px-6 py-4 text-lg text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
            Download for Mac
          </DownloadButton>
        </div>
      </div>
    );
  };

  const renderHeroText = () => {
    return (
      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-[1fr_360px] md:grid-rows-[1fr_1fr] lg:grid-cols-[1fr_420px]">
        {/* LEFT: White card with badge, title, subtitle, CTAs (spans both rows) */}
        <FadeInText className="md:col-start-1 md:row-span-2">
          <div className="flex h-full flex-col justify-between gap-8 rounded-lg border border-divider/20 bg-white px-8 py-10 md:px-12 md:py-12">
            {/* Top: New / MCP badge */}
            <a
              href={RELEASES_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="no-external-icon flex w-fit items-center gap-2"
            >
              <span className="type-overline relative rounded-full bg-green px-2 py-0.5 text-white">
                <span className="absolute inset-0 rounded-full bg-green opacity-20" />
                <span className="relative">New</span>
              </span>
              <span className="text-base text-black hover:underline">
                Try Rivet&apos;s MCP{latestVersion ? ` in v${latestVersion}` : ''}
              </span>
            </a>

            {/* Bottom: Title, subtitle, CTAs */}
            <div className="flex flex-col gap-6">
              <span className="type-display text-[40px] font-normal leading-[1.05] text-black md:text-[56px] lg:text-[64px]">
                Direct, don&apos;t implement.
              </span>
              <span className="text-[16px] font-normal leading-relaxed text-divider-muted md:text-[18px]">
                Set the vision and let design agents explore dozens of
                directions. Then share visual feedback and refine the details.
              </span>
              <div className="mt-2 hidden flex-row flex-wrap items-center gap-3 md:flex">
                <PromptInstallButton />
                <DownloadButton className="type-label-lg rounded-lg bg-black px-6 py-3 text-center text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50">
                  Download for Mac
                </DownloadButton>
              </div>
            </div>
          </div>
        </FadeInText>

        {/* RIGHT-TOP: peach panel with line art */}
        <FadeInText className="md:col-start-2 md:row-start-1">
          <div className="relative h-full min-h-[180px] overflow-hidden rounded-lg bg-[#FCE5DC]">
            <GeometricLines />
          </div>
        </FadeInText>

        {/* RIGHT-BOTTOM: orange panel with circle-grid art */}
        <FadeInText className="md:col-start-2 md:row-start-2" delay={0.3}>
          <div className="relative h-full min-h-[180px] overflow-hidden rounded-lg bg-primary">
            <CircleGridArt />
          </div>
        </FadeInText>
      </div>
    );
  };
  return (
    <>
      <Toaster position="bottom-right" theme="light" duration={8000} />
      <div className="flex min-h-screen flex-col gap-12 bg-main px-[5vw]">
        <NavBar />
        <div className="flex w-full items-start justify-start md:items-center md:justify-center">
          {renderHeroText()}
        </div>

        <div className="-mx-[5vw]" id="demo-panel">
          {/* <WorkflowPanels /> */}
          <CommentDemoSection />
          <CodePanel />
        </div>
        {/* <FeaturePanel /> */}
        {renderDownloadPanel()}
        <div className="-mt-12 md:mt-0">
          <Footer />
        </div>

        {/* Mobile sticky button */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-content-muted/20 bg-[#FEFFF3]/80 px-4 py-4 backdrop-blur-md md:hidden">
          <a
            href="https://discord.gg/qccDTZDBgX"
            target="_blank"
            rel="noopener noreferrer"
            className="no-external-icon type-label-lg block w-full rounded-lg bg-primary px-3 py-3 text-center text-white transition-colors hover:bg-primary-hover"
          >
            Join the community
          </a>
        </div>
      </div>
    </>
  );
};

export default App;
