import { memo, useState } from 'react';
import AgentTerminal from './sandbox/AgentTerminal';
import ReplayButton from './ReplayButton';

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
  // Bumping the key remounts the terminal, restarting its scripted animation.
  const [runId, setRunId] = useState(0);
  return (
    <div className="page-gutter-x relative flex w-full justify-center py-8 lg:py-16">
      <div className="grid w-full grid-cols-1 items-center gap-16 lg:grid-cols-[2.5fr_1fr]">
        {/* Terminal — left on lg+, below the title on mobile. */}
        <div className="order-2 w-full lg:order-1">
          {/* On mobile the panel is a vertical rectangle (`aspect-panel-portrait`)
              so the terminal — which fills it (h-full) — can show more of the
              agent transcript; from md up it returns to the landscape `panel`
              box the other workflow panels share.

              The portrait ratio is width-driven, so on wider phones / foldables
              (≈430–767px) a naive `aspect-panel-portrait` would balloon to
              760–920px tall — a giant box with a tiny scrolled transcript and
              its bottom padding shoved past the fold. Cap the height so narrow
              phones keep their full portrait box while anything wider clamps to
              a sane height; `lg:max-h-none` releases it once the landscape ratio
              takes over. */}
          <div
            data-guide-row
            className="relative aspect-panel-portrait max-h-[500px] w-full overflow-visible border border-black/10 bg-cover bg-center p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:p-6 lg:aspect-panel lg:max-h-none lg:overflow-hidden lg:p-8"
            style={{ backgroundImage: "url('/images/bg2.webp')" }}
          >
            {/* Type the command 1.5× faster than the default (42ms → 28ms/char)
                so the chat-box text lands quicker in this section. */}
            <AgentTerminal key={runId} typeMs={28} />
            <ReplayButton onClick={() => setRunId((n) => n + 1)} />
          </div>
        </div>

        {/* Copy — right on lg+, above the terminal on mobile. Shared copy-block
            padding keeps workflow panel title/subtitle spacing consistent. */}
        {/* lg:ml-auto pins the copy to the column's right edge, and lg:pr-8
            insets the text off the right guide rule by the same 2rem the
            references panel's copy keeps off the LEFT rule (its lg:pl-8). */}
        <div className="workflow-copy-block order-1 lg:order-2 lg:ml-auto lg:pr-8">
          <h2 className="workflow-title-size max-w-[18ch] font-main font-normal leading-[1.15] tracking-[-0.01em] text-black">
            Start new directions from your agent.
          </h2>
          <p className="landing-subtext mt-4 text-black/70">
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

// Memoized: it takes no props, so it never needs to re-render when the App
// re-renders (e.g. during the hero intro's state churn).
export default memo(AgentTerminalSection);
