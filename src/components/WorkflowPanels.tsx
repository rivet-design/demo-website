import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

const ASSET_BASE = 'https://pub-eed10ae7764348e2b0775fb6de2f56de.r2.dev';

interface WorkflowStep {
  videoUrl: string;
  title: string;
  description: string;
  textPosition: 'left' | 'right';
  backgroundColor: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    videoUrl: `${ASSET_BASE}/media/select_sq.mp4`,
    title: 'Select',
    description:
      'Click any element in your app to select it and start editing.',
    textPosition: 'right',
    backgroundColor: '#141D24',
  },
  {
    videoUrl: `${ASSET_BASE}/media/polish_sq.mp4`,
    title: 'Polish',
    description:
      'Change styles to the exact values you’d like, or prompt to iterate. ',
    textPosition: 'left',
    backgroundColor: '#1F2015',
  },
  {
    videoUrl: `${ASSET_BASE}/media/publish_sq.mp4`,
    title: 'Publish',
    description:
      'Rivet pushes clean, reviewable code to your repo just like a frontend engineer would.',
    textPosition: 'right',
    backgroundColor: '#2A1C35',
  },
];

interface WorkflowPanelProps {
  step: WorkflowStep;
  index: number;
}

const WorkflowPanel = ({ step, index }: WorkflowPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const { scrollYProgress } = useScroll({
    target: panelRef,
    offset: ['start end', 'end start'],
  });

  // First panel should be fully visible on load (no scroll-triggered fade-in)
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.3, 1],
    index === 0 ? [1, 1, 1] : [0, 1, 1],
  );

  const isVideoLeft = step.textPosition === 'right';

  return (
    <motion.div
      ref={panelRef}
      style={{ opacity, backgroundColor: step.backgroundColor }}
      className="flex w-full items-center justify-center rounded-lg p-6 md:p-8"
    >
      <div
        className={`flex w-full max-w-7xl flex-col gap-4 sm:gap-6 md:gap-8 ${isVideoLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
      >
        {/* Video */}
        <div className="flex flex-[2] items-center justify-center">
          <div className="relative w-full max-w-2xl">
            <div className="aspect-square w-full">
              {!isVideoLoaded && (
                <div className="absolute inset-0 animate-pulse rounded-lg bg-gray-700/50" />
              )}
              <video
                key={step.videoUrl}
                className="h-full w-full rounded-lg object-cover"
                src={step.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onLoadedData={() => setIsVideoLoaded(true)}
              />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex flex-1 flex-col justify-center gap-4 text-[#FEFFF3] sm:gap-6">
          <h2 className="type-heading-2 font-bold sm:text-3xl md:text-4xl">
            {step.title}
          </h2>
          <p className="type-body sm:text-lg md:text-xl">{step.description}</p>
        </div>
      </div>
    </motion.div>
  );
};

const WorkflowPanels = () => {
  return (
    <div className="flex w-full flex-col gap-8">
      {WORKFLOW_STEPS.map((step, index) => (
        <WorkflowPanel key={index} step={step} index={index} />
      ))}
    </div>
  );
};

export default WorkflowPanels;
