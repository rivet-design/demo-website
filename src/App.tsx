import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
} from 'react';
import {
  motion,
  useScroll,
  useMotionValueEvent,
  animate,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useVelocity,
  useTransform,
} from 'motion/react';
import { Download } from 'lucide-react';
import { Toaster } from 'sonner';
import NavBar from './components/NavBar';
import SplashScreen from './components/SplashScreen';
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
import HeroShowcaseBackground from './components/HeroShowcaseBackground';
import FloatingShapes from './components/FloatingShapes';
import VariantsShowcase from './components/variantsDemo/VariantsShowcase';
import DirectionsPanel from './components/variantsDemo/DirectionsPanel';
import { useVariantsDemo } from './components/variantsDemo/useVariantsDemo';
import AgentTerminalSection from './components/AgentTerminalSection';
import {
  EMBED_SAFE_VARIANTS,
  MACINTOSH_SYSTEM_ID,
  ORIGINAL_ID,
  VARIANTS,
} from './components/variantsDemo/data';
import AgentTerminal from './components/sandbox/AgentTerminal';
import ReplayButton from './components/ReplayButton';
import { HERO_SESSION } from './components/sandbox/terminalScript';
import { pageBackground, surfaceBackground } from './lib/background';

// Hide the "Made for people who design." manifesto panel (CodePanel). Flip to
// true to restore.
const SHOW_MANIFESTO_PANEL = false;
// Hide the "Explore lots of design directions" panel (VariantsDemoSection).
// Flip to true to restore.
const SHOW_VARIANTS_PANEL = false;
// Hide the "Rivet helps designers explore more ideas..." below-the-fold
// statement. Flip to true to restore.
const SHOW_INTRO_STATEMENT = false;

// Hero agent-chat interaction timing: the floating chat types the prompt + MCP
// tool calls first; the browser window + variant directions stay closed until
// the user scrolls (see showcaseRevealed below), then this is the stagger
// between the window opening and the directions starting to "generate".
const HERO_LOAD_DELAY_MS = 300;

// Embed mode. The preview pane loads THIS app in an iframe, so the embedded
// copy must not run the pinned hero sequence — otherwise it builds another
// prototype container inside itself, and that one embeds another, forever.
// `variant` then picks which treatment that copy renders.
const embedParams =
  typeof window === 'undefined'
    ? null
    : new URLSearchParams(window.location.search);
const IS_EMBED = embedParams?.get('embed') === '1';
const EMBED_VARIANT = embedParams?.get('variant') ?? null;
// Inside an embed the splash plays for exactly one direction — "With splash",
// whose whole point is that beat. Every other direction (Original included)
// drops straight into the hero. Outside an embed the real page always plays it.
const SHOW_SPLASH = !IS_EMBED || EMBED_VARIANT === 'with-splash';
const HERO_TEXT_LEFT = IS_EMBED && EMBED_VARIANT === 'left-aligned';

// Geometry of the live-prototype's decorative panel. The aspect ratio is the
// backdrop art's own (hero-showcase-bg.png, 1409x713) — the art paints
// `bg-contain`, so any other ratio letterboxes it and the window stops fitting
// inside it. Shared by the container and the terminal layer above it so the
// two can't drift apart.
// Sized from --prototype-w (see index.css) rather than from the stage's
// height, so the container can never grow wider than the viewport and the nav
// — which derives its inset from the same variable — stays aligned with it at
// every window size, fullscreen included.
const OUTER_PANEL_BOX =
  'relative flex w-[var(--prototype-w)] aspect-[1409/713] items-center justify-center';

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
  // Hero copy fade-in, synced to the splash screen's lockup landing (not a
  // blind timer — the splash dispatches this the moment it starts shrinking
  // into place) so the fade-from-bottom is already mid-flight, still hidden
  // behind the splash, by the time the splash's own opacity fade reveals it.
  // Seeded from SHOW_SPLASH: the reveal signal is the splash's landing event,
  // so on a load with no splash (the embedded directions) it would never fire
  // and the hero copy would sit at opacity 0 / blur(10px) forever with the
  // showcase never mounting. Same treatment heroLockupVisible already had.
  // A direction is a prototype, not the live site: keep every link hoverable
  // and focusable, but swallow navigation so nothing can sail off to Docs.
  useEffect(() => {
    if (!IS_EMBED) return;
    const swallow = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest('a')) e.preventDefault();
    };
    document.addEventListener('click', swallow, true);
    return () => document.removeEventListener('click', swallow, true);
  }, []);

  const [heroRevealed, setHeroRevealed] = useState(!SHOW_SPLASH);
  useEffect(() => {
    const onSplashLanding = () => setHeroRevealed(true);
    window.addEventListener('rivet:splash-landing', onSplashLanding);
    return () => window.removeEventListener('rivet:splash-landing', onSplashLanding);
  }, []);

  // There must only ever be ONE rivet mark on screen. The splash's backdrop
  // now dissolves DURING its landing (so the headline/CTAs are already
  // blur-fading up underneath while the lockup slides home) — which would
  // otherwise expose the hero's own lockup underneath the travelling one and
  // read as a duplicate. So the hero keeps its lockup hidden until the splash
  // says its copy has landed on top of it, at which point the two are
  // superimposed and the swap is invisible. No splash this load (embed) →
  // visible immediately.
  const [heroLockupVisible, setHeroLockupVisible] = useState(!SHOW_SPLASH);
  useEffect(() => {
    if (!SHOW_SPLASH) return;
    const onLanded = () => setHeroLockupVisible(true);
    window.addEventListener('rivet:splash-lockup-landed', onLanded);
    return () => window.removeEventListener('rivet:splash-lockup-landed', onLanded);
  }, []);

  // Shared entrance for every piece of the hero: blur off + rise into place,
  // all keyed to the same `heroRevealed` signal (the splash's landing) and
  // separated only by a stagger, so the section assembles as one wave rather
  // than several unrelated fades. Expo-out — it arrives fast and settles slow,
  // which is what keeps it feeling like it's decelerating INTO position.
  const heroRise = (delayMs: number): CSSProperties => {
    const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
    const ms = 900;
    return {
      opacity: heroRevealed ? 1 : 0,
      transform: heroRevealed ? 'translateY(0px)' : 'translateY(26px)',
      filter: heroRevealed ? 'blur(0px)' : 'blur(10px)',
      transition:
        `opacity ${ms}ms ${ease} ${delayMs}ms,` +
        `transform ${ms}ms ${ease} ${delayMs}ms,` +
        `filter ${ms}ms ${ease} ${delayMs}ms`,
    };
  };

  // Every visit starts on the full-size hero, never mid-sequence. Browsers
  // restore the previous scroll offset on reload / back-navigation, which
  // would drop someone straight into a half-shrunken card with the agent
  // chat already slid aside — the scroll position IS the animation's
  // playhead here, so restoring it restores a broken-looking frame. Opt out
  // and snap to the top before first paint (useLayoutEffect, not useEffect,
  // so the restored offset never renders). Scrolling itself stays locked
  // until the splash hands off — SplashScreen owns that lock (it sets
  // body overflow:hidden until its own exit completes).
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

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
  const playHeroIntro = motionOK && !isMobileHero && !IS_EMBED;
  const playHeroIntroMobile = motionOK && isMobileHero;

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

  // Desktop showcase reveal: instead of a timer, the browser window + variant
  // directions stay closed — only the floating terminal chat is visible —
  // until the user actually scrolls the page. Mobile's own phase machine
  // (agent → minimizing → editor, below) already stages its hand-off on a
  // timer and is exempt; reduced-motion also bypasses this (nothing to
  // sequence around), landing fully open immediately like the rest of the
  // reduced-motion hero.
  const [showcaseScrolled, setShowcaseScrolled] = useState(false);
  const showcaseRevealed = !playHeroIntro || showcaseScrolled;

  // Scroll-scrubbed hero shrink, in two staged phases (not one continuous
  // blend): the hero card first shrinks+rounds down ALONE (nav fades away
  // with it) to a floating card sized 1.1x the hero-showcase container, then
  // — separately — the nav fades back in from the top while BrowserFrame's
  // chrome (Directions panel + demo) grows in around/behind the card, which
  // itself fades away to hand off to the real content. `runwayPx` is the
  // total scroll distance (px) the whole sequence spans; viewport-relative,
  // recomputed on resize.
  const [runwayPx, setRunwayPx] = useState(() =>
    typeof window === 'undefined' ? 1200 : window.innerHeight * 3.6,
  );
  useEffect(() => {
    const onResize = () => setRunwayPx(window.innerHeight * 3.6);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const { scrollY } = useScroll();
  const heroScrollProgress = useTransform(scrollY, [0, runwayPx], [0, 1], {
    clamp: true,
  });
  // Generalizes the old REVEAL_SCROLL_PX=24 binary threshold into a
  // continuous ramp: the showcase now "opens" the moment scroll starts
  // (progress > 0) instead of a raw scrollY compare. Everything downstream
  // (chat slide, mobile phase machine) only ever cared about the
  // showcaseScrolled boolean, so only its source changes here.
  // Once the card has shrunk past beat 1 it is no longer the live page — it
  // is the CONTENT of the prototype. Links inside it must still look and feel
  // alive (hover, cursor, focus all untouched) but must not navigate: it's a
  // mock of the site, not the site.
  const [cardIsPreview, setCardIsPreview] = useState(false);
  // Gates the Directions "generation" on the container actually being on
  // screen. Starting it at first scroll (showcaseScrolled) meant the ~2.8s
  // skeleton sequence ran during the shrink, so by the time the container
  // faded in it had already resolved and the loading state was never seen.
  const [containerReached, setContainerReached] = useState(false);
  useMotionValueEvent(heroScrollProgress, 'change', (p) => {
    if (p > 0 && !showcaseScrolled) setShowcaseScrolled(true);
    const preview = p > SHRINK_END;
    setCardIsPreview((was) => (was === preview ? was : preview));
    if (p >= SHRINK_END && !containerReached) setContainerReached(true);
  });

  // Storyboard beats along heroScrollProgress (0 → 1):
  //   [0, SHRINK_END]          frame 1 → 2: the ENTIRE hero composition (nav,
  //                            copy, showcase, floating chat) scales down as
  //                            ONE group into a rounded card sitting on the
  //                            #fafafa ground.
  //   [SHRINK_END, PHASE2_END] frame 2 → 3: the browser frame expands in and
  //                            the card slides right into its preview pane.
  const SHRINK_END = 0.22;
  const PHASE2_END = 0.42;
  // From here the rest of the scroll cycles through the directions.
  const CYCLE_START = 0.5;

  // The whole-page card. CARD_SCALE leaves the even margin of #fafafa on
  // every side that storyboard frame 2 shows; scaling about the card's own
  // centre keeps the composition's internal layout completely untouched —
  // this is a GROUP shrink ("the page gets smaller"), not several elements
  // FLIP-ing toward a shared landing rect ("everything collapses onto one
  // spot"), which is what the previous pass did and why it never read right.
  const CARD_SCALE = 0.84;

  // --- Frame 2 → 3: the card falls INTO a new live-prototype container -----
  // A second BrowserFrame (a dupe of the hero's own: window chrome + the
  // Directions panel) fades in behind the card, and the card then flies into
  // its empty preview pane. The landing geometry is measured, not guessed —
  // the pane's rect vs the stage's rect gives the exact scale + centre-to-
  // centre delta, so the card lands flush inside the pane at any viewport.
  const stageRef = useRef<HTMLDivElement>(null);
  const [outerPaneEl, setOuterPaneEl] = useState<HTMLDivElement | null>(null);
  // Drives the preview pane's aspect-ratio so it is a true scale model of the
  // viewport — that is what lets the page land in it with nothing cropped and
  // nothing letterboxed.
  const [stageAspect, setStageAspect] = useState(16 / 9);
  // The stage's real pixel size. The preview iframe is laid out at exactly
  // these dimensions and then scaled down, so the embedded page resolves the
  // SAME viewport width — and therefore the same breakpoints, type sizes and
  // layout — as the page you're looking at. Sizing the iframe to the pane
  // instead makes it lay out as a ~950px-wide viewport, which is why the
  // "Original" direction didn't match the hero.
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });
  const [landing, setLanding] = useState({
    dx: 0,
    dy: 0,
    scale: CARD_SCALE,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  useEffect(() => {
    if (!playHeroIntro || !outerPaneEl) return;
    const measure = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const s = stage.getBoundingClientRect();
      const p = outerPaneEl.getBoundingClientRect();
      if (!s.width || !p.width) return;
      setStageAspect(s.width / s.height);
      setStageSize((prev) =>
        prev.w === s.width && prev.h === s.height
          ? prev
          : { w: s.width, h: s.height },
      );
      setLanding({
        // COVER, not contain. Fitting to width alone left the pane's top and
        // bottom empty whenever the pane is proportionally taller than the
        // viewport (it always is — the Directions panel eats 340px of width
        // but no height). Taking the larger of the two ratios makes the page
        // fill the pane edge to edge; the overflow on the other axis is
        // clipped by cardClip below, which is pinned to this same rect.
        // Width-fit. The pane is given the STAGE's own aspect ratio below, so
        // fitting width also fits height — no letterbox gaps, and crucially no
        // overflow to clip, which is what was cutting the nav off the top when
        // this was a Math.max cover.
        scale: p.width / s.width,
        dx: p.left + p.width / 2 - (s.left + s.width / 2),
        dy: p.top + p.height / 2 - (s.top + s.height / 2),
        top: p.top - s.top,
        right: s.right - p.right,
        bottom: s.bottom - p.bottom,
        left: p.left - s.left,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);
    ro.observe(outerPaneEl);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [playHeroIntro, outerPaneEl]);

  // Beat 1 shrinks the card IN PLACE (no translation — it must not drift);
  // only beat 2 moves it, into the new container's preview pane.
  const cardScale = useTransform(
    heroScrollProgress,
    [0, SHRINK_END, PHASE2_END],
    [1, CARD_SCALE, landing.scale],
    { clamp: true },
  );
  const cardX = useTransform(
    heroScrollProgress,
    [0, SHRINK_END, PHASE2_END],
    [0, 0, landing.dx],
    { clamp: true },
  );
  const cardY = useTransform(
    heroScrollProgress,
    [0, SHRINK_END, PHASE2_END],
    [0, 0, landing.dy],
    { clamp: true },
  );
  // The card clips to the landing pane during beat 2. Separate numeric
  // transforms (not one closure-based transformer) so a re-measured `landing`
  // is picked up on the next render, then composed into the clip-path string.
  // clip-path lives on a NON-transformed wrapper: on the card itself it would
  // be scaled by the card's own transform and stop matching the pane.
  const clipTop = useTransform(
    heroScrollProgress, [SHRINK_END, PHASE2_END], [0, landing.top], { clamp: true },
  );
  const clipRight = useTransform(
    heroScrollProgress, [SHRINK_END, PHASE2_END], [0, landing.right], { clamp: true },
  );
  const clipBottom = useTransform(
    heroScrollProgress, [SHRINK_END, PHASE2_END], [0, landing.bottom], { clamp: true },
  );
  const clipLeft = useTransform(
    heroScrollProgress, [SHRINK_END, PHASE2_END], [0, landing.left], { clamp: true },
  );
  const cardClip = useMotionTemplate`inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px)`;

  // Rounds as the page shrinks into a floating card, then unrounds again as
  // it enters the chrome container — inside the preview pane it's a browser
  // viewport, and browser viewports have square corners.
  const CARD_RADIUS = 28;
  const cardRadius = useTransform(
    heroScrollProgress,
    [0, SHRINK_END, PHASE2_END],
    [0, CARD_RADIUS, 0],
    { clamp: true },
  );

  // The new container fades in right after the shrink settles, so it's
  // already sitting there waiting when the card starts flying into it.
  const outerFrameOpacity = useTransform(
    heroScrollProgress,
    [SHRINK_END, SHRINK_END + 0.08],
    [0, 1],
    { clamp: true },
  );
  // ...and scales up as it fades, so it grows into place rather than just
  // appearing. The first stop is 1, not 0.92, ON PURPOSE: the landing rect is
  // measured off this subtree with getBoundingClientRect, which includes
  // transforms, and that measurement runs at mount (progress 0). Starting at 1
  // keeps the measurement honest; the dip to 0.92 happens entirely while
  // opacity is still 0, so it's never seen.
  const outerFrameScale = useTransform(
    heroScrollProgress,
    [0, SHRINK_END, SHRINK_END + 0.08],
    [1, 0.92, 1],
    { clamp: true },
  );
  // The brand blobs SLIDE in from the side instead of fading — they're loose
  // objects drifting into frame, not part of the container's dissolve. One
  // offset drives both sides: FloatingShapes negates it for shapes on the left
  // half, so each blob enters from its OWN nearest edge.
  const blobsX = useTransform(
    heroScrollProgress,
    // AFTER the hero has landed in the pane (PHASE2_END), not alongside the
    // container's own entrance — they're the last decorative beat, drifting in
    // around a composition that has already settled.
    [PHASE2_END, PHASE2_END + 0.06],
    [160, 0],
    { clamp: true },
  );

  // Scrolling back UP should not replay the choreography in reverse — it
  // should just get out of the way. Negative velocity blurs and dims the
  // prototype so it dissolves instead of un-building itself step by step;
  // springs keep it from popping at the direction change.
  const scrollVelocity = useVelocity(heroScrollProgress);
  // Gated to the BUILD region only (before CYCLE_START). Un-building the
  // container back into the hero is the one transition that should dissolve
  // rather than reverse; stepping back through the directions is a normal
  // selection change and should stay clean, so left-aligned → with-splash →
  // original reads as smooth iteration, not a blur every time.
  const reverseBlurRaw = useTransform(
    [scrollVelocity, heroScrollProgress],
    (vals: number[]) =>
      vals[1] < CYCLE_START && vals[0] < 0
        ? Math.min(-vals[0] * 12, 10)
        : 0,
  );
  const reverseBlur = useSpring(reverseBlurRaw, { stiffness: 500, damping: 45 });
  const outerFilter = useMotionTemplate`blur(${reverseBlur}px)`;
  const reverseFadeRaw = useTransform(
    [scrollVelocity, heroScrollProgress],
    (vals: number[]): number =>
      vals[1] < CYCLE_START && vals[0] < 0 ? 0.4 : 1,
  );
  const reverseFade = useSpring(reverseFadeRaw, { stiffness: 500, damping: 45 });
  const outerOpacity = useTransform(
    [outerFrameOpacity, reverseFade],
    (v: number[]) => v[0] * v[1],
  );
  // The terminal arrives after the container has settled — it's the last beat,
  // not part of the container's own entrance.
  const terminalOpacityRaw = useTransform(
    heroScrollProgress,
    [SHRINK_END + 0.14, SHRINK_END + 0.24],
    [0, 1],
    { clamp: true },
  );
  const terminalOpacity = useTransform(
    [terminalOpacityRaw, reverseFade],
    (v: number[]) => v[0] * v[1],
  );

  // Its own Directions list — same data/behaviour as the hero's panel.
  const outerCtrl = useVariantsDemo({
    start: containerReached,
    initialId: ORIGINAL_ID,
    autoPlay: false,
    startDelayMs: 200,
  });
  // "Original" IS this hero — so for that direction the landed card simply
  // stays as the preview's content. Nothing swaps in, nothing crossfades,
  // nothing can drift out of sync: it can't differ from the hero because it
  // is the hero. Only the other directions hand off to a real iframe. Driven
  // by SELECTION rather than scroll position, so Original looks identical no
  // matter where in the scroll you are.
  const isOriginalDirection = outerCtrl.selectedId === ORIGINAL_ID;
  const originalMix = useMotionValue(1);
  useEffect(() => {
    animate(originalMix, isOriginalDirection ? 1 : 0, {
      duration: 0.25,
      ease: 'easeOut',
    });
  }, [isOriginalDirection, originalMix]);
  const previewOpacity = useTransform(originalMix, (v) => 1 - v);
  // ...and the card must stop swallowing pointer events once it has faded.
  // opacity:0 still hit-tests, and the card is clipped to exactly the preview
  // pane at z-10 — so without this it sits invisibly on top of the iframe and
  // every direction except Original loses hover, cursor and click entirely.
  const cardPointerEvents = useTransform(originalMix, (v) =>
    v > 0.5 ? 'auto' : 'none',
  );

  // Past the handoff, the remaining scroll steps through the directions — the
  // run "generating" in front of you rather than something you have to click.
  // Manual clicks still work: the next scroll step simply takes over again.
  useMotionValueEvent(heroScrollProgress, 'change', (p) => {
    // Scrolling back out of the cycle region returns to Original — otherwise
    // the last-selected direction stays chosen, the card stays at opacity 0,
    // and the shrink would replay in reverse with nothing visible in it.
    if (p < CYCLE_START) {
      if (outerCtrl.selectedId !== ORIGINAL_ID) outerCtrl.select(ORIGINAL_ID);
      return;
    }
    // Nothing to cycle through until the run has finished "generating" —
    // scrolling during the load state would skip past directions that are
    // still skeletons.
    if (outerCtrl.readyIds.size < VARIANTS.length) return;
    const t = (p - CYCLE_START) / (1 - CYCLE_START);
    const i = Math.min(
      VARIANTS.length - 1,
      Math.max(0, Math.floor(t * VARIANTS.length)),
    );
    const next = VARIANTS[i].id;
    if (next !== outerCtrl.selectedId) outerCtrl.select(next);
  });

  // The page's OWN nav slides back down as the sequence settles. The NavBar
  // inside the card flew off into the preview pane with the rest of the page,
  // so without this there is simply no nav left once the card has landed.
  const pageNavOpacity = useTransform(
    heroScrollProgress,
    [PHASE2_END - 0.08, PHASE2_END],
    [0, 1],
    { clamp: true },
  );
  const pageNavY = useTransform(
    heroScrollProgress,
    [PHASE2_END - 0.08, PHASE2_END],
    [-72, 0],
    { clamp: true },
  );


  // Bumped by the hero's replay button: keys the intro players/window so they
  // remount, and restarts the scripted typing.
  const [heroRun, setHeroRun] = useState(0);
  // The agent chat stays CENTERED in the showcase for its whole life — it's
  // the thing driving the demo, so it holds the middle rather than being
  // demoted to a corner. (It used to slide off to the right ~900ms after the
  // showcase opened; that choreography is gone.) The user can still drag it
  // anywhere — see chatPos below, which overrides this centering once grabbed.

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
    // Drops any drag the user did, so replay re-centers the chat.
    setChatPos(null);
    setOuterChatPos(null);
    setOuterChatClosed(false);
    setMobilePhase(playHeroIntroMobile ? 'agent' : 'editor');
    setHeroRun((n) => n + 1);
  };

  // --- Draggable chat ------------------------------------------------------
  // Once the user grabs the chat, `chatPos` pins it at explicit pixel
  // coordinates (top-left, relative to the hero showcase) and the default
  // class-based centering no longer applies. Replay resets it to null so the
  // chat returns to centre.
  const heroShowcaseRef = useRef<HTMLDivElement>(null);
  const chatWrapRef = useRef<HTMLDivElement>(null);

  const [chatPos, setChatPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [chatDragging, setChatDragging] = useState(false);
  const outerChatWrapRef = useRef<HTMLDivElement>(null);
  const outerPanelRef = useRef<HTMLDivElement>(null);
  const [outerChatPos, setOuterChatPos] = useState<{ x: number; y: number } | null>(null);
  const [outerChatDragging, setOuterChatDragging] = useState(false);
  const [outerChatClosed, setOuterChatClosed] = useState(false);
  const outerChatDragCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => outerChatDragCleanup.current?.(), []);
  const chatDragCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => chatDragCleanup.current?.(), []);
  // Shared by the hero's own chat and the terminal floating above the live
  // prototype: identical grab/clamp/cleanup, only the element and the box it
  // is clamped inside differ.
  const beginDrag = (
    e: React.PointerEvent,
    wrap: HTMLElement | null,
    bounds: HTMLElement | null,
    setPos: (p: { x: number; y: number }) => void,
    setDragging: (v: boolean) => void,
    cleanupRef: React.MutableRefObject<(() => void) | null>,
  ) => {
    if (e.button !== 0) return;
    if (!wrap || !bounds) return;
    e.preventDefault();
    cleanupRef.current?.();
    const rect = wrap.getBoundingClientRect();
    const heroRect = bounds.getBoundingClientRect();
    const grabX = e.clientX - rect.left;
    const grabY = e.clientY - rect.top;
    setDragging(true);
    const onMove = (ev: PointerEvent) => {
      const x = Math.min(
        Math.max(ev.clientX - heroRect.left - grabX, 0),
        heroRect.width - rect.width,
      );
      const y = Math.min(
        Math.max(ev.clientY - heroRect.top - grabY, 0),
        heroRect.height - rect.height,
      );
      setPos({ x, y });
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      cleanupRef.current = null;
    };
    const end = () => {
      cleanup();
      setDragging(false);
    };
    cleanupRef.current = cleanup;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  const startChatDrag = (e: React.MouseEvent & React.PointerEvent) =>
    beginDrag(
      e,
      chatWrapRef.current,
      heroShowcaseRef.current,
      setChatPos,
      setChatDragging,
      chatDragCleanup,
    );

  // The prototype-driving terminal is clamped to the decorative panel it is
  // clipped to, so it can never be dragged out of its own backdrop.
  const startOuterChatDrag = (e: React.MouseEvent & React.PointerEvent) =>
    beginDrag(
      e,
      outerChatWrapRef.current,
      outerPanelRef.current,
      setOuterChatPos,
      setOuterChatDragging,
      outerChatDragCleanup,
    );
  // During the agent phase the editor isn't mounted yet; it takes over once the
  // agent has minimized out.
  const showMobileAgent = playHeroIntroMobile && mobilePhase !== 'editor';

  const renderDownloadPanel = () => {
    return (
      <div id="install-panel" className="relative z-10 hidden flex-col items-center py-16 lg:flex">
        <div className="flex flex-col gap-6">
          <h2 className="hero-title-size text-center font-main font-normal leading-[1.12]">
            Built for designers on the frontier
            <br /> of code and design.
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
        {/* Rebuilt to match Figma (node 796:721) directly: lockup, single
            auto-wrapping headline, Watch Demo / Quick install now CTAs.
            Deliberately not touching #hero-showcase below — same demo
            (BrowserFrame + VariantsShowcase / mobile AgentTerminal) as
            before. */}
        <div
          className={`flex flex-col gap-[22px] ${
            HERO_TEXT_LEFT ? 'items-start text-left' : 'items-center text-center'
          }`}
        >
          {/* Hero lockup — icon + wordmark-text, same two canonical assets
              and the same icon:gap:text ratios (lib/rivetLockup.ts) the
              splash screen uses, so the splash's landing FLIP scales onto a
              proportion-matching target. SplashScreen looks up #hero-lockup
              via getBoundingClientRect for its final scale-down.
              Hidden (opacity only — it must stay measurable for that FLIP,
              so never display:none) until the splash's own copy has landed
              on top of it, so the two never read as two marks at once. */}
          <div
            id="hero-lockup"
            className="flex items-center gap-1"
            style={{ opacity: heroLockupVisible ? 1 : 0 }}
          >
            <img
              src="/images/rivet-icon-mark.svg"
              alt=""
              draggable={false}
              className="h-7 w-7 md:h-8 md:w-8"
            />
            <img
              src="/images/rivet-wordmark-text.svg"
              alt="Rivet"
              draggable={false}
              className="h-[23px] w-auto md:h-[26px]"
            />
          </div>

          {/* Headline + CTAs: fades in from below, timed to the splash's
              lockup landing (see the rivet:splash-landing listener above)
              rather than a blind timer, so it's already mid-animation by
              the time the splash's own fade reveals the page. */}
          <div
            className={`flex flex-col gap-[22px] ${
              HERO_TEXT_LEFT ? 'items-start' : 'items-center'
            }`}
          >
            <span
              style={heroRise(0)}
              // hero-title-size is a formula sized to fill the FULL padded
              // page width, so it overflows a 42% column. The left-aligned
              // direction gets a column-relative clamp instead, and drops the
              // hard <br/> so the headline wraps naturally to three lines the
              // way the reference does.
              className={`hero-title-text font-main font-normal normal-case leading-[1.08] tracking-[-0.02em] text-black ${
                HERO_TEXT_LEFT
                  ? 'text-[clamp(1.75rem,12cqw,4rem)]'
                  : 'hero-title-size leading-[1.164]'
              }`}
            >
              {HERO_TEXT_LEFT ? (
                <>
                  Explore dozens of
                  <br />
                  design directions
                  <br />
                  from your agent.
                </>
              ) : (
                <>
                  Explore dozens of design
                  <br />
                  directions from your agent.
                </>
              )}
            </span>

            <div
              style={heroRise(110)}
              className={`flex items-center gap-[15px] ${
                HERO_TEXT_LEFT ? 'self-start' : ''
              }`}
            >
              <a
                href="#hero-showcase"
                // Jumping to an anchor that's already in view may not move
                // scrollY past the reveal threshold, so force the showcase
                // open directly rather than relying on the scroll listener.
                onClick={() => setShowcaseScrolled(true)}
                className="flex w-[142px] items-center justify-center rounded-lg border-[0.5px] border-[#642e39] bg-[#f1efe8] p-[10px] font-aileron text-base leading-[1.164] tracking-[-0.16px] text-[#642e39] transition-colors hover:bg-[#642e39]/5"
              >
                Watch Demo
              </a>
              <a
                href="#install-panel"
                className="flex w-[199px] items-center justify-center gap-[10px] rounded-lg p-[10px] font-aileron text-base leading-[1.164] tracking-[-0.16px] text-white transition-opacity hover:opacity-90"
                style={{
                  backgroundImage:
                    'linear-gradient(137.74deg, rgb(236, 68, 35) 41.128%, rgb(243, 138, 118) 121.74%)',
                }}
              >
                <Download className="h-4 w-4" strokeWidth={2} />
                Quick install now
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <>
      {SHOW_SPLASH && <SplashScreen />}
      <Toaster position="bottom-right" theme="dark" duration={8000} />
      {/* Paper texture behind all content. Applied to the scrolling container
          (not fixed) so it travels with the page; tiled vertically to cover the
          full scroll height at the same horizontal scale across the viewport. */}
      <div
        className={`page-gutter-x relative flex min-h-screen flex-col gap-8 ${pageBackground.className}`}
        style={pageBackground.style}
      >
        {/* The page's own nav. Fixed (not sticky, and outside the pin
            spacer) for two reasons: it must not consume flow space at the top
            or it would push the h-screen stage down out of the viewport, and
            it has to keep sitting above the stage once the stage unpins.
            page-gutter-x on the wrapper because NavBar's own
            bleed-page-gutter-x cancels exactly that padding. */}
        {playHeroIntro && (
          <motion.div
            style={{ opacity: pageNavOpacity, y: pageNavY }}
            className="page-gutter-x fixed inset-x-0 top-0 z-[60]"
          >
            <NavBar />
          </motion.div>
        )}

        {/* Pin spacer + sticky stage: the entire hero sequence (nav shrink,
            hero-card shrink, BrowserFrame fall-into-place) plays out while
            this stage stays visually fixed in the viewport — the spacer's
            extra height (runwayPx) is the scroll distance consumed while
            pinned; once exhausted, the stage unpins and normal in-flow
            scrolling continues below. Degrades to a plain (non-pinned,
            natural-height) wrapper for mobile/reduced-motion, where none of
            this animates. */}
        <div
          // Full-bleed on the intro path: the #fafafa ground of storyboard
          // frame 2 fills the viewport, and the card needs the full width so
          // NavBar's own `bleed-page-gutter-x` and FloatingShapes' overflow
          // have somewhere to go that isn't outside the card's clip box.
          className={playHeroIntro ? 'bleed-page-gutter-x' : undefined}
          style={
            playHeroIntro ? { height: `calc(100vh + ${runwayPx}px)` } : undefined
          }
        >
          <div
            className={
              playHeroIntro
                ? 'sticky top-0 flex h-screen flex-col overflow-hidden'
                : 'flex flex-col gap-8'
            }
            ref={stageRef}
            // The neutral ground revealed around the card as the whole page
            // scales down (storyboard frame 2).
            style={playHeroIntro ? { backgroundColor: '#fafafa' } : undefined}
          >
            {/* THE NEW LIVE-PROTOTYPE CONTAINER — a dupe of the hero's own
                demo shell (window chrome + Directions panel), sitting behind
                the card. It fades in once the shrink settles, then the card
                flies into its empty preview pane on the right. Rendered even
                while invisible so its pane can be measured as the card's
                landing target. */}
            {playHeroIntro && (
              <motion.div
                style={{ opacity: outerOpacity, filter: outerFilter }}
                className="absolute inset-0 z-0 flex items-center justify-center"
              >
                {/* Same decorative shell the hero's own demo sits in — the
                    striped backdrop and the drifting brand shapes — so the
                    live prototype reads as being inside the page's container
                    rather than floating on a bare surface. Sized well inside
                    the stage so the container reads as a panel ON the page.
                    Children pin themselves `absolute inset-0` against it. */}
                {/* The decorative panel is given the BACKDROP ART's own
                    aspect ratio (hero-showcase-bg.png is 1409x713). The art
                    is painted `bg-contain`, so any other ratio letterboxes it
                    inside this box — which is how the window ended up wider
                    than the art behind it. Matching the ratio makes panel box
                    == art box, so a percentage-sized window is guaranteed to
                    sit inside the art. `z-0` so the backdrop's own `-z-10`
                    stays trapped in this stacking context instead of sliding
                    behind the stage's #fafafa. */}
                <div className={`z-0 ${OUTER_PANEL_BOX}`}>
                  {/* Backdrop + window scale up together as they fade in. */}
                  <motion.div style={{ scale: outerFrameScale }} className="absolute inset-0">
                    <HeroShowcaseBackground />
                  </motion.div>
                  {/* Blobs SLIDE in, each from its own nearest edge. */}
                  <motion.div
                    style={{ scale: outerFrameScale }}
                    className="relative z-10 flex w-[89%] justify-center"
                  >
                  <BrowserFrame url="localhost:4000" className="w-full">
                  <div className="flex w-full">
                    <div className="relative w-[26%] shrink-0">
                      <DirectionsPanel ctrl={outerCtrl} desktop />
                    </div>
                    {/* The card's landing pane — deliberately empty; the
                        shrunken page itself becomes this preview's content.
                        Its aspect ratio IS the viewport's, so the landing page
                        fills it exactly: no crop, no letterbox. The frame's
                        height follows from this rather than being set. */}
                    <div
                      ref={setOuterPaneEl}
                      className="relative min-w-0 flex-1 overflow-hidden bg-white"
                      style={{ aspectRatio: String(stageAspect) }}
                    >
                      {/* The live direction. `key` on src so switching
                          directions remounts rather than reusing the previous
                          document, and the Original variant replays its splash
                          the way a fresh load would. */}
                      {!isOriginalDirection && (
                      <motion.iframe
                        key={outerCtrl.selected.src}
                        src={outerCtrl.selected.src}
                        title={outerCtrl.selected.label}
                        // Never let the preview trap the page's wheel scroll —
                        // the whole sequence is scroll-driven.
                        scrolling="no"
                        style={{
                          opacity: previewOpacity,
                          width: stageSize.w || '100%',
                          height: stageSize.h || '100%',
                          transform: `scale(${landing.scale})`,
                          transformOrigin: 'top left',
                        }}
                        className="absolute left-0 top-0 border-0"
                      />
                      )}
                    </div>
                  </div>
                </BrowserFrame>
                  </motion.div>

                </div>
              </motion.div>
            )}

            {/* The brand blobs, as their own layer ABOVE the terminal (z-40 vs
                z-30). They can't stay inside the container: that layer is z-0,
                so the card and the terminal both composite over them and the
                terminal ended up sitting on top of the right-hand cluster.
                Same OUTER_PANEL_BOX geometry, so they land exactly where they
                did — just on top. No overflow-hidden: these are meant to
                overhang the panel's edges. */}
            {playHeroIntro && (
              <motion.div
                style={{ opacity: outerOpacity, filter: outerFilter }}
                className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
              >
                <div className={OUTER_PANEL_BOX}>
                  <FloatingShapes offsetX={blobsX} />
                </div>
              </motion.div>
            )}

            {/* The agent terminal — the thing DRIVING the prototype, so it
                has to read as the topmost object. It cannot live inside the
                container above: that layer is z-0 and the page card is z-10,
                so anything nested in it composites UNDER the card no matter
                how high its local z-index goes. Same OUTER_PANEL_BOX geometry
                with its own overflow-hidden, so it stays clipped to the
                decorative backdrop exactly as before — just above the card. */}
            {playHeroIntro && !outerChatClosed && (
              <motion.div
                style={{ opacity: terminalOpacity, filter: outerFilter }}
                className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
              >
                <div ref={outerPanelRef} className={`${OUTER_PANEL_BOX} overflow-hidden`}>
                  {/* pointer-events-auto: the layer above is deliberately
                      pass-through so it doesn't swallow clicks on the page
                      behind it, but the terminal itself must receive them to
                      be grabbable. Once dragged, `outerChatPos` pins it in
                      explicit px and the resting bottom/right placement no
                      longer applies — same contract as the hero's chat. */}
                  <div
                    ref={outerChatWrapRef}
                    onPointerDown={startOuterChatDrag}
                    className={`pointer-events-auto absolute hidden h-[300px] w-[380px] touch-none select-none lg:block ${
                      outerChatDragging ? 'cursor-grabbing' : 'cursor-grab'
                    } ${outerChatPos ? '' : 'bottom-[6%] right-[5%]'}`}
                    style={
                      outerChatPos
                        ? { left: outerChatPos.x, top: outerChatPos.y }
                        : undefined
                    }
                  >
                    <AgentTerminal
                      key={`outer-${heroRun}`}
                      compact
                      loop={false}
                      script={HERO_SESSION}
                      onClose={() => setOuterChatClosed(true)}
                      className="pointer-events-none h-full w-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* THE PAGE CARD. Nav, hero copy, showcase and the floating chat
                all live inside this one wrapper so they scale down TOGETHER,
                keeping their relative layout — that is what reads as "the
                whole page shrinks". `display: contents` on every other path
                (mobile / reduced-motion) dissolves the wrapper entirely, so
                those layouts are byte-for-byte what they were. */}
            <motion.div
              // Clip-only wrapper, never transformed: during beat 2 it closes
              // down onto the landing pane's rect so the covering card is
              // trimmed to exactly the pane. Square corners throughout — the
              // shrinking hero keeps its own edges.
              style={playHeroIntro ? { clipPath: cardClip } : undefined}
              className={
                playHeroIntro
                  ? 'pointer-events-none absolute inset-0 z-10'
                  : 'contents'
              }
            >
            <motion.div
              // Capture phase, so it runs before the anchor's own default and
              // before any child handler. Only swallows NAVIGATION — hover,
              // focus and cursor styling are all untouched, so the prototype
              // still feels live.
              onClickCapture={
                playHeroIntro && cardIsPreview
                  ? (e: React.MouseEvent) => {
                      if ((e.target as HTMLElement).closest('a')) {
                        e.preventDefault();
                      }
                    }
                  : undefined
              }
              style={
                playHeroIntro
                  ? {
                      x: cardX,
                      y: cardY,
                      scale: cardScale,
                      borderRadius: cardRadius,
                      opacity: originalMix,
                      pointerEvents: cardPointerEvents,
                      ...surfaceBackground,
                    }
                  : undefined
              }
              className={
                playHeroIntro
                  ? 'page-gutter-x relative flex h-full w-full flex-col gap-6 overflow-hidden'
                  : 'contents'
              }
            >
            <NavBar />
            {/* Hero copy gets 3x the horizontal padding of the content panels
                (p-4/sm:p-6/lg:p-8 → px-12/sm:px-[4.5rem]/lg:px-24), symmetric on
                both ends. The hero-title-text font formula subtracts this same
                12rem (lg) so the two-line title exactly fills the padded width.
                py-8 doubles the block's effective vertical spacing below (page
                column's gap-8 + this py-8 = 4rem); -mt-8 cancels that same gap-8
                above so the block sits closer under the nav than it does above
                the showcase. */}
            {/* The "Left aligned" direction is a genuine two-column hero —
                copy on the left, showcase on the right — not just left-set
                text. `contents` everywhere else dissolves this wrapper so the
                default stacked layout is untouched. */}
            <div
              className={
                HERO_TEXT_LEFT
                  ? 'bleed-page-gutter-x relative flex flex-1 items-center gap-[10%] px-[var(--prototype-inset-x)]'
                  : 'contents'
              }
            >
            {HERO_TEXT_LEFT && (
              <div className="pointer-events-none fixed inset-0 z-[80]">
                <FloatingShapes leftAlignedLayout />
              </div>
            )}
            <div
              style={
                HERO_TEXT_LEFT ? { containerType: 'inline-size' } : undefined
              }
              className={
                HERO_TEXT_LEFT
                  ? 'relative z-40 w-[30%] shrink-0'
                  : 'relative z-40 -mt-6 flex w-full shrink-0 items-start justify-start overflow-hidden px-12 py-6 sm:px-[4.5rem] lg:px-24'
              }
            >
              {renderHeroText()}
            </div>

            <div
              id="hero-showcase"
              ref={heroShowcaseRef}
              // Last in the entrance wave, after the headline and the CTAs.
              style={heroRise(220)}
              className={
                HERO_TEXT_LEFT
                  ? 'relative z-10 w-[60%] shrink-0 aspect-[821/559]'
                  : 'relative z-10 flex w-full shrink-0 justify-center p-3 sm:p-4 lg:p-6'
              }
            >
              {/* Decorative backdrop. It stays visible throughout — storyboard
                  frame 2 shows the gradient art still inside the shrunken
                  card, so it scales with the group rather than fading out.
                  Plain (non-positioned) wrapper so the children's own
                  `absolute inset-0` still resolves against #hero-showcase. */}
              <div>
                {/* Decorative backdrop — a static flattened export for now (see
                    HeroShowcaseBackground). */}
                <HeroShowcaseBackground
                  src={
                    HERO_TEXT_LEFT
                      ? '/images/hero-showcase-bg-left.png'
                      : undefined
                  }
                />

                {/* Loose brand shapes drifting around the showcase's edges. */}
                {!HERO_TEXT_LEFT && <FloatingShapes />}
              </div>

          {/* The whole live demo — chat typing, window open, directions
              generating — only mounts once the splash has handed off
              (heroRevealed, same rivet:splash-landing signal the hero copy
              uses). Each piece below times its own intro off its OWN mount,
              so mounting it early would burn that choreography while it's
              still hidden behind the splash. */}
          {!HERO_TEXT_LEFT && heroRevealed && (showMobileAgent ? (
            // Mobile intro: the agent window types the request + MCP calls on its
            // own (full hero box), then minimizes to hand off to the editor.
            // pointer-events-none: the transcript is an overflow-y-auto region
            // that would otherwise trap touch scrolling — on mobile a swipe over
            // the hero must always scroll the page (auto-scroll still works).
            <div
              className="pointer-events-none w-full"
              style={{ height: '58vh', minHeight: 440 }}
            >
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
              // Desktop-only: the title bar's touch-none drag handle would
              // swallow page-scroll swipes on mobile.
              draggable={!isMobileViewport}
              animateOpen
              // On the desktop intro path this INNER demo window stays closed
              // for the whole pinned sequence: the storyboard's shrunken page
              // shows only the decorative backdrop + the agent chat, and the
              // live prototype the viewer ends up interacting with is the NEW
              // outer container (above), not this one. Other paths (mobile,
              // reduced-motion) open it exactly as before.
              start={playHeroIntro || IS_EMBED ? false : showcaseRevealed}
              className="w-full"
            >
              <VariantsShowcase
                // Smaller specifically on the desktop scroll-FLIP path: nav +
                // hero-card + this all need to fit within one h-screen
                // pinned stage, and 58vh leaves no headroom for the rest —
                // measured out at roughly nav(~84px) + hero-card(~280px) +
                // gaps(~64px) + this + chrome, which only clears 100vh at
                // this smaller height on typical viewports. Unaffected
                // elsewhere (reduced-motion desktop, mobile-portrait), which
                // aren't inside the h-screen pinned stage at all.
                heightClassName={
                  playHeroIntro
                    ? 'h-[42vh] min-h-[360px]'
                    : 'h-[58vh] min-h-[440px]'
                }
                // Mobile cycles through the options on its own (no directions
                // panel) and renders each variant's portrait (mobile-first)
                // layout; desktop stays pinned, shows the panel, and uses the
                // 1280px layout. Driven by the reactive viewport flag so a
                // resize across 1024px switches layouts to match.
                autoPlay={isMobileViewport && motionOK}
                showDirections={!isMobileViewport}
                portrait={isMobileViewport}
                autoAdvanceMs={2000}
                // Inside an embed the self-referencing directions are
                // filtered out and the wildcard becomes the default, so an
                // embedded copy can never load this app inside itself.
                variants={IS_EMBED ? EMBED_SAFE_VARIANTS : undefined}
                initialVariantId={IS_EMBED ? MACINTOSH_SYSTEM_ID : ORIGINAL_ID}
                loadDelayMs={HERO_LOAD_DELAY_MS}
                start={showcaseRevealed}
              />
            </BrowserFrame>
          ))}

          {/* Floating agent chat that "drives" the demo: it types the prompt +
              Rivet MCP tool calls, then the window opens and the directions
              generate and fade in. It stays CENTERED in the showcase for its
              whole life and never minimizes or unmounts — the finished
              transcript is a permanent fixture of the hero composition. The
              user can still grab and move it anywhere within the hero
              (clamped to the showcase); once dragged, chatPos overrides the
              centering until replay resets it.
              Hidden on small screens where the hero is already tight. */}
          {(playHeroIntro || IS_EMBED) && heroRevealed && (
            <div
              ref={chatWrapRef}
              onPointerDown={startChatDrag}
              className={`absolute z-20 hidden touch-none select-none lg:block ${
                HERO_TEXT_LEFT
                  ? 'h-[76%] w-[66%]'
                  : 'h-[240px] w-[300px] lg:h-[300px] lg:w-[380px]'
              } ${
                chatDragging ? 'cursor-grabbing' : 'cursor-grab'
              } ${
                chatPos ? '' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
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
            </div>
            </motion.div>
            </motion.div>

          </div>
        </div>

        {/* Everything below the hero is omitted in embed mode: a direction is
            a preview OF THE HERO, and the sections underneath would otherwise
            show through under the fold inside the preview pane. */}
        {!IS_EMBED && (
          <>
        {/* Below-the-fold statement, under the UI variants shell — the
            "What is Rivet, exact copy" Rivet direction, adapted per review:
            centered instead of left-aligned, label removed, and the lead
            sentence stepped down from hero-title-size to a ~2xl/3xl scale.
            Copy only, no CTA (the hero title carries the install CTA). */}
        {SHOW_INTRO_STATEMENT && (
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
        )}

        {/* Desktop first-panel band: between panels the empty band is a
            section's pb + the next section's pt (128px). lg:pt-16 (64) + the
            first section's pt-16 (64) reproduces that same 128px band above
            the first panel; lg:-mt-8 cancels the parent flex's gap-8 so the
            band measures correctly. Desktop-only: on mobile each panel's copy
            stacks above its visual box, so that band isn't empty and doesn't
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
          </>
        )}
      </div>
    </>
  );
};

export default App;
