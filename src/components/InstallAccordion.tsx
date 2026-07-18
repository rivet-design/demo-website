// Collapsible "install from the command line" accordion shown under the main
// install CTA. Expands to reveal the actual install command per coding agent,
// each with its own copy-to-clipboard button. Styled with the Rivet design
// system; the grid-rows 0fr->1fr trick gives a smooth height animation.
import { useState } from 'react';
import { posthog } from '@/lib/posthog';
import {
  AGENT_LOGOS,
  INSTALL_COMMANDS,
  type InstallAgentId,
} from '@/lib/install';

const AGENT_ROWS: { id: InstallAgentId; label: string }[] = [
  { id: 'claude', label: 'Claude' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'codex', label: 'Codex' },
];

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    aria-hidden
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const CopyIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

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

const InstallAccordion = () => {
  const [open, setOpen] = useState(false);
  // Which agent's command was just copied (drives that row's check icon).
  const [copiedId, setCopiedId] = useState<InstallAgentId | null>(null);

  const copy = (id: InstallAgentId) => {
    posthog.capture('download_clicked', {
      source: 'landing_accordion',
      download_type: id,
    });
    navigator.clipboard.writeText(INSTALL_COMMANDS[id]).then(() => {
      setCopiedId(id);
      setTimeout(
        () => setCopiedId((cur) => (cur === id ? null : cur)),
        2000,
      );
    });
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mx-auto flex items-center gap-1.5 font-main text-sm font-medium text-black/70 transition-colors hover:text-black"
      >
        Or run the install command yourself
        <ChevronIcon open={open} />
      </button>

      {/* Smoothly-expanding content. */}
      <div
        className={`grid transition-all duration-200 ease-out ${
          open
            ? 'mt-3 grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="divide-y divide-border rounded-lg border border-border bg-secondary">
            {AGENT_ROWS.map((row) => (
              <div key={row.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <img
                    src={AGENT_LOGOS[row.id]}
                    alt=""
                    width={14}
                    height={14}
                    className="shrink-0 brightness-0"
                    aria-hidden
                  />
                  <span className="flex-1 text-left font-main text-sm font-medium text-accent-foreground">
                    {row.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(row.id)}
                    aria-label={`Copy ${row.label} install command`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-accent-foreground/60 transition-colors hover:bg-black/5 hover:text-accent-foreground"
                  >
                    {copiedId === row.id ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>
                <code className="type-code mt-1 block text-left text-accent-foreground/80">
                  {INSTALL_COMMANDS[row.id]}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallAccordion;
