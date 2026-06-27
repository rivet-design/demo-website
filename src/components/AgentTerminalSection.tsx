import PaperTexture from './PaperTexture';
import AgentTerminal from './sandbox/AgentTerminal';

const SECTION_BG = '#F0EFE9';

// Inline vendor mark + name. The shipped SVGs are single-color exports (Claude
// uses currentColor, Cursor/Codex are light/white for dark UIs), so they'd be
// invisible on this light panel — render each as a brand-colored mask instead,
// which keeps the glyph crisp and visible at text size.
const Vendor = ({
  src,
  color,
  name,
}: {
  src: string;
  color: string;
  name: string;
}) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap align-[-0.2em] font-medium text-black">
    <span
      aria-hidden
      className="inline-block h-[1.05em] w-[1.05em] shrink-0"
      style={{
        backgroundColor: color,
        maskImage: `url('${src}')`,
        WebkitMaskImage: `url('${src}')`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
    {name}
  </span>
);

/**
 * Workflow panel: "Turn your coding agent into a design agent."
 *
 * Mirrors the other workflow panels (References / Comment): a textured paper
 * section with the visual on one side and the copy on the other. Here the
 * scripted agent terminal sits on the LEFT (wrapped in a soft warm card —
 * no browser chrome) with the title + subtitle on the RIGHT. DOM order is
 * panel-then-text so the terminal leads on desktop; `order-` classes flip it so
 * the title leads on mobile.
 */
const AgentTerminalSection = () => {
  return (
    <div
      style={{ background: SECTION_BG }}
      className="relative flex w-full justify-center px-[5vw] py-16 md:py-24"
    >
      <PaperTexture className="-z-10" />
      <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1.7fr_1fr] lg:gap-16">
        {/* Terminal — left on lg+, below the title on mobile. */}
        <div className="order-2 w-full lg:order-1">
          <div
            className="overflow-hidden rounded-2xl border border-black/10 bg-cover bg-center p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:p-6 md:p-8"
            style={{ backgroundImage: "url('/images/panel-backdrop.png')" }}
          >
            <AgentTerminal />
          </div>
        </div>

        {/* Copy — right on lg+, above the terminal on mobile. */}
        <div className="order-1 max-w-[440px] lg:order-2">
          <h2 className="mt-3 font-main text-[28px] font-normal leading-[1.15] tracking-[-0.01em] text-black md:text-[36px] lg:text-[44px]">
            Works with your agent.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.8] text-black/70 md:text-[17px]">
            Use Rivet with your{' '}
            <Vendor src="/images/claude.svg" color="#D97757" name="Claude" />,{' '}
            <Vendor src="/images/cursor.svg" color="#111111" name="Cursor" />,{' '}
            <Vendor src="/images/codex.svg" color="#111111" name="Codex" />, and
            more.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentTerminalSection;
