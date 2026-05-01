import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
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

const PRIMARY_CTA_LABEL = 'Get Rivet';
const SECONDARY_CTA_LABEL = 'Try in browser';
const PRIMARY_CTA_CLASS =
  'type-label-lg inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-base text-white transition-colors hover:bg-primary-hover';
const SECONDARY_CTA_CLASS =
  'no-external-icon type-label-lg inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-6 py-3 text-center text-base text-primary transition-colors hover:bg-primary/10';

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
    <div className="flex min-h-[24rem] w-full flex-col items-start justify-center gap-6 bg-green py-8 text-left font-main text-[#FEFFF3] md:h-96 md:flex-row md:items-center md:gap-0">
      <div className="flex max-w-lg flex-col justify-center gap-4 px-8 md:gap-6">
        <span className="type-heading-3 md:text-2xl lg:text-3xl">
          Made for people who design.
        </span>
        <span
          className="type-subtitle md:text-xl lg:text-2xl"
          style={{ fontSize: '21px' }}
        >
          Rivet gives visual AI tools for designers who want to sculpt the
          software they work on.{' '}
        </span>
      </div>
      <div className="flex flex-col items-center justify-center overflow-x-auto px-8 md:items-start md:overflow-x-visible">
        <pre className="font-mono text-[0.6rem] leading-tight text-[#FEFFF3] md:text-xs">
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
      <div className="hidden flex-col items-center gap-6 py-16 md:flex">
        <h2 className="type-heading-1 text-center text-4xl font-normal">
          Own every visual detail.
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <DownloadButton
            className={`${PRIMARY_CTA_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {PRIMARY_CTA_LABEL}
          </DownloadButton>
          <a
            href="https://demo.rivet.design/"
            target="_blank"
            rel="noopener noreferrer"
            className={SECONDARY_CTA_CLASS}
          >
            {SECONDARY_CTA_LABEL}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </a>
        </div>
      </div>
    );
  };

  const renderHeroText = () => {
    return (
      <div className="type-heading-3 flex w-full flex-col gap-4 text-left md:gap-6 md:text-2xl">
        <FadeInText className="type-display text-[36px] font-normal text-black">
          The visual editor to design with agents.
        </FadeInText>
        <FadeInText className="w-full" delay={0.3}>
            <div className="flex flex-col gap-1 text-base text-black md:text-base lg:text-lg">
            <span className="text-[18px] font-normal">
              Turn design feedback into code and get the details right with
              precise visual tools.{' '}
            </span>
          </div>
        </FadeInText>
        <FadeInText className="hidden md:block" delay={0.5}>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/download"
              className={PRIMARY_CTA_CLASS}
            >
              {PRIMARY_CTA_LABEL}
            </a>
            <a
              href="https://demo.rivet.design/"
              target="_blank"
              rel="noopener noreferrer"
              className={SECONDARY_CTA_CLASS}
            >
              {SECONDARY_CTA_LABEL}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </a>
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
          <WorkflowPanels />
          <CodePanel />
        </div>
        {/* <FeaturePanel /> */}
        {renderDownloadPanel()}
        <div>
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
