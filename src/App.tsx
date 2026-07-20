import { useState, useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import FadeInText from './components/FadeInText';
// import WorkflowPanels from './components/WorkflowPanels';
import CommentDemoSection from './components/CommentDemoSection';
import VariantsDemoSection from './components/VariantsDemoSection';
import ReferencesDemoSection from './components/ReferencesDemoSection';
import PaperSheet from './components/PaperSheet';
import PromptInstallButton from './components/PromptInstallButton';
import InstallAccordion from './components/InstallAccordion';
import BrowserFrame from './components/BrowserFrame';
import SketchGuides from './components/SketchGuides';
import VariantsShowcase from './components/variantsDemo/VariantsShowcase';
import AgentTerminalSection from './components/AgentTerminalSection';
import { MACINTOSH_SYSTEM_ID } from './components/variantsDemo/data';
import AgentTerminal from './components/sandbox/AgentTerminal';
import ReplayButton from './components/ReplayButton';
import { HERO_SESSION } from './components/sandbox/terminalScript';
import { pageBackground } from './lib/background';

const R2_PUBLIC_URL = 'https://releases.rivet.design';
const RELEASES_LINK = 'https://docs.rivet.design/releases';
// Try: hide the "New — Try Rivet's MCP in vX.Y" hero badge. Flip to true to restore.
const SHOW_MCP_BADGE = false;
// Hide the "Made for people who design." manifesto panel (CodePanel). Flip to
// true to restore.
const SHOW_MANIFESTO_PANEL = false;
// Hide the "Explore lots of design directions" panel (VariantsDemoSection).
// Flip to true to restore.
const SHOW_VARIANTS_PANEL = false;

// Hero agent-chat interaction timing: the floating chat types the prompt + MCP
// tool calls first, then the browser window opens, then the variant directions
// generate and fade in.
const HERO_WINDOW_OPEN_MS = 2600;
const HERO_LOAD_DELAY_MS = 2600;

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

// const FeaturePanel = () => {
//   return (
//     <div className="bleed-page-gutter-x page-gutter-x flex min-h-[28rem] w-screen flex-col items-start justify-center gap-8 bg-main py-12 sm:flex-row sm:items-center sm:gap-12">
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

const NIGHT_DEMO_VIDEO_SRC =
  'https://pub-eed10ae7764348e2b0775fb6de2f56de.r2.dev/media/riv_demo_night.web.mp4';

const CodePanel = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  // Defer fetching the 16MB video until the panel is close to the viewport.
  // Saves the bytes (and the decode work) on initial page load — the file
  // only starts streaming once a user actually scrolls toward this section.
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    // 400px rootMargin gives the network a head start so the video is ready
    // by the time the section is in view, without paying the cost up-front.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Defensive muting: the `muted` JSX attribute alone has a known React quirk
  // where the property doesn't always flip on the underlying element on the
  // first render. Set it via ref, and re-snap if anything tries to unmute
  // (browser extensions, future code).
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.volume = 0;
    const enforce = () => {
      if (!el.muted) el.muted = true;
      if (el.volume !== 0) el.volume = 0;
    };
    el.addEventListener('volumechange', enforce);
    return () => el.removeEventListener('volumechange', enforce);
  }, []);

  return (
    <div
      ref={sectionRef}
      className="relative flex w-full justify-center overflow-hidden bg-green px-6 py-24 font-main text-[#FEFFF3] md:py-36"
    >
      {/* Full-width background video. src + preload only set once shouldLoad
          flips — keeps the bytes off the wire on initial page load. */}
      <video
        ref={videoRef}
        src={shouldLoad ? NIGHT_DEMO_VIDEO_SRC : undefined}
        preload={shouldLoad ? 'auto' : 'none'}
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        aria-label="Rivet night demo"
        onContextMenu={(e) => e.preventDefault()}
        className="pointer-events-none absolute inset-0 h-full w-full bg-[#0e0e0e] object-cover"
      />
      {/* Scrim for depth + contrast behind the letter. */}
      <div
        className="pointer-events-none absolute inset-0 bg-black/25"
        aria-hidden
      />

      {/* The "letter" — centered on top of the video. */}
      <PaperSheet className="relative z-10 w-full max-w-prose">
        <div className="flex flex-col gap-6 px-12 py-14 text-left text-[#2b2620] md:px-16 md:py-16">
          <span className="hero-title-size font-normal leading-[1.12]">
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
      </PaperSheet>
    </div>
  );
};

const App = () => {
  const latestVersion = useLatestVersion();

  // The floating agent-chat intro is a desktop, motion-allowed affordance: it's
  // `hidden lg:flex`, so below lg there's no visible chat to justify the staged
  // delays, and reduced-motion users shouldn't sit through the typing + open
  // sequence. Decide once, synchronously on first render, so the showcase never
  // starts in a delayed/blank state it then has to correct. When the intro does
  // NOT play, the window and variants drop their delays and land immediately.
  // Captured once: which intro to PLAY is decided on first paint (replaying the
  // typing choreography on a resize would be jarring), and reduced-motion rarely
  // toggles mid-session.
  const [{ motionOK, isMobileHero }] = useState(() => {
    if (typeof window === 'undefined')
      return { motionOK: false, isMobileHero: false };
    return {
      motionOK: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      isMobileHero: !window.matchMedia('(min-width: 1024px)').matches,
    };
  });
  // Desktop (lg+): the agent chat floats over the editor and types while the
  // window opens — both visible at once. Mobile: there isn't room for that, so
  // the intro is sequential (agent types alone → minimizes → editor maximizes
  // and cycles options). Reduced-motion users get neither and land on the editor.
  const playHeroIntro = motionOK && !isMobileHero;
  const playHeroIntroMobile = motionOK && isMobileHero;
  const windowOpenDelayMs = playHeroIntro ? HERO_WINDOW_OPEN_MS : 0;
  const loadDelayMs = playHeroIntro ? HERO_LOAD_DELAY_MS : 0;

  // The editor's steady-state LAYOUT (portrait iframes, no directions panel,
  // auto-cycling) must track the viewport — unlike the one-shot intro above —
  // so widening past 1024px after a phone load lands on the desktop layout.
  const [isMobileViewport, setIsMobileViewport] = useState(isMobileHero);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsMobileViewport(!mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Bumped by the hero's replay button: keys the intro players/window so they
  // remount, and re-arms the choreography effect below.
  const [heroRun, setHeroRun] = useState(0);
  // Hero choreography: the agent chat starts centered (drawing the eye to the
  // prompt as it types), then slides to the RIGHT side of the showcase once
  // the browser window has animated in — and PERSISTS there. It never
  // minimizes or unmounts: the finished transcript stays as a fixture of the
  // hero composition.
  const [chatMoved, setChatMoved] = useState(false);
  useEffect(() => {
    // No intro this session → settle the chat into its final position at once
    // (it isn't rendered, but this keeps the choreography state coherent).
    if (!playHeroIntro) {
      setChatMoved(true);
      return;
    }
    const t = setTimeout(() => setChatMoved(true), HERO_WINDOW_OPEN_MS + 900);
    return () => clearTimeout(t);
  }, [playHeroIntro, heroRun]);

  // Mobile hero phase machine: 'agent' (the agent window types alone) →
  // 'minimizing' (it scales/fades out) → 'editor' (the editor maximizes in its
  // place and cycles options). Non-mobile or reduced-motion starts at 'editor'.
  const [mobilePhase, setMobilePhase] = useState<
    'agent' | 'minimizing' | 'editor'
  >(() => (playHeroIntroMobile ? 'agent' : 'editor'));
  const mobileTimers = useRef<number[]>([]);
  const handleMobileAgentComplete = () => {
    // Let the "6 directions ready" result sit a beat, then minimize the agent
    // and hand off to the editor once the minimize animation (~0.5s) finishes.
    mobileTimers.current.push(
      window.setTimeout(() => setMobilePhase('minimizing'), 1100),
      window.setTimeout(() => setMobilePhase('editor'), 1100 + 520),
    );
  };
  useEffect(() => () => mobileTimers.current.forEach(clearTimeout), []);
  // Replay the hero's terminal intro from the top: cancel any pending
  // choreography timers, rewind the chat states, and bump heroRun so the keyed
  // terminal players remount and the scripted typing starts over. The browser
  // window + variant iframes are intentionally NOT keyed/remounted — tearing
  // them down respawns every demo iframe (reads as new windows popping in);
  // only the typing animation restarts.
  const replayHero = () => {
    mobileTimers.current.forEach(clearTimeout);
    mobileTimers.current = [];
    setChatMoved(false);
    setChatPos(null);
    setMobilePhase(playHeroIntroMobile ? 'agent' : 'editor');
    setHeroRun((n) => n + 1);
  };

  // --- Draggable chat ------------------------------------------------------
  // Once the user grabs the chat, `chatPos` pins it at explicit pixel
  // coordinates (top-left, relative to the hero showcase) and the
  // choreography's class-based centering/slide no longer applies. Replay
  // resets it to null so the intro positions take over again.
  const heroShowcaseRef = useRef<HTMLDivElement>(null);
  const chatWrapRef = useRef<HTMLDivElement>(null);
  const [chatPos, setChatPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [chatDragging, setChatDragging] = useState(false);
  const chatDragCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => chatDragCleanup.current?.(), []);
  const startChatDrag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const wrap = chatWrapRef.current;
    const hero = heroShowcaseRef.current;
    if (!wrap || !hero) return;
    e.preventDefault();
    chatDragCleanup.current?.();
    const rect = wrap.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    const grabX = e.clientX - rect.left;
    const grabY = e.clientY - rect.top;
    setChatDragging(true);
    const onMove = (ev: PointerEvent) => {
      const x = Math.min(
        Math.max(ev.clientX - heroRect.left - grabX, 0),
        heroRect.width - rect.width,
      );
      const y = Math.min(
        Math.max(ev.clientY - heroRect.top - grabY, 0),
        heroRect.height - rect.height,
      );
      setChatPos({ x, y });
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      chatDragCleanup.current = null;
    };
    const end = () => {
      cleanup();
      setChatDragging(false);
    };
    chatDragCleanup.current = cleanup;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };
  // During the agent phase the editor isn't mounted yet; it takes over once the
  // agent has minimized out.
  const showMobileAgent = playHeroIntroMobile && mobilePhase !== 'editor';

  const renderDownloadPanel = () => {
    return (
      <div className="relative z-10 hidden flex-col items-center py-16 lg:flex">
        <div className="flex flex-col gap-6">
          <h2 className="hero-title-size text-center font-main font-normal leading-[1.12]">
            Direct, don’t implement.
          </h2>
          <PromptInstallButton size="lg" fullWidth />
          <InstallAccordion />
        </div>
      </div>
    );
  };

  const renderHeroText = () => {
    return (
      <div className="w-full">
        {/* White card with badge, title, subtitle, CTAs */}
        <FadeInText>
          <div
            className={`flex flex-col items-center gap-5 rounded-lg text-center`}
          >
            {/* Top: New / MCP badge */}
            {SHOW_MCP_BADGE && (
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
                  Try Rivet&apos;s MCP
                  {latestVersion ? ` in v${latestVersion}` : ''}
                </span>
              </a>
            )}

            {/* Title only — the black install CTA lives below the intro
                statement section now. */}
            <div className="flex flex-col items-center gap-8">
              <span className="hero-title-size hero-title-text font-main font-normal normal-case leading-[1.12] text-black">
                Explore dozens of design directions
                <br className="hidden lg:inline" /> from your agent.
              </span>
            </div>
          </div>
        </FadeInText>
      </div>
    );
  };
  return (
    <>
      <Toaster position="bottom-right" theme="dark" duration={8000} />
      {/* Paper texture behind all content. Applied to the scrolling container
          (not fixed) so it travels with the page; tiled vertically to cover the
          full scroll height at the same horizontal scale across the viewport. */}
      <div
        className={`page-gutter-x relative flex min-h-screen flex-col gap-8 ${pageBackground.className}`}
        style={pageBackground.style}
      >
        {/* Hand-drawn blueprint guide lines, behind all content. */}
        <SketchGuides />
        <NavBar />
        {/* Hero copy gets 3x the horizontal padding of the content panels
            (p-4/sm:p-6/lg:p-8 → px-12/sm:px-[4.5rem]/lg:px-24), symmetric on
            both ends. The hero-title-text font formula subtracts this same
            12rem (lg) so the two-line title exactly fills the padded width.
            py-8 doubles the block's effective vertical spacing: the page
            column's gap-8 (2rem) + this 2rem = 4rem above and below. */}
        <div className="relative z-10 flex w-full items-start justify-start px-12 py-8 sm:px-[4.5rem] lg:px-24">
          {renderHeroText()}
        </div>

        <div
          id="hero-showcase"
          ref={heroShowcaseRef}
          className="relative z-10 flex w-full justify-center bg-cover bg-center p-4 sm:p-6 lg:p-8"
          style={{ backgroundImage: "url('/images/halftone-bg.webp')" }}
        >
          {showMobileAgent ? (
            // Mobile intro: the agent window types the request + MCP calls on its
            // own (full hero box), then minimizes to hand off to the editor.
            <div className="w-full" style={{ height: '58vh', minHeight: 440 }}>
              <AgentTerminal
                key={heroRun}
                loop={false}
                typeMs={28}
                script={HERO_SESSION}
                onComplete={handleMobileAgentComplete}
                className={`h-full w-full ${
                  mobilePhase === 'minimizing'
                    ? 'origin-center animate-[rivet-mobile-minimize_0.5s_cubic-bezier(0.7,0,0.84,0)_forwards]'
                    : ''
                }`}
              />
            </div>
          ) : (
            <BrowserFrame
              url="localhost:4000"
              draggable
              animateOpen
              openDelayMs={windowOpenDelayMs}
              className="w-full"
            >
              <VariantsShowcase
                heightClassName="h-[58vh] min-h-[440px]"
                // Mobile cycles through the options on its own (no directions
                // panel) and renders each variant's portrait (mobile-first)
                // layout; desktop stays pinned, shows the panel, and uses the
                // 1280px layout. Driven by the reactive viewport flag so a
                // resize across 1024px switches layouts to match.
                autoPlay={isMobileViewport && motionOK}
                showDirections={!isMobileViewport}
                portrait={isMobileViewport}
                autoAdvanceMs={2000}
                initialVariantId={MACINTOSH_SYSTEM_ID}
                loadDelayMs={loadDelayMs}
              />
            </BrowserFrame>
          )}

          {/* Floating agent chat that "drives" the demo: it types the prompt +
              Rivet MCP tool calls, then the window opens and the directions
              generate and fade in. It starts centered, slides to the RIGHT
              side of the showcase, and persists there with the finished
              transcript — it never minimizes or unmounts. The user can grab
              and move it anywhere within the hero (clamped to the showcase);
              until first grabbed, the intro choreography positions it.
              Hidden on small screens where the hero is already tight. */}
          {playHeroIntro && (
            <div
              ref={chatWrapRef}
              onPointerDown={startChatDrag}
              className={`absolute z-20 hidden h-[240px] w-[300px] touch-none select-none lg:block lg:h-[300px] lg:w-[380px] ${
                chatDragging ? 'cursor-grabbing' : 'cursor-grab'
              } ${
                chatPos
                  ? ''
                  : `ease-[cubic-bezier(0.16,1,0.3,1)] -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-700 ${
                      chatMoved
                        ? 'left-[70%] top-[61%] lg:left-[77%] lg:top-[63%]'
                        : 'left-1/2 top-1/2'
                    }`
              }`}
              style={chatPos ? { left: chatPos.x, top: chatPos.y } : undefined}
            >
              <AgentTerminal
                key={heroRun}
                compact
                loop={false}
                script={HERO_SESSION}
                className="pointer-events-none h-full w-full lg:flex"
              />
            </div>
          )}

          {/* Replays the whole intro: typing chat → window open → directions.
              z-30 keeps it above the floating chat (z-20). */}
          <ReplayButton className="z-30" onClick={replayHero} />
        </div>

        {/* Below-the-fold statement, under the UI variants shell — the
            "What is Rivet, exact copy" Rivet direction, adapted per review:
            centered instead of left-aligned, label removed, and the lead
            sentence stepped down from hero-title-size to a ~2xl/3xl scale.
            Copy only, no CTA (the hero title carries the install CTA). */}
        <FadeInText>
          {/* Mobile is left-aligned like the workflow copy blocks. At lg the
              BLOCK centers in the page (items-center) but the text inside
              stays left-aligned — a centered column of left-set copy. */}
          <div
            id="intro-statement"
            className="relative z-10 flex flex-col items-start px-4 pb-4 pt-12 text-left md:px-10 lg:items-center lg:px-0 lg:pb-14 lg:pt-6"
          >
            {/* Inner stack owns the shared left edge: the outer flex centers
                THIS box at lg while both text blocks stay left-set and
                left-aligned to each other. */}
            <div className="flex max-w-[52ch] flex-col items-start gap-6">
              <span className="max-w-[32ch] font-main text-2xl font-normal leading-[1.25] tracking-[-0.01em] text-black md:text-3xl">
                Rivet helps designers explore more ideas for the software they
                craft.
              </span>
              <span className="landing-subtext text-black/70">
                It&rsquo;s a tool for generating and viewing dozens of
                different design directions. Use Rivet anytime from the
                agents that you already have set up.
              </span>
            </div>
          </div>
        </FadeInText>

        {/* Desktop first-panel band. SketchGuides draws the workflowTop rule at
            #demo-panel's top and one hugging each panel's visual box; between
            panels the empty band is a section's pb + the next section's pt (128px).
            lg:pt-16 (64) + the first section's pt-16 (64) reproduces that 128px
            band below the workflowTop rule. lg:-mt-8 cancels the parent flex's
            gap-8 so the rule lands 128px above the first panel; the hero copy above
            it is centered between the showcase's bottom rule and this one (see the
            hero block's lg:pt-6 / lg:pb-14). Desktop-only: on mobile each panel's
            copy stacks above its visual box, so that band isn't empty and doesn't
            read as narrow. */}
        <div
          className="bleed-page-gutter-x relative z-10 flex flex-col lg:-mt-8 lg:pt-16"
          id="demo-panel"
        >
          {/* <WorkflowPanels /> */}
          <CommentDemoSection />
          <ReferencesDemoSection />
          {SHOW_VARIANTS_PANEL && <VariantsDemoSection />}
          <AgentTerminalSection />
          {SHOW_MANIFESTO_PANEL && <CodePanel />}
        </div>
        {/* <FeaturePanel /> */}
        {renderDownloadPanel()}
        <div className="relative z-10 -mt-12 lg:mt-0">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default App;
