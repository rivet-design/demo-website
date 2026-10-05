// The hero's desktop install CTA: the agent choices from PromptInstallButton's
// menu laid out inline, so picking an agent is the first click rather than the
// second. Still one orange object — a single gradient pill whose label says
// what it does, with one inset chip per agent — so the row keeps one primary
// beside "Learn more". Mobile and the nav keep the popover button.
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { posthog } from '@/lib/posthog';
import {
  INSTALL_AGENTS,
  type InstallAgent,
  type InstallAgentId,
} from '@/lib/install';
import { ToolLogo } from './PromptInstallButton';

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const HeroInstallOptions = () => {
  // The chip whose prompt was just copied swaps its logo for a check.
  const [copiedId, setCopiedId] = useState<InstallAgentId | null>(null);
  const resetTimer = useRef<number>();

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const activate = (item: InstallAgent) => {
    posthog.capture('download_clicked', {
      source: 'landing_hero',
      download_type: item.id,
    });

    navigator.clipboard.writeText(item.prompt).then(() => {
      toast.success('Prompt copied to clipboard', {
        description: `Paste into ${item.label} to install the Rivet MCP.`,
      });
      setCopiedId(item.id);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    // Same box as the hero pills (px-5 / 10px vertical / text-base) less the
    // chips' own padding, so it stands exactly as tall as "Learn more".
    <div
      role="group"
      aria-label="Install Rivet"
      className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-[linear-gradient(137.74deg,rgb(236,68,35)_41.128%,rgb(243,138,118)_121.74%)] py-[5px] pl-5 pr-[5px] font-aileron text-base leading-[1.164] tracking-[-0.16px] text-white"
    >
      <span className="mr-1.5 whitespace-nowrap" aria-hidden>
        Install Rivet for
      </span>
      {INSTALL_AGENTS.map((item) => (
        <button
          key={item.id}
          type="button"
          data-hero-install={item.id}
          onClick={() => activate(item)}
          aria-label={`Copy ${item.label} install prompt`}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-white/15 px-2.5 py-[5px] transition-colors hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {copiedId === item.id ? (
            <CheckIcon />
          ) : (
            <ToolLogo id={item.id} label={item.label} />
          )}
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default HeroInstallOptions;
