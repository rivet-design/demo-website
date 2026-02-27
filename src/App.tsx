import { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import FadeInText from './components/FadeInText';
import WorkflowPanels from './components/WorkflowPanels';
import DownloadButton from './components/DownloadButton';

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
    <div className="-mx-10 flex min-h-[24rem] w-screen flex-col items-start justify-center gap-6 bg-green py-8 text-left font-main text-[#FEFFF3] sm:-mx-24 sm:h-96 sm:flex-row sm:items-center sm:gap-0 md:-mx-44 lg:-mx-64 xl:-mx-96">
      <div className="flex max-w-lg flex-col justify-center gap-4 px-8 sm:gap-6">
        <span className="type-heading-3 md:text-2xl lg:text-3xl">
          Rivet is a bridge to your codebase.
        </span>
        <span className="type-subtitle md:text-xl lg:text-2xl">
          It tracks your changes and publishes your work to GitHub when
          you&apos;re done.
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
  const renderDownloadPanel = () => {
    return (
      <div className="hidden flex-col items-center gap-4 pb-24 sm:flex sm:pb-0">
        <h2 className="type-heading-2 text-center font-medium">
          Download Rivet for Mac
        </h2>
        <div className="w-full max-w-md">
          <DownloadButton className="type-label-lg w-full rounded-lg bg-primary px-3 py-3 text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
            Download
          </DownloadButton>
        </div>
      </div>
    );
  };

  const renderHeroText = () => {
    return (
      <div className="type-heading-3 flex w-full flex-col gap-4 text-left sm:gap-6 sm:text-2xl md:text-2xl">
        <FadeInText>
          <div className="flex items-center gap-2">
            <span className="type-overline relative rounded-full bg-green px-2 py-0.5 text-white">
              <span className="absolute inset-0 rounded-full bg-green opacity-20" />
              New
            </span>
            <span className="text-base text-black">
              Rivet is now in public beta
            </span>
          </div>
        </FadeInText>
        <FadeInText className="type-display text-[36px] text-black">
          Give design feedback to agents
        </FadeInText>
        <FadeInText className="w-full" delay={0.3}>
          <div className="flex flex-col gap-1 text-base text-black sm:text-base md:text-base lg:text-lg">
            <span className="text-[18px] font-normal">Rivet helps people who design get visual details exactly right.</span>
            <span className="mt-4 text-[18px] font-normal">Leave as many comments as you&apos;d like and watch your feedback get implemented for you. Then refine any details yourself with visual tools.</span>
          </div>
        </FadeInText>
        <FadeInText className="hidden sm:block" delay={0.5}>
          <div className="flex items-center gap-4">
            <a
              href="https://discord.gg/Eqn9Fcpuh4"
              target="_blank"
              rel="noopener noreferrer"
              className="type-label-lg rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-hover sm:order-2 sm:bg-accent-foreground sm:text-white sm:hover:bg-accent-foreground"
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
    <div className="flex min-h-screen flex-col gap-12 bg-main px-10 sm:px-24 md:px-44 lg:px-64 xl:px-96">
      <NavBar />
      <div className="flex w-full items-start justify-start sm:items-center sm:justify-center">
        {renderHeroText()}
      </div>

      <WorkflowPanels />
      <CodePanel />
      {renderDownloadPanel()}
      <div className="pb-24 sm:pb-0">
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
  );
};

export default App;
