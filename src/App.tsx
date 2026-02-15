import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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

const sparkles = [
  { x: '10%', y: '20%', delay: 0 },
  { x: '80%', y: '15%', delay: 0.1 },
  { x: '30%', y: '70%', delay: 0.2 },
  { x: '60%', y: '80%', delay: 0.15 },
  { x: '90%', y: '50%', delay: 0.25 },
  { x: '20%', y: '40%', delay: 0.05 },
  { x: '70%', y: '30%', delay: 0.3 },
  { x: '45%', y: '60%', delay: 0.12 },
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
    <div className="-mx-4 flex min-h-[24rem] w-screen flex-col items-center justify-center gap-6 bg-green py-8 text-left font-main text-[#FEFFF3] sm:-mx-8 sm:h-96 sm:flex-row sm:gap-0 md:-mx-16 lg:-mx-32 xl:-mx-60">
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
  const [isHovering, setIsHovering] = useState(false);

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
        <FadeInText className="type-display text-black md:text-5xl md:leading-tight lg:text-5xl lg:leading-tight xl:text-6xl xl:leading-tight">
          Rivet is the visual editor{' '}
          <br className="hidden min-[800px]:inline" />
          built for design.
        </FadeInText>
        <FadeInText className="w-full" delay={0.3}>
          <span className="type-subtitle sm:text-xl md:text-xl lg:text-2xl xl:text-2xl">
            The missing visual layer for Claude Code. Built to help you craft
            a{' '}
          </span>
          <span
            className="type-subtitle relative inline-block whitespace-nowrap sm:text-xl md:text-xl lg:text-2xl xl:text-2xl"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <span className="whitespace-nowrap font-pixel font-bold">
              <span className="font-pixelTools">U</span>
              <span className="font-pixel"> pixel perfect UI </span>
              <span className="font-pixelTools">X</span>
            </span>
            {isHovering &&
              sparkles.map((sparkle, i) => (
                <motion.div
                  key={i}
                  className="absolute h-2 w-2 bg-primary"
                  style={{
                    left: sparkle.x,
                    top: sparkle.y,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.5, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: sparkle.delay,
                    times: [0, 0.2, 0.5, 1],
                  }}
                />
              ))}
          </span>
        </FadeInText>
        <FadeInText delay={0.5}>
          <div className="hidden items-center gap-4 sm:flex">
            <DownloadButton className="type-label-lg rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
              Download for Mac
            </DownloadButton>
            <a
              href="https://docs.rivet.design/"
              target="_blank"
              rel="noopener noreferrer"
              className="type-label-lg rounded-lg bg-[#FFF0E6] px-6 py-3 text-primary transition-colors hover:bg-[#FFE4D4]"
            >
              Read the guide
            </a>
          </div>
        </FadeInText>
      </div>
    );
  };
  return (
    <div className="flex min-h-screen flex-col gap-12 bg-[#FEFFF3] px-4 sm:px-8 md:px-16 lg:px-32 xl:px-60">
      <NavBar />
      <div className="flex w-full items-center justify-center">
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
        <DownloadButton className="type-label-lg w-full rounded-lg bg-primary px-3 py-3 text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
          Download
        </DownloadButton>
      </div>
    </div>
  );
};

export default App;
