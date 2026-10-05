// Collapsible "install from the command line" accordion shown under the main
// install CTA. Expands to reveal the actual install command per coding agent.
// Clicking anywhere on a row copies its command; the copy icon is the same
// action as a real button for keyboard and screen-reader users. Styled with the
// Rivet design system; the grid-rows 0fr->1fr trick gives a smooth height
// animation.
import { useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import useClipboard from '@/hooks/useClipboard';
import { telemetry, type CommandCopyMethod } from '@/lib/telemetry';
import {
  AGENT_LOGOS,
  INSTALL_COMMANDS,
  type InstallAgentId,
} from '@/lib/install';

const AGENT_ROWS: { id: InstallAgentId; label: string }[] = [
  { id: 'codex', label: 'Codex' },
  { id: 'claude', label: 'Claude' },
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

const selectContents = (el: HTMLElement | null) => {
  const selection = window.getSelection();
  if (!el || !selection) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  selection.removeAllRanges();
  selection.addRange(range);
};

const hasSelectedText = () => Boolean(window.getSelection()?.toString().trim());

const InstallAccordion = () => {
  const [open, setOpen] = useState(false);
  // Which agent's command was just copied (drives that row's "Copied" state).
  const [copiedId, setCopiedId] = useState<InstallAgentId | null>(null);
  const { copyToClipboard } = useClipboard();
  const panelId = useId();
  const codeRefs = useRef<Partial<Record<InstallAgentId, HTMLElement | null>>>(
    {},
  );

  const track = (id: InstallAgentId, copyMethod: CommandCopyMethod) =>
    telemetry.trackDownloadClicked({
      source: 'landing_accordion',
      downloadType: id,
      copyMethod,
    });

  const copy = (id: InstallAgentId, copyMethod: 'row_click' | 'icon') => {
    track(id, copyMethod);
    copyToClipboard(INSTALL_COMMANDS[id]).then(
      () => {
        toast.success('Command copied to clipboard');
        setCopiedId(id);
        setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
      },
      () => {
        // Leave the command selected so a keyboard copy is one keystroke away;
        // that copy is then counted as `manual_select`.
        selectContents(codeRefs.current[id] ?? null);
        toast("Couldn't copy automatically", {
          description:
            'The command is selected. Press ⌘C or Ctrl+C to copy it.',
        });
      },
    );
  };

  const handleRowClick = (id: InstallAgentId) => {
    // A drag or double-click selection ends in a click; leave it alone so the
    // visitor can copy the text by hand.
    if (window.getSelection()?.isCollapsed === false) return;
    copy(id, 'row_click');
  };

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
            {AGENT_ROWS.map((row) => {
              const copied = copiedId === row.id;
              return (
                <div
                  key={row.id}
                  data-testid={`install-command-${row.id}`}
                  onClick={() => handleRowClick(row.id)}
                  onCopy={() => {
                    if (hasSelectedText()) track(row.id, 'manual_select');
                  }}
                  className="group cursor-pointer px-4 py-3 transition-colors hover:bg-black/[0.03]"
                >
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
                      onClick={(e) => {
                        e.stopPropagation();
                        copy(row.id, 'icon');
                      }}
                      aria-label={`Copy ${row.label} install command`}
                      className={`flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 font-main text-xs font-medium transition-colors hover:bg-black/5 hover:text-accent-foreground ${
                        copied
                          ? 'text-accent-foreground'
                          : 'text-accent-foreground/60 group-hover:text-accent-foreground'
                      }`}
                    >
                      <span
                        aria-hidden
                        className={
                          copied
                            ? ''
                            : 'opacity-0 transition-opacity group-hover:opacity-100'
                        }
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </span>
                      {copied ? <CheckIcon /> : <CopyIcon />}
                    </button>
                  </div>
                  <code
                    ref={(el) => {
                      codeRefs.current[row.id] = el;
                    }}
                    className="type-code mt-1 block text-left text-accent-foreground/80"
                  >
                    {INSTALL_COMMANDS[row.id]}
                  </code>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <span role="status" className="sr-only">
        {copiedLabel ? `${copiedLabel} install command copied` : ''}
      </span>
    </div>
  );
};

export default InstallAccordion;
