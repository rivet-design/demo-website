import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

// The "rivet" wordmark — one of the two canonical marks (see lib/rivetLockup.ts),
// matching the new nav bar in Figma (node 794:1120): text only, no icon glyph
// beside it. WORDMARK_SVG below is the clipboard payload for "Copy logo as SVG"
// and is intentionally the older combined icon+text export — still a valid
// logo asset, just not pixel-identical to what's now on screen.
const WORDMARK_SRC = '/images/rivet-wordmark-text.svg';
const WORDMARK_SVG = `<svg width="1614" height="459" viewBox="0 0 1614 459" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M29.0335 458.267C12.9988 458.267 0 445.268 0 429.233V177.175C0 161.14 12.9988 148.141 29.0336 148.141H91.1248C95.8366 148.141 100.478 149.288 104.647 151.482L124.604 161.986C145.833 148.141 173.984 141.219 209.058 141.219C232.133 141.219 252.438 143.757 269.975 148.833C287.512 153.448 301.588 158.525 312.202 164.063C313.158 164.541 314.082 165.006 314.976 165.46C326.064 171.089 329.967 183.637 325.503 195.243L310.791 233.494C304.472 249.925 288.233 290.974 272.052 284.04C259.592 278.502 244.824 273.425 227.748 268.81C210.673 263.734 192.675 261.196 173.753 261.196H166.139C153.217 261.196 143.295 263.503 136.372 268.118C129.45 272.271 125.988 281.732 125.988 296.5V429.233C125.988 445.268 112.99 458.267 96.9549 458.267H29.0335Z" fill="#E14017"/>
<path d="M404.885 118.374C358.274 118.374 334.969 98.5295 334.969 58.8408C334.969 36.689 340.737 21.4596 352.275 13.1527C364.274 4.38423 381.811 0 404.885 0C429.345 0 447.112 4.38423 458.188 13.1527C469.726 21.4596 475.494 36.689 475.494 58.8408C475.494 98.5295 451.958 118.374 404.885 118.374ZM370.232 458.266C354.198 458.266 341.199 445.267 341.199 429.232V177.174C341.199 161.139 354.198 148.14 370.233 148.14H438.154C454.189 148.14 467.187 161.139 467.187 177.174V429.232C467.187 445.267 454.189 458.266 438.154 458.266H370.232Z" fill="#E14017"/>
<path d="M638.6 458.266C627.471 458.266 617.321 451.905 612.47 441.889L490.379 189.831C481.04 170.55 495.085 148.141 516.509 148.141H589.445C601.429 148.141 612.182 155.504 616.515 166.678L675.09 317.74L691.651 354.346C692.52 356.266 694.433 357.5 696.541 357.5C698.647 357.5 700.559 356.267 701.429 354.348L718.009 317.74L777.239 166.582C781.597 155.459 792.324 148.141 804.271 148.141H884.59C903.617 148.141 917.501 166.136 912.674 184.54L911.953 187.288C911.416 189.335 910.657 191.317 909.689 193.199L781.491 442.509C776.516 452.184 766.55 458.266 755.671 458.266H638.6Z" fill="#E14017"/>
<path d="M1029.75 458.266C999.287 458.266 975.751 453.882 959.137 445.113C942.985 436.345 931.909 424.346 925.909 409.117C919.91 393.426 916.91 375.428 916.91 355.122V250.593C916.91 232.133 919.91 215.288 925.909 200.059C932.37 184.368 943.677 171.908 959.829 162.678C975.982 152.986 999.287 148.141 1029.75 148.141H1173.04C1209.04 148.141 1236.5 152.525 1255.42 161.293C1274.8 169.6 1287.95 181.599 1294.88 197.29C1302.26 212.519 1305.95 230.287 1305.95 250.593V294.896V310.166C1305.95 326.201 1292.95 339.2 1276.92 339.2H1184.81C1143.27 339.2 1111.66 338.277 1089.97 336.431C1075.55 335.177 1064.01 334.243 1055.33 333.627C1049.7 333.228 1044.98 337.709 1044.98 343.354C1044.51 361.813 1055.59 371.043 1078.2 371.043H1099.66C1136.58 371.043 1170.73 370.351 1202.11 368.967C1223.15 367.729 1240.56 366.596 1254.33 365.566C1265.21 364.753 1275.7 369.921 1281.52 379.14L1309.08 422.781C1312.01 427.421 1313.88 433.356 1310.03 437.264C1308.09 439.235 1305.34 441.16 1301.8 443.037C1293.95 447.19 1280.11 450.882 1260.26 454.113C1240.88 456.882 1213.19 458.266 1177.19 458.266H1029.75ZM1044.98 263.053C1044.98 268.406 1049.31 272.745 1054.67 272.745H1168.19C1173.55 272.745 1177.89 268.406 1177.89 263.053C1177.89 253.823 1176.96 247.362 1175.12 243.67C1173.73 239.978 1168.89 237.671 1160.58 236.748C1152.27 235.825 1138.2 235.363 1118.35 235.363H1078.2C1056.05 235.363 1044.98 244.593 1044.98 263.053Z" fill="#E14017"/>
<path d="M1461.71 458.268C1426.63 458.268 1402.63 450.884 1389.71 436.116C1376.79 421.348 1370.33 399.196 1370.33 369.66L1383.04 246.39C1383.65 240.493 1379.02 235.365 1373.09 235.365H1342.6C1326.57 235.365 1313.57 222.366 1313.57 206.331V177.176C1313.57 161.141 1326.61 148.142 1342.64 148.142C1350.49 148.142 1356.72 146.758 1361.33 143.989C1366.41 140.758 1369.64 135.22 1371.02 127.375L1379.92 77.2622C1382.38 63.4024 1394.43 53.3047 1408.51 53.3047H1468.67C1484.7 53.3047 1497.7 66.3035 1497.7 82.3382V137.522C1497.7 143.387 1502.46 148.142 1508.32 148.142H1584.27C1600.31 148.142 1613.31 161.141 1613.31 177.176V206.331C1613.31 222.366 1600.31 235.365 1584.27 235.365H1507.7C1502.18 235.365 1497.7 239.842 1497.7 245.365V342.663C1497.7 354.2 1500.47 361.815 1506.01 365.507C1510.59 368.563 1517.08 370.355 1525.46 370.881C1529.07 371.107 1532.66 370.368 1536.03 369.05L1567.72 356.656C1585.66 349.638 1605.34 361.725 1607.19 380.903L1611.33 423.734C1612.83 439.183 1601.89 452.992 1586.45 454.565C1581.34 455.085 1575.76 455.627 1569.7 456.191C1549.85 457.575 1528.16 458.268 1504.63 458.268H1461.71Z" fill="#E14017"/>
</svg>`;

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

  const handleCopy = async () => {
    setMenuPos(null);
    try {
      await navigator.clipboard.writeText(WORDMARK_SVG);
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
      {/* Sized to match the hero/splash lockup's wordmark exactly — same
          h-[23px] / md:h-[26px] as the #hero-lockup text in App.tsx, so the
          same mark reads at the same size wherever it appears. (Was a fixed
          32px in a hard-coded 101x32 box; the box is gone too, so the wrapper
          just hugs whatever the responsive height works out to.) */}
      <motion.div
        className="flex cursor-default items-center"
        onContextMenu={handleContextMenu}
      >
        <img
          ref={logoRef}
          src={WORDMARK_SRC}
          alt="rivet"
          draggable={false}
          className="h-[23px] w-auto md:h-[26px]"
        />
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
                <img src={WORDMARK_SRC} alt="" aria-hidden="true" className="h-2.5 w-auto opacity-80" />
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
