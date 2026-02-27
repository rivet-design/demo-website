import { motion } from 'motion/react';
import React from 'react';
import DownloadButton from './components/DownloadButton';
import Features from './components/Features';
import Footer from './components/Footer';
import Hero from './components/Hero';
import NavBar from './components/NavBar';

const FadeUp = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1], delay }}
  >
    {children}
  </motion.div>
);

const ASCII_FRAMES = [
  [
    "~~~~~|   |    |   |    |   |    |   |~~~~",
    "~~~~~ ~~~ ~~~~ ~~~ ~~~~ ~~~ ~~~~ ~~~ ~~~",
    "~~~~~   ~~~  ~~~  ~~~  ~~~  ~~~  ~~~  ~~"
  ],
  [
    "~~~~^|   |    |   |    |   |    |   |v~~~",
    "~~~~  ~~~  ~~~  ~~~  ~~~  ~~~  ~~~  ~~~~",
    "~~~~   ~~   ~~   ~~   ~~   ~~   ~~   ~~~"
  ],
  [
    "~~~~v|   |    |   |    |   |    |   |^~~~",
    "~~~   ~~   ~~   ~~   ~~   ~~   ~~   ~~~~",
    "~~~    ~    ~    ~    ~    ~    ~    ~~~~"
  ],
  [
    "~~~~~|   |    |   |    |   |    |   |~~~~",
    "~~~~  ~~~  ~~~  ~~~  ~~~  ~~~  ~~~  ~~~~",
    "~~~~   ~~   ~~   ~~   ~~   ~~   ~~   ~~~"
  ]
];

const Bridge = () => {
  const [frame, setFrame] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <FadeUp>
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-rivet-dark/5" />
        <div className="flex w-full flex-col items-center justify-center gap-10 bg-rivet-dark py-16 text-center text-rivet-bg sm:py-24 sm:text-left md:flex-row md:gap-16 lg:gap-24">
          <div className="flex max-w-lg flex-col justify-center gap-4 px-8 sm:gap-6">
            <span className="type-heading-3 md:text-2xl lg:text-3xl text-white">
              Rivet is a bridge to your codebase.
            </span>
            <span className="type-subtitle md:text-xl lg:text-2xl opacity-80 text-white">
              It tracks your changes and publishes your work to GitHub when you're done.
            </span>
          </div>
          <div className="flex flex-col justify-center px-8">
            <pre className="font-mono text-[0.6rem] leading-tight text-white sm:text-xs">
              {`        |\\      /|      |\\      /|
        | \\    / |      | \\    / |
        |  \\  /  |      |  \\  /  |
        |   \\/   |      |   \\/   |
        |        |      |        |
     ___|________|______|________|__
    |_____________________________|
     |   |    |   |    |   |    |   |
     |   |    |   |    |   |    |   |
${ASCII_FRAMES[frame][0]}
${ASCII_FRAMES[frame][1]}
${ASCII_FRAMES[frame][2]}`}
            </pre>
          </div>
        </div>
        
        {/* Marquee with Mask Fade */}
        <div className="relative bg-primary py-3 overflow-hidden whitespace-nowrap">
          {/* Mask Fades */}
          <div className="absolute inset-y-0 left-0 w-32 z-10 bg-gradient-to-r from-primary to-transparent" />
          <div className="absolute inset-y-0 right-0 w-32 z-10 bg-gradient-to-l from-primary to-transparent" />
          
          <div className="inline-block animate-marquee">
            {[1,2,3,4,5,6].map(i => (
              <span key={i} className="type-overline text-white mx-12">
                Visual Programming • Local First • AI Native • Design Driven
              </span>
            ))}
          </div>
        </div>
      </div>
    </FadeUp>
  );
};

const App = () => {
  return (
    <div className="min-h-screen bg-rivet-bg selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      <div className="container flex flex-col gap-6 md:gap-10">
        <NavBar />
        
        <main className="flex flex-col gap-12 md:gap-20 pb-24 sm:pb-32">
          <Hero />
          
          <FadeUp>
            <Features />
          </FadeUp>

          <Bridge />

          <FadeUp>
            <section className="flex flex-col items-center gap-6 text-center py-10 md:py-16">
              <h2 className="type-heading-2 font-medium">Download Rivet for Mac</h2>
              <div className="w-full max-w-md px-4">
                <DownloadButton className="brutal-btn-primary w-full py-5 text-lg">
                  Download Now
                </DownloadButton>
              </div>
            </section>
          </FadeUp>

          <Footer />
        </main>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-rivet-dark/10 bg-white/80 px-4 py-4 backdrop-blur-md sm:hidden">
        <a 
          href="https://discord.gg/Eqn9Fcpuh4" 
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
