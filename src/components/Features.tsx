import { motion, useScroll, useTransform } from 'motion/react';
import React from 'react';

const MEDIA_BASE = "https://pub-eed10ae7764348e2b0775fb6de2f56de.r2.dev/media";

const STEPS = [
  {
    videoUrl: `${MEDIA_BASE}/select_sq.mp4`,
    title: "Select",
    description: "Click any element in your app to select it and start editing.",
    textPosition: "right",
    backgroundColor: "#141D24"
  },
  {
    videoUrl: `${MEDIA_BASE}/polish_sq.mp4`,
    title: "Polish",
    description: "Change styles to the exact values you’d like, or prompt to iterate.",
    textPosition: "left",
    backgroundColor: "#1F2015"
  },
  {
    videoUrl: `${MEDIA_BASE}/publish_sq.mp4`,
    title: "Publish",
    description: "Rivet pushes clean, reviewable code to your repo just like a frontend engineer would.",
    textPosition: "right",
    backgroundColor: "#2A1C35"
  }
];

interface StepProps {
  step: {
    videoUrl: string;
    title: string;
    description: string;
    textPosition: string;
    backgroundColor: string;
  };
  index: number;
}

const Step: React.FC<StepProps> = ({ step, index }) => {
  const ref = React.useRef(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.98, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [10, 0, -10]);
  const mediaY = useTransform(scrollYProgress, [0, 1], [-20, 20]);
  
  const isRight = step.textPosition === "right";

  return (
    <div className="relative group">
      {/* Background Gradient Bleed-through (Blobs) */}
      <div 
        className={`absolute -inset-16 z-0 opacity-15 blur-[100px] transition-opacity group-hover:opacity-25`}
        style={{ 
          background: `radial-gradient(circle, ${step.backgroundColor} 0%, transparent 70%)`,
          left: isRight ? 'auto' : '-5%',
          right: isRight ? '-5%' : 'auto',
          top: '10%'
        }}
      />

      <motion.div
        ref={ref}
        style={{ opacity, scale, y, backgroundColor: step.backgroundColor }}
        className="relative z-10 flex w-full items-center justify-center rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-2xl shadow-rivet-dark/20 border border-white/5"
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className={`flex w-full max-w-7xl flex-col gap-6 md:gap-12 ${isRight ? "md:flex-row" : "md:flex-row-reverse"}`}>
          {/* Media Section with Parallax */}
          <motion.div 
            style={{ y: mediaY }}
            className="flex flex-[1.5] items-center justify-center"
          >
            <div className="relative w-full rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <div className="aspect-[16/10] w-full">
                {!isLoaded && <div className="absolute inset-0 animate-pulse bg-white/5" />}
                <video
                  className="h-full w-full object-cover"
                  src={step.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onLoadedData={() => setIsLoaded(true)}
                />
              </div>
            </div>
          </motion.div>

          {/* Text Section with Staggered Entrance */}
          <div className="flex flex-1 flex-col justify-center gap-4 text-white">
            <motion.span 
              initial={{ opacity: 0, x: isRight ? 10 : -10 }}
              whileInView={{ opacity: 0.5, x: 0 }}
              transition={{ delay: 0.1 }}
              className="type-overline uppercase tracking-widest text-xs"
            >
              Step {index + 1}
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="type-heading-3 md:type-heading-2 font-medium"
            >
              {step.title}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 0.7, y: 0 }}
              transition={{ delay: 0.3 }}
              className="type-body text-base md:text-lg leading-relaxed"
            >
              {step.description}
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Features = () => {
  return (
    <div className="flex w-full flex-col gap-10 md:gap-12 py-8 md:py-12">
      {STEPS.map((step, i) => (
        <Step key={i} step={step} index={i} />
      ))}
    </div>
  );
};

export default Features;
