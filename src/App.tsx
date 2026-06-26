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
import VariantsShowcase from './components/variantsDemo/VariantsShowcase';
import { SKEUOMORPHIC_DECK_ID } from './components/variantsDemo/data';
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
      <div className="pointer-events-none absolute inset-0 bg-black/25" aria-hidden />

      {/* The "letter" — centered on top of the video. */}
      <PaperSheet className="relative z-10 w-full max-w-prose">
        <div className="flex flex-col gap-6 px-12 py-14 text-left text-[#2b2620] md:px-16 md:py-16">
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
      </PaperSheet>
    </div>
  );
};


const App = () => {
  const latestVersion = useLatestVersion();

  const renderDownloadPanel = () => {
    return (
      <div className="hidden flex-col items-center py-16 md:flex">
        <div className="flex flex-col gap-6">
          <h2 className="type-heading-1 text-center text-[44px] font-normal">
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
            className={`flex flex-col items-start gap-5 rounded-lg text-left`}
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
                  Try Rivet&apos;s MCP{latestVersion ? ` in v${latestVersion}` : ''}
                </span>
              </a>
            )}

            {/* Title only, centered. The subtitle + CTA now live below the
                UI variants shell; the nav also carries a CTA. */}
            <div className="flex flex-col items-start gap-4">
              <span className="type-display text-[clamp(2.5rem,6.5vw,8rem)] font-normal normal-case leading-[1.0] text-black">
                Direct, don&apos;t implement.
              </span>
            </div>
          </div>
        </FadeInText>
      </div>
    );
  };
  return (
    <>
      <Toaster position="bottom-right" theme="light" duration={8000} />
      {/* Paper texture behind all content. Applied to the scrolling container
          (not fixed) so it travels with the page; tiled vertically to cover the
          full scroll height at the same horizontal scale across the viewport. */}
      <div
        className={`flex min-h-screen flex-col gap-8 px-[5vw] ${pageBackground.className}`}
        style={pageBackground.style}
      >
        <NavBar />
        <div className="flex w-full items-start justify-start">
          {renderHeroText()}
        </div>

        <div
          className="flex w-full justify-center rounded-xl bg-cover bg-center p-4 sm:p-6 md:p-10"
          style={{ backgroundImage: "url('/images/panel-backdrop.png')" }}
        >
          <BrowserFrame url="localhost:4000" draggable className="w-full max-w-6xl">
            <VariantsShowcase
              heightClassName="h-[58vh] min-h-[440px]"
              autoPlay={false}
              initialVariantId={SKEUOMORPHIC_DECK_ID}
            />
          </BrowserFrame>
        </div>

        {/* Subtitle + CTA, moved below the fold to sit under the UI variants
            shell. */}
        <FadeInText>
          <div className="flex flex-col items-center gap-5 py-12 text-center md:py-20">
            <span className="max-w-2xl text-[20px] font-normal leading-relaxed text-black md:text-[26px]">
              Rivet understands your references, and then explores dozens of
              design directions with you.
            </span>
            <PromptInstallButton size="lg" />
          </div>
        </FadeInText>

        <div className="-mx-[5vw] flex flex-col gap-12" id="demo-panel">
          {/* <WorkflowPanels /> */}
          <ReferencesDemoSection />
          {SHOW_VARIANTS_PANEL && <VariantsDemoSection />}
          <CommentDemoSection />
          {SHOW_MANIFESTO_PANEL && <CodePanel />}
        </div>
        {/* <FeaturePanel /> */}
        {renderDownloadPanel()}
        <div className="-mt-12 md:mt-0">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default App;
