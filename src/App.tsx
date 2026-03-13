import { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import FadeInText from './components/FadeInText';
import WorkflowPanels from './components/WorkflowPanels';
import DownloadButton from './components/DownloadButton';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/Popover';

const R2_PUBLIC_URL = 'https://pub-040a2f5482814f468dacec8f11d37f1e.r2.dev';
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

const WAVE_FRAMES = [
  [
    '~~~~~|   |    |   |    |   |    |   |~~~~',
    '~~~~~ ~~~ ~~~~ ~~~ ~~~~ ~~~ ~~~~ ~~~ ~~~',
    '~~~~~   ~~~  ~~~  ~~~  ~~~  ~~~  ~~~  ~~',
  ],
  [
    '~~~~^|   |    |   |    |   |    |   |v~~~',
    '~~~~  ~~~  ~~~  ~~~  ~~~  ~~~  ~~~  ~~~~',
    '~~~~   ~~   ~~   ~~   ~~   ~~   ~~   ~~~',
  ],
  [
    '~~~~v|   |    |   |    |   |    |   |^~~~',
    '~~~   ~~   ~~   ~~   ~~   ~~   ~~   ~~~~',
    '~~~    ~    ~    ~    ~    ~    ~    ~~~~',
  ],
  [
    '~~~~~|   |    |   |    |   |    |   |~~~~',
    '~~~~  ~~~  ~~~  ~~~  ~~~  ~~~  ~~~  ~~~~',
    '~~~~   ~~   ~~   ~~   ~~   ~~   ~~   ~~~',
  ],
];

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
  { id: 'claude', label: 'Claude Code', action: 'copy', command: 'Please install the Rivet MCP server by running: npx rivet-design install claude' },
  { id: 'cursor', label: 'Cursor', action: 'deeplink', url: 'cursor://anysphere.cursor-deeplink/mcp/install?name=Rivet&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyJyaXZldC1kZXNpZ24iLCJpbnN0YWxsIiwiY3Vyc29yIl19' },
  { id: 'codex', label: 'Codex', action: 'copy', command: 'Please install the Rivet MCP server by running: npx rivet-design install codex' },
];

const PromptInstallButton = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [committedIndex, setCommittedIndex] = useState(0);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const current = TOOL_OPTIONS[selectedIndex];
  const committed = TOOL_OPTIONS[committedIndex];

  const handleMainClick = () => {
    if (current.action === 'deeplink') {
      window.location.href = current.url;
    } else {
      navigator.clipboard.writeText(current.command).then(() => {
        setCopied(true);
        toast.success('Prompt copied to clipboard', {
          description: `Paste into ${current.label} to get started.`,
          action: {
            label: 'Learn more',
            onClick: () => window.open('https://docs.rivet.design/mcp-guide', '_blank'),
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
      setSelectedIndex((i) => (i - 1 + TOOL_OPTIONS.length) % TOOL_OPTIONS.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setCommittedIndex(selectedIndex);
      setPopoverOpen(false);
    } else if (e.key === 'Escape') {
      setPopoverOpen(false);
    }
  };

  // Measure the widest label so the main button stays a fixed width
  const maxLabel = TOOL_OPTIONS.reduce(
    (longest, tool) => (tool.label.length > longest.length ? tool.label : longest),
    ''
  );

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      {/* Main action button */}
      <button
        type="button"
        onClick={handleMainClick}
        onKeyDown={handleKeyDown}
        className="type-label-lg relative flex items-center gap-2 rounded-l-lg bg-[hsl(0_0%_9%)] px-4 py-3 text-sm text-white transition-colors hover:bg-[hsl(0_0%_20%)] border border-white/20 border-r-0 focus:outline-none"
      >
        {/* Invisible ghost: logo + widest label + copy icon — fixes button width */}
        <img aria-hidden width="16" height="16" className="invisible shrink-0" alt="" />
        <span aria-hidden className="invisible whitespace-nowrap">
          {`Add to ${maxLabel}`}
        </span>
        {/* Visible content: logo left · label middle */}
        <span className="absolute inset-0 flex items-center gap-2 px-4">
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
        className="flex items-center justify-center rounded-r-lg bg-[hsl(0_0%_9%)] px-2.5 text-white transition-colors hover:bg-[hsl(0_0%_20%)] border border-white/20 focus:outline-none"
        onKeyDown={handleKeyDown}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </PopoverTrigger>

      {/* Dropdown via PopoverContent */}
      <PopoverContent align="start" sideOffset={6} className="min-w-[calc(100%+2rem)]" onKeyDown={handleKeyDown}>
        {TOOL_OPTIONS.map((tool, i) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => { setSelectedIndex(i); setCommittedIndex(i); setPopoverOpen(false); }}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white transition-colors hover:bg-[hsl(0_0%_25%)] focus:outline-none ${i === selectedIndex ? 'bg-[hsl(0_0%_22%)]' : ''}`}
          >
            <ToolLogo id={tool.id} label={tool.label} />
            <span className="font-main flex-1">{tool.label}</span>
            {i === committedIndex && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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
  const [waveFrame, setWaveFrame] = useState(0);

  /**
   * @effect - Rotate through wave frames every 400ms
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveFrame((prev) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-[24rem] w-full flex-col items-start justify-center gap-6 bg-green py-8 text-left font-main text-[#FEFFF3] sm:h-96 sm:flex-row sm:items-center sm:gap-0">
      <div className="flex max-w-lg flex-col justify-center gap-4 px-8 sm:gap-6">
        <span className="type-heading-3 md:text-2xl lg:text-3xl">
          Made for people who design.
        </span>
        <span className="type-subtitle md:text-xl lg:text-2xl" style={{ fontSize: '21px' }}>
          Rivet gives visual AI tools for designers who want to sculpt the software they work on.{' '}
        </span>
      </div>
      <div className="flex flex-col justify-center overflow-x-auto px-8 sm:overflow-x-visible">
        <pre className="font-mono text-[0.6rem] leading-tight text-[#FEFFF3] sm:text-xs">
          {`        |\\      /|      |\\      /|
        | \\    / |      | \\    / |
        |  \\  /  |      |  \\  /  |
        |   \\/   |      |   \\/   |
        |        |      |        |
     ___|________|______|________|__
    |_____________________________|
     |   |    |   |    |   |    |   |
     |   |    |   |    |   |    |   |
${WAVE_FRAMES[waveFrame][0]}
${WAVE_FRAMES[waveFrame][1]}
${WAVE_FRAMES[waveFrame][2]}`}
        </pre>
      </div>
    </div>
  );
};

const App = () => {
  const latestVersion = useLatestVersion();

  const renderDownloadPanel = () => {
    return (
      <div className="hidden flex-col items-center gap-6 py-16 pb-24 sm:flex sm:pb-0">
        <h2 className="type-heading-1 text-center text-4xl font-normal">
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
      <div className="type-heading-3 flex w-full flex-col gap-4 text-left sm:gap-6 sm:text-2xl md:text-2xl">
        <FadeInText>
          <a
            href={RELEASES_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-fit"
          >
            <span className="type-overline relative rounded-full bg-green px-2 py-0.5 text-white">
              <span className="absolute inset-0 rounded-full bg-green opacity-20" />
              <span className="relative">New</span>
            </span>
            <span className="text-base text-black hover:underline">
              Try Rivet&apos;s MCP{latestVersion ? ` in v${latestVersion}` : ''}
            </span>
          </a>
        </FadeInText>
        <FadeInText className="type-display text-[36px] text-black font-normal">
          The visual editor to design with agents.
        </FadeInText>
        <FadeInText className="w-full" delay={0.3}>
          <div className="flex flex-col gap-1 text-base text-black sm:text-base md:text-base lg:text-lg">
            <span className="text-[18px] font-normal">Turn design feedback into code and get the details right with precise visual tools. </span>
          </div>
        </FadeInText>
        <FadeInText className="hidden sm:block" delay={0.5}>
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton className="type-label-lg hidden rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:inline-block">
              Download for Mac
            </DownloadButton>
            <PromptInstallButton />
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
      <div className="flex w-full items-start justify-start sm:items-center sm:justify-center">
        {renderHeroText()}
      </div>

      <div className="-mx-[5vw]" id="demo-panel">
        <WorkflowPanels />
        <CodePanel />
      </div>
      {/* <FeaturePanel /> */}
      {renderDownloadPanel()}
      <div>
        <Footer />
      </div>

      {/* Mobile sticky button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-content-muted/20 bg-[#FEFFF3]/80 px-4 py-4 backdrop-blur-md sm:hidden">
        <a
          href="https://discord.gg/qccDTZDBgX"
          target="_blank"
          rel="noopener noreferrer"
          className="type-label-lg block w-full rounded-lg bg-primary px-3 py-3 text-center text-white transition-colors hover:bg-primary-hover"
        >
          Join the community
        </a>
      </div>
    </div>
    </>
  );
};

export default App;
