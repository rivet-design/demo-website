import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { RIVET_ICON_SRC } from '../lib/rivetLockup';

// The "rivet" wordmark — one of the two canonical marks (see lib/rivetLockup.ts),
// matching the new nav bar in Figma (node 794:1120): text only, no icon glyph
// beside it.
const WORDMARK_SRC = '/images/rivet-wordmark-text.svg';

const Logo = () => {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = logoRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ x: rect.left, y: rect.bottom - 4 });
    }
  };

  // The shipped assets ARE the clipboard payloads — fetched as text at copy
  // time rather than duplicated here, so they can't drift from what's rendered.
  const copySvg = async (src: string, label: string) => {
    setMenuPos(null);
    try {
      const svg = await fetch(src).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      });
      await navigator.clipboard.writeText(svg);
      toast.success(`Copied ${label} SVG`);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCopyLogo = () => copySvg(RIVET_ICON_SRC, 'logo');
  const handleCopyWordmark = () => copySvg(WORDMARK_SRC, 'wordmark');

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
      {/* Sized to match the hero/splash lockup's wordmark exactly — same
          h-[23px] / md:h-[26px] as the #hero-lockup text in App.tsx, so the
          same mark reads at the same size wherever it appears. (Was a fixed
          32px in a hard-coded 101x32 box; the box is gone too, so the wrapper
          just hugs whatever the responsive height works out to.) */}
      {/* The mark is the way back to the top of the page. On a sub-route that
          is a plain navigation home; on the landing page itself a reload would
          throw away the scroll-driven hero, so it rewinds to the top instead.
          Right-click still opens "Copy logo as SVG". */}
      <motion.a
        href="/"
        className="flex shrink-0 cursor-pointer items-center"
        onClick={(e) => {
          if (window.location.pathname !== '/') return;
          e.preventDefault();
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
              .matches
              ? 'auto'
              : 'smooth',
          });
        }}
        onContextMenu={handleContextMenu}
      >
        <img
          ref={logoRef}
          src={WORDMARK_SRC}
          alt="rivet"
          draggable={false}
          className="h-[23px] w-auto md:h-[26px]"
        />
      </motion.a>

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
                onClick={handleCopyLogo}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
              >
                <img src={RIVET_ICON_SRC} alt="" aria-hidden="true" className="h-2.5 w-auto opacity-80" />
                <span>Copy logo as SVG</span>
              </button>
              <button
                onClick={handleCopyWordmark}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
              >
                <img src={WORDMARK_SRC} alt="" aria-hidden="true" className="h-2.5 w-auto opacity-80" />
                <span>Copy wordmark as SVG</span>
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
