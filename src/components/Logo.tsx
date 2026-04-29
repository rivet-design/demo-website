import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

// "rivet" outlined as SVG paths using the Goldman font at 36px.
// Generated via scripts/outline-logo.mjs with opentype.js:
//   node scripts/outline-logo.mjs
// To regenerate: download Goldman Regular TTF from Google Fonts to /tmp/goldman.ttf and re-run.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="85" height="24" viewBox="0 0 85 24">
  <path fill="#FF3300" d="M4.39 23.08L0 23.08L0 6.95L2.95 6.95L4.32 7.67Q5.26 7.16 6.34 6.88Q7.42 6.59 9.07 6.59L9.07 6.59Q11.70 6.59 13.34 7.16Q14.98 7.74 15.52 8.03L15.52 8.03L14.26 11.16Q13.82 10.94 12.83 10.60Q11.84 10.26 10.51 9.97Q9.18 9.68 7.60 9.68L7.60 9.68L7.20 9.68Q5.47 9.68 4.95 10.37Q4.43 11.05 4.39 12.64L4.39 12.64L4.39 23.08ZM20.59 4.68L20.59 4.68Q19.26 4.68 18.65 4.14Q18.04 3.60 18.04 2.34L18.04 2.34Q18.04 1.04 18.63 0.52Q19.22 0 20.59 0L20.59 0Q21.96 0 22.57 0.52Q23.18 1.04 23.18 2.34L23.18 2.34Q23.18 3.56 22.57 4.12Q21.96 4.68 20.59 4.68ZM22.79 23.08L18.40 23.08L18.40 6.95L22.79 6.95L22.79 23.08ZM38.88 23.08L33.12 23.08L25.70 6.95L30.74 6.95L34.88 16.88L35.82 19.48L36.18 19.48L37.12 16.88L41.33 6.95L46.22 6.95L45.65 9.14L38.88 23.08ZM60.37 23.08L53.14 23.08Q51.34 23.08 50.36 22.61Q49.39 22.14 48.98 21.42Q48.56 20.70 48.47 19.91Q48.38 19.12 48.38 18.47L48.38 18.47L48.38 11.56Q48.38 11.02 48.47 10.24Q48.56 9.47 48.98 8.71Q49.39 7.96 50.38 7.45Q51.37 6.95 53.14 6.95L53.14 6.95L60.88 6.95Q63.25 6.95 64.60 7.40Q65.95 7.85 66.51 8.86Q67.07 9.86 67.07 11.56L67.07 11.56L67.07 16.88L60.77 16.88Q57.53 16.88 55.49 16.74Q53.46 16.60 52.78 16.56L52.78 16.56L52.78 18.54Q52.74 19.98 54.50 19.98L54.50 19.98L56.34 19.98Q58.28 19.98 60.14 19.93Q61.99 19.87 63.54 19.78Q65.09 19.69 66.02 19.62L66.02 19.62L67.46 21.96Q67.46 23.08 60.37 23.08L60.37 23.08ZM52.78 11.48L52.78 13.79L62.68 13.79L62.68 11.48Q62.68 10.76 62.51 10.48Q62.35 10.19 61.56 10.12Q60.77 10.04 58.86 10.04L58.86 10.04L54.50 10.04Q52.78 10.04 52.78 11.48L52.78 11.48ZM78.44 23.08L77.33 23.08Q74.59 23.08 73.58 21.92Q72.58 20.77 72.58 18.47L72.58 18.47L72.58 10.04L69.62 10.04L69.62 6.95L71.14 6.95Q71.82 6.95 72.13 6.73Q72.43 6.52 72.58 5.87L72.58 5.87L73.30 2.02L76.97 2.02L76.97 6.95L84.46 6.95L84.46 10.04L76.97 10.04L76.97 18.50Q76.97 19.40 77.40 19.69Q77.83 19.98 78.70 19.98L78.70 19.98L83.77 19.98L84.13 22.72Q83.38 22.82 81.83 22.95Q80.28 23.08 78.44 23.08L78.44 23.08Z"/>
</svg>`;

const Logo = () => {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = logoRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ x: rect.left, y: rect.bottom - 4 });
    }
  };

  const handleCopy = async () => {
    setMenuPos(null);
    try {
      await navigator.clipboard.writeText(LOGO_SVG);
      toast.success('Copied logo SVG');
    } catch {
      toast.error('Failed to copy');
    }
  };

  useEffect(() => {
    if (!menuPos) return;
    const dismiss = () => setMenuPos(null);
    document.addEventListener('click', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => {
      document.removeEventListener('click', dismiss);
      document.removeEventListener('keydown', dismiss);
    };
  }, [menuPos]);

  return (
    <>
      <motion.div
        className="flex cursor-default items-center font-cta text-4xl text-primary"
        style={{ width: 88.4141, height: 65 }}
        onContextMenu={handleContextMenu}
      >
        <span ref={logoRef} className="font-bold">rivet</span>
      </motion.div>

      {createPortal(
        <AnimatePresence>
          {menuPos && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{ position: 'fixed', left: menuPos.x, top: menuPos.y, zIndex: 9999 }}
              className="min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-neutral-900 p-1 shadow-2xl"
            >
              <button
                onClick={handleCopy}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="10" viewBox="0 0 85 24" fill="#6b7280">
                  <path d="M4.39 23.08L0 23.08L0 6.95L2.95 6.95L4.32 7.67Q5.26 7.16 6.34 6.88Q7.42 6.59 9.07 6.59L9.07 6.59Q11.70 6.59 13.34 7.16Q14.98 7.74 15.52 8.03L15.52 8.03L14.26 11.16Q13.82 10.94 12.83 10.60Q11.84 10.26 10.51 9.97Q9.18 9.68 7.60 9.68L7.60 9.68L7.20 9.68Q5.47 9.68 4.95 10.37Q4.43 11.05 4.39 12.64L4.39 12.64L4.39 23.08ZM20.59 4.68L20.59 4.68Q19.26 4.68 18.65 4.14Q18.04 3.60 18.04 2.34L18.04 2.34Q18.04 1.04 18.63 0.52Q19.22 0 20.59 0L20.59 0Q21.96 0 22.57 0.52Q23.18 1.04 23.18 2.34L23.18 2.34Q23.18 3.56 22.57 4.12Q21.96 4.68 20.59 4.68ZM22.79 23.08L18.40 23.08L18.40 6.95L22.79 6.95L22.79 23.08ZM38.88 23.08L33.12 23.08L25.70 6.95L30.74 6.95L34.88 16.88L35.82 19.48L36.18 19.48L37.12 16.88L41.33 6.95L46.22 6.95L45.65 9.14L38.88 23.08ZM60.37 23.08L53.14 23.08Q51.34 23.08 50.36 22.61Q49.39 22.14 48.98 21.42Q48.56 20.70 48.47 19.91Q48.38 19.12 48.38 18.47L48.38 18.47L48.38 11.56Q48.38 11.02 48.47 10.24Q48.56 9.47 48.98 8.71Q49.39 7.96 50.38 7.45Q51.37 6.95 53.14 6.95L53.14 6.95L60.88 6.95Q63.25 6.95 64.60 7.40Q65.95 7.85 66.51 8.86Q67.07 9.86 67.07 11.56L67.07 11.56L67.07 16.88L60.77 16.88Q57.53 16.88 55.49 16.74Q53.46 16.60 52.78 16.56L52.78 16.56L52.78 18.54Q52.74 19.98 54.50 19.98L54.50 19.98L56.34 19.98Q58.28 19.98 60.14 19.93Q61.99 19.87 63.54 19.78Q65.09 19.69 66.02 19.62L66.02 19.62L67.46 21.96Q67.46 23.08 60.37 23.08L60.37 23.08ZM52.78 11.48L52.78 13.79L62.68 13.79L62.68 11.48Q62.68 10.76 62.51 10.48Q62.35 10.19 61.56 10.12Q60.77 10.04 58.86 10.04L58.86 10.04L54.50 10.04Q52.78 10.04 52.78 11.48L52.78 11.48ZM78.44 23.08L77.33 23.08Q74.59 23.08 73.58 21.92Q72.58 20.77 72.58 18.47L72.58 18.47L72.58 10.04L69.62 10.04L69.62 6.95L71.14 6.95Q71.82 6.95 72.13 6.73Q72.43 6.52 72.58 5.87L72.58 5.87L73.30 2.02L76.97 2.02L76.97 6.95L84.46 6.95L84.46 10.04L76.97 10.04L76.97 18.50Q76.97 19.40 77.40 19.69Q77.83 19.98 78.70 19.98L78.70 19.98L83.77 19.98L84.13 22.72Q83.38 22.82 81.83 22.95Q80.28 23.08 78.44 23.08L78.44 23.08Z"/>
                </svg>
                <span>Copy logo as SVG</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};

export default Logo;
