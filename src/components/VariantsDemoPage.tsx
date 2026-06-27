import { Toaster } from 'sonner';
import BrowserFrame from './BrowserFrame';
import Logo from './Logo';
import VariantsShowcase from './variantsDemo/VariantsShowcase';
import { SESSION_PROMPT } from './variantsDemo/data';
import { pageBackground } from '../lib/background';

/**
 * Self-contained demo of a Rivet variants run, hosted at /variants.
 * The VariantsShowcase (preview + Directions panel) renders inside the same
 * browser shell + backdrop used on the landing page.
 */
const VariantsDemoPage = () => {
  return (
    <div
      className={`flex min-h-screen flex-col gap-8 px-[5vw] py-8 ${pageBackground.className}`}
      style={pageBackground.style}
    >
      <Toaster position="bottom-right" theme="dark" duration={5000} />

      <header className="flex items-center justify-between">
        <a href="/" className="no-external-icon">
          <Logo />
        </a>
        <span className="type-overline rounded-full bg-green px-3 py-1 text-white">
          Variants demo
        </span>
      </header>

      <div className="flex flex-col gap-2">
        <h1 className="type-display text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[1.05] text-black">
          Explore directions, live.
        </h1>
        <p className="max-w-2xl text-[16px] leading-relaxed text-divider-muted md:text-[18px]">
          {SESSION_PROMPT} It cycles on its own — click a direction or press
          ↑/↓ to take over.
        </p>
      </div>

      <div
        className="flex w-full justify-center rounded-xl bg-cover bg-center p-4 sm:p-6 md:p-10"
        style={{ backgroundImage: "url('/images/panel-backdrop.png')" }}
      >
        <BrowserFrame url="localhost:6000" className="w-full max-w-6xl">
          <VariantsShowcase heightClassName="h-[58vh] min-h-[440px]" />
        </BrowserFrame>
      </div>
    </div>
  );
};

export default VariantsDemoPage;
