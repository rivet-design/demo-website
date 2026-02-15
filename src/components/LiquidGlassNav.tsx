import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { getDisplacementFilter } from './glass/getDisplacementFilter';

interface LiquidGlassNavProps {
  children: React.ReactNode;
  className?: string;
}

const REFRACTION_OVERLAY_OPACITY = 0.3;
const SHINE_EFFECT_OPACITY = 0.2;
const SHINE_EFFECT_INTENSITY = 0.1;

export const LiquidGlassNav = ({
  children,
  className = '',
}: LiquidGlassNavProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isChrome, setIsChrome] = useState(false);

  const springConfig = { damping: 35, stiffness: 120 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Create distortion effect - reduced intensity
  const distortionX = useTransform(x, (value) => value * 0.05);
  const distortionY = useTransform(y, (value) => value * 0.05);

  // Create percentage transforms for gradients
  const gradientX1 = useTransform(
    distortionX,
    (value) => `${50 + value * 50}%`,
  );
  const gradientY1 = useTransform(
    distortionY,
    (value) => `${50 + value * 50}%`,
  );
  const gradientX2 = useTransform(
    distortionX,
    (value) => `${50 + value * 30}%`,
  );
  const gradientY2 = useTransform(
    distortionY,
    (value) => `${50 + value * 30}%`,
  );

  useEffect(() => {
    // Detect Chromium-based browsers
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isChromiumBrowser =
      userAgent.includes('chrome') ||
      userAgent.includes('chromium') ||
      userAgent.includes('edg');
    setIsChrome(isChromiumBrowser);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set initial dimensions
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Only track mouse on Chrome
    if (isChrome) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate position relative to center
        const relativeX = e.clientX - rect.left - centerX;
        const relativeY = e.clientY - rect.top - centerY;

        // Normalize to -1 to 1 with smoother scaling
        mouseX.set((relativeX / centerX) * 0.8);
        mouseY.set((relativeY / centerY) * 0.8);
      };

      const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
      };

      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('resize', updateDimensions);
      };
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [mouseX, mouseY, isChrome]);

  // Generate displacement filter only for Chrome - subtle refraction
  const displacementFilter =
    isChrome && dimensions.width > 0
      ? getDisplacementFilter({
          height: dimensions.height,
          width: dimensions.width,
          radius: 8, // rounded-lg = 8px
          depth: 6,
          strength: 25,
          chromaticAberration: 1,
        })
      : undefined;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: isChrome
          ? 'rgba(254, 255, 243, 0.4)'
          : 'rgba(254, 255, 243, 0.5)',
        backdropFilter:
          isChrome && displacementFilter
            ? `blur(1px) url('${displacementFilter}') blur(2px) brightness(1.01) saturate(1.05)`
            : 'blur(8px) brightness(1.01) saturate(1.02)',
        WebkitBackdropFilter:
          isChrome && displacementFilter
            ? `blur(1px) url('${displacementFilter}') blur(2px) brightness(1.01) saturate(1.05)`
            : 'blur(8px) brightness(1.01) saturate(1.02)',
      }}
    >
      {/* Interactive refraction overlay - only on Chrome */}
      {isChrome && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={
            {
              background: `
              radial-gradient(
                300px circle at var(--mouse-x) var(--mouse-y),
                rgba(255, 255, 255, ${REFRACTION_OVERLAY_OPACITY}),
                transparent 50%
              )
            `,
              '--mouse-x': gradientX1,
              '--mouse-y': gradientY1,
            } as React.CSSProperties
          }
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Dynamic shine effect that follows mouse - only on Chrome */}
      {isChrome && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={
            {
              opacity: SHINE_EFFECT_OPACITY,
              background: `
              radial-gradient(
                150px circle at var(--mouse-x) var(--mouse-y),
                rgba(255, 255, 255, ${SHINE_EFFECT_INTENSITY}),
                transparent 60%
              )
            `,
              '--mouse-x': gradientX2,
              '--mouse-y': gradientY2,
            } as React.CSSProperties
          }
        />
      )}
    </div>
  );
};
