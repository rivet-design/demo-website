import { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import FadeInText from './components/FadeInText';
import WorkflowPanels from './components/WorkflowPanels';
import DownloadButton from './components/DownloadButton';
import { SmoothScroll } from './components/SmoothScroll';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FeaturePanel = () => {
  return (
    <div className="-mx-[5vw] flex min-h-[28rem] w-screen flex-col items-start justify-center gap-8 bg-main px-[5vw] py-12 sm:flex-row sm:items-center sm:gap-12">
      {/* Left: title + subtitle */}
      <div className="flex max-w-sm flex-col gap-4 text-left font-main">
        <h2 className="type-heading-2 text-3xl font-normal text-foreground md:text-4xl">
          Use your design context.
        </h2>
        <p className="type-subtitle text-[#555555] md:text-lg">
          View, edit and change your design tokens for typography, color, spacing and more.
        </p>
      </div>

      {/* Right: product image */}
      <div className="flex flex-1 items-center justify-end">
        <div className="w-full max-w-xs overflow-hidden rounded-lg" style={{ backgroundColor: '#2D1B69' }}>
          <img
            src="/images/tokens@2x.png"
            alt="Tokens"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

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
              See what&apos;s new{latestVersion ? ` in v${latestVersion}` : ''}
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
          <div className="flex items-center gap-4">
            <a
              href="https://discord.gg/Eqn9Fcpuh4"
              target="_blank"
              rel="noopener noreferrer"
              className="type-label-lg rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-hover sm:order-2 sm:bg-accent-foreground sm:text-white sm:hover:bg-[hsl(0_0%_20%)]"
            >
              Join the community
            </a>
            <DownloadButton className="type-label-lg hidden rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:inline-block">
              Download for Mac
            </DownloadButton>
          </div>
        </FadeInText>
      </div>
    );
  };
  return (
    <SmoothScroll>
    <div className="flex min-h-screen flex-col gap-12 bg-main px-[5vw]">
      <NavBar />
      <div className="flex w-full items-start justify-start sm:items-center sm:justify-center">
        {renderHeroText()}
      </div>

      <div className="-mx-[5vw]">
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
    </SmoothScroll>
  );
};

export default App;
