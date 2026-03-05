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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isChrome, setIsChrome] = useState(false);

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

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

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
      {/* Static refraction overlay - only on Chrome */}
      {isChrome && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(
              300px circle at 50% 50%,
              rgba(255, 255, 255, ${REFRACTION_OVERLAY_OPACITY}),
              transparent 50%
            )`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Static shine effect - only on Chrome */}
      {isChrome && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: SHINE_EFFECT_OPACITY,
            background: `radial-gradient(
              150px circle at 50% 50%,
              rgba(255, 255, 255, ${SHINE_EFFECT_INTENSITY}),
              transparent 60%
            )`,
          }}
        />
      )}
    </div>
  );
};
