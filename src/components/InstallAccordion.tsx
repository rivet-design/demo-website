// Collapsible "install from the command line" accordion shown under the main
// install CTA. Expands to reveal the CLI command with a copy-to-clipboard
// button. Styled with the Rivet design system; the grid-rows 0fr->1fr trick
// gives a smooth height animation.
import { useState } from 'react';

const INSTALL_CMD = 'npx -y rivet-design@latest install';

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
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(INSTALL_CMD).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        Or paste this into your agent
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
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary px-4 py-3">
            <code className="type-code truncate text-accent-foreground">
              {INSTALL_CMD}
            </code>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy install command"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-accent-foreground/60 transition-colors hover:bg-black/5 hover:text-accent-foreground"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallAccordion;
