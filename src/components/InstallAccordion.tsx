// Collapsible "install from the command line" accordion shown under the main
// install CTA. Expands to reveal the actual install command per coding agent.
// Styled with the Rivet design system; the grid-rows 0fr->1fr trick gives a
// smooth height animation.
import { useId, useState } from 'react';
import { telemetry, type CommandCopyMethod } from '@/lib/telemetry';
import type { InstallAgentId } from '@/lib/install';
import { generateInstallRef } from '@/lib/installRef';
import { InstallCommandRow, useInstallCommandCopy } from './InstallCommandRow';

const AGENT_ROWS: { id: InstallAgentId; label: string }[] = [
  { id: 'codex', label: 'Codex' },
  { id: 'claude', label: 'Claude' },
  { id: 'claude-code', label: 'Claude Code' },
  { id: 'cursor', label: 'Cursor' },
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

const track = (id: InstallAgentId, copyMethod: CommandCopyMethod) => {
  const installRef = generateInstallRef();
  telemetry.trackDownloadClicked({
    source: 'landing_accordion',
    downloadType: id,
    copyMethod,
    installRef,
  });
  return installRef;
};

const InstallAccordion = () => {
  const [open, setOpen] = useState(false);
  const { copiedId, copyFailed, rowProps } = useInstallCommandCopy(track);
  const panelId = useId();

  const copiedLabel = AGENT_ROWS.find((row) => row.id === copiedId)?.label;

  return (
    <div className="w-full">
      {/* Padding widens the hit area; the matching negative margin keeps the
          layout where it was. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="-my-2 mx-auto flex items-center gap-1.5 rounded-md px-3 py-2 font-main text-sm font-medium text-black/70 transition-colors hover:text-black"
      >
        Or run the install command yourself
        <ChevronIcon open={open} />
      </button>

      {/* Smoothly-expanding content. `invisible` keeps the collapsed rows out
          of the tab order and the accessibility tree; visibility flips at the
          end of the closing transition, so the animation is unaffected. */}
      <div
        id={panelId}
        className={`grid transition-all duration-200 ease-out ${
          open
            ? 'visible mt-3 grid-rows-[1fr] opacity-100'
            : 'invisible grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-secondary">
            {AGENT_ROWS.map((row) => (
              <InstallCommandRow
                key={row.id}
                id={row.id}
                label={row.label}
                {...rowProps(row.id)}
              />
            ))}
          </div>
        </div>
      </div>
      <span
        role="status"
        className={
          copyFailed
            ? 'mt-2 block text-sm text-accent-foreground/70'
            : 'sr-only'
        }
      >
        {copyFailed
          ? 'Command selected. Press ⌘C or Ctrl+C to copy.'
          : copiedLabel
            ? `${copiedLabel} install command copied`
            : ''}
      </span>
    </div>
  );
};

export default InstallAccordion;
