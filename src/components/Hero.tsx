import { motion } from 'motion/react';
import React from 'react';
import DownloadButton from './DownloadButton';

const FadeIn = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay }}
  >
    {children}
  </motion.div>
);

const STAR_POSITIONS = [
  { x: "10%", y: "20%", delay: 0 },
  { x: "80%", y: "15%", delay: 0.1 },
  { x: "30%", y: "70%", delay: 0.2 },
  { x: "60%", y: "80%", delay: 0.15 },
  { x: "90%", y: "50%", delay: 0.25 },
  { x: "20%", y: "40%", delay: 0.05 },
  { x: "70%", y: "30%", delay: 0.3 },
  { x: "45%", y: "60%", delay: 0.12 },
];

const Hero = () => {
  const [isHovering, setIsHovering] = React.useState(false);

  return (
    <section className="flex w-full flex-col gap-12 pt-20 md:pt-32">
      <div className="type-heading-3 flex w-full flex-col gap-6 text-left sm:gap-8 sm:text-2xl md:text-2xl">
        <FadeIn delay={0.1}>
          <div className="flex items-center gap-2">
            <span className="type-overline relative rounded-full bg-rivet-dark px-3 py-1 text-white">
              <span className="absolute inset-0 rounded-full bg-rivet-dark opacity-20" />
              Public Beta
            </span>
            <span className="text-base font-medium text-rivet-dark/60">Rivet is now live</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h1 className="type-display text-5xl text-rivet-dark md:text-7xl lg:text-8xl xl:text-9xl tracking-tighter leading-[0.85] uppercase">
            Visual editor <br />
            <span className="text-primary">for design.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.35}>
          <div className="max-w-2xl">
            <p className="type-subtitle text-lg md:text-2xl text-rivet-dark/70 leading-relaxed">
              The missing visual layer for Claude Code. Built to help you craft a{" "}
              <span 
                className="relative inline-block whitespace-nowrap cursor-default"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <span className="font-pixel font-bold text-rivet-dark">
                  pixel perfect UI
                </span>
                {isHovering && STAR_POSITIONS.map((star, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-2 w-2 bg-primary"
                    style={{ left: star.x, top: star.y }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.5, 1, 0] }}
                    transition={{ duration: 1, delay: star.delay, times: [0, 0.2, 0.5, 1] }}
                  />
                ))}
              </span>
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.5}>
          <div className="flex flex-wrap items-center gap-4">
            <DownloadButton className="type-label-lg rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-hover">
              Download for Mac
            </DownloadButton>
            <a 
              href="https://discord.gg/Eqn9Fcpuh4" 
              target="_blank" 
              rel="noopener noreferrer"
              className="type-label-lg rounded-lg border border-rivet-dark/10 bg-white px-6 py-3 text-rivet-dark transition-colors hover:bg-rivet-soft-orange"
            >
              Join the community
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Hero;
