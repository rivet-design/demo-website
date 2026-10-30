// One copyable install command, shared by the command accordion and the
// desktop-handoff fallback. Clicking anywhere on the row copies its command;
// the copy icon is the same action as a real button for keyboard and
// screen-reader users. The row shows the plain command and the copy carries
// the install ref the caller's `track` returns.
import { useRef, useState, type ClipboardEvent } from 'react';
import useClipboard from '@/hooks/useClipboard';
import type { CommandCopyMethod } from '@/lib/telemetry';
import {
  AGENT_LOGOS,
  INSTALL_COMMANDS,
  copiedInstallCommand,
  type CommandInstallAgentId,
} from '@/lib/install';
import type { InstallRef } from '@/lib/installRef';

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

/** Records one copy attempt and returns the ref to put in the copied command. */
export type TrackCommandCopy = (
  id: CommandInstallAgentId,
  copyMethod: CommandCopyMethod,
) => InstallRef;

type InstallCommandRowProps = {
  id: CommandInstallAgentId;
  label: string;
  copied: boolean;
  onRowClick: () => void;
  onIconClick: () => void;
  onCopy: (event: ClipboardEvent) => void;
  codeRef: (el: HTMLElement | null) => void;
};

export const useInstallCommandCopy = (track: TrackCommandCopy) => {
  const [copyFailed, setCopyFailed] = useState(false);
  // Which agent's command was just copied (drives that row's "Copied" state).
  const [copiedId, setCopiedId] = useState<CommandInstallAgentId | null>(null);
  const { copyToClipboard } = useClipboard();
  const codeRefs = useRef<
    Partial<Record<CommandInstallAgentId, HTMLElement | null>>
  >({});

  const copy = (
    id: CommandInstallAgentId,
    copyMethod: 'row_click' | 'icon',
  ) => {
    setCopyFailed(false);
    setCopiedId(null);
    const installRef = track(id, copyMethod);
    copyToClipboard(copiedInstallCommand(id, installRef)).then(
      () => {
        setCopiedId(id);
        setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
      },
      () => {
        // Leave the command selected so a keyboard copy is one keystroke away;
        // that copy is then counted as `manual_select`.
        selectContents(codeRefs.current[id] ?? null);
        setCopyFailed(true);
      },
    );
  };

  const handleManualCopy = (
    event: ClipboardEvent,
    id: CommandInstallAgentId,
  ) => {
    const selectedText = window.getSelection()?.toString().trim();
    if (!selectedText) return;
    const installRef = track(id, 'manual_select');
    if (selectedText !== INSTALL_COMMANDS[id]) return;
    const command = copiedInstallCommand(id, installRef);
    if (command === selectedText) return;
    event.clipboardData.setData('text/plain', command);
    event.preventDefault();
  };

  const handleRowClick = (id: CommandInstallAgentId) => {
    // A drag or double-click selection ends in a click; leave it alone so the
    // visitor can copy the text by hand.
    if (window.getSelection()?.isCollapsed === false) return;
    copy(id, 'row_click');
  };

  const rowProps = (
    id: CommandInstallAgentId,
  ): Omit<InstallCommandRowProps, 'id' | 'label'> => ({
    copied: copiedId === id,
    onRowClick: () => handleRowClick(id),
    onIconClick: () => copy(id, 'icon'),
    onCopy: (event) => handleManualCopy(event, id),
    codeRef: (el) => {
      codeRefs.current[id] = el;
    },
  });

  return { copiedId, copyFailed, rowProps };
};

export const InstallCommandRow = ({
  id,
  label,
  copied,
  onRowClick,
  onIconClick,
  onCopy,
  codeRef,
  showCopyLabel = false,
}: InstallCommandRowProps & {
  /** Keep the "Copy" label visible instead of revealing it on hover. */
  showCopyLabel?: boolean;
}) => (
  <div
    data-testid={`install-command-${id}`}
    onClick={onRowClick}
    onCopy={onCopy}
    className="group cursor-pointer px-4 py-3 transition-colors hover:bg-black/[0.03]"
  >
    <div className="flex items-center gap-2">
      <img
        src={AGENT_LOGOS[id]}
        alt=""
        width={14}
        height={14}
        className="shrink-0 brightness-0"
        aria-hidden
      />
      <span className="flex-1 text-left font-main text-sm font-medium text-accent-foreground">
        {label}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onIconClick();
        }}
        aria-label={`Copy ${label} install command`}
        className={`flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 font-main text-xs font-medium transition-colors hover:bg-black/5 hover:text-accent-foreground ${
          copied
            ? 'text-accent-foreground'
            : 'text-accent-foreground/60 group-hover:text-accent-foreground'
        }`}
      >
        <span
          aria-hidden
          className={
            copied || showCopyLabel
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
      ref={codeRef}
      className="type-code mt-1 block whitespace-pre-wrap break-words text-left text-accent-foreground/80"
    >
      {INSTALL_COMMANDS[id]}
    </code>
  </div>
);
