// Shown under the install CTA when a desktop deep link did not take the page's
// focus: the same install, as a command to paste, plus ways to get the app or
// retry. It keeps the original click's ref so the sign-in still matches.
import { X } from 'lucide-react';
import { telemetry, type CommandCopyMethod } from '@/lib/telemetry';
import {
  AGENT_DOWNLOAD_URLS,
  type DeepLinkAgentId,
  type InstallAgentId,
} from '@/lib/install';
import type { InstallRef } from '@/lib/installRef';
import { InstallCommandRow, useInstallCommandCopy } from './InstallCommandRow';

type HandoffFallbackProps = {
  agent: { id: DeepLinkAgentId; label: string };
  installRef: InstallRef;
  onRetry: () => void;
  onClose: () => void;
};

const HandoffFallback = ({
  agent,
  installRef,
  onRetry,
  onClose,
}: HandoffFallbackProps) => {
  const track = (id: InstallAgentId, copyMethod: CommandCopyMethod) => {
    telemetry.trackDownloadClicked({
      source: 'handoff_fallback',
      downloadType: id,
      copyMethod,
      installRef,
    });
    return installRef;
  };
  const { copiedId, copyFailed, rowProps } = useInstallCommandCopy(track);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-start gap-2">
        <p className="flex-1 font-main text-sm text-black">
          Didn’t open? Paste this into {agent.label} instead.
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="-m-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#818181] transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
        >
          <X aria-hidden size={16} />
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-secondary">
        <InstallCommandRow
          id={agent.id}
          label={agent.label}
          showCopyLabel
          {...rowProps(agent.id)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-main text-sm">
        <a
          href={AGENT_DOWNLOAD_URLS[agent.id]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-black underline decoration-black/30 underline-offset-2 hover:decoration-black"
        >
          Get {agent.label}
        </a>
        <button
          type="button"
          onClick={onRetry}
          className="font-medium text-black underline decoration-black/30 underline-offset-2 hover:decoration-black"
        >
          Try opening again
        </button>
      </div>
      <span
        role="status"
        className={
          copyFailed ? 'block font-main text-xs text-black' : 'sr-only'
        }
      >
        {copyFailed
          ? 'Command selected. Press ⌘C or Ctrl+C to copy.'
          : copiedId
            ? `${agent.label} install command copied`
            : ''}
      </span>
    </div>
  );
};

export default HandoffFallback;
