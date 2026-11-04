import { useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import useClipboard from '@/hooks/useClipboard';
import { GROKBOT_DOWNLOAD_URL, GROKBOT_SETUP_PROMPT } from '@/lib/install';
import { telemetry, type PromptInstallSource } from '@/lib/telemetry';

type GrokBotSetupProps = {
  source: PromptInstallSource;
  onClose: () => void;
};

const GrokBotSetup = ({ source, onClose }: GrokBotSetupProps) => {
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const { isCopied, copyToClipboard } = useClipboard();
  const [isCopyFailed, setIsCopyFailed] = useState(false);
  const isPromptCopied = isCopied && !isCopyFailed;
  const copyPrompt = async () => {
    setIsCopyFailed(false);
    try {
      await copyToClipboard(GROKBOT_SETUP_PROMPT);
      telemetry.trackDownloadClicked({
        source,
        downloadType: 'grokbot',
        installMethod: 'local_mcp',
        copyMethod: 'row_click',
      });
    } catch {
      setIsCopyFailed(true);
      promptRef.current?.focus();
      promptRef.current?.select();
    }
  };
  let status = '';
  if (isCopyFailed) status = 'Prompt selected. Press ⌘C or Ctrl+C to copy.';
  else if (isPromptCopied) status = 'Prompt copied. Paste it into Grok Bot.';

  return (
    <div
      className="flex flex-col gap-3 p-4"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div className="flex items-start gap-2">
        <h3 className="flex-1 font-main text-sm font-medium text-black">
          Set up Rivet in Grok Bot
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss Grok Bot setup"
          className="-m-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#818181] hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
        >
          <X aria-hidden size={16} />
        </button>
      </div>
      <p className="font-main text-xs leading-relaxed text-[#818181]">
        Paste this prompt into Grok Bot to connect Rivet using local MCP. Review
        your design directions in Computer view.
      </p>
      <textarea
        ref={promptRef}
        aria-label="Grok Bot setup prompt"
        readOnly
        rows={5}
        value={GROKBOT_SETUP_PROMPT}
        className="w-full resize-none rounded-lg border border-border bg-secondary p-3 font-mono text-xs leading-relaxed text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
      />
      <button
        type="button"
        autoFocus
        onClick={() => void copyPrompt()}
        aria-label="Copy Grok Bot setup prompt"
        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-main text-sm font-medium text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
      >
        {isPromptCopied ? (
          <Check aria-hidden size={16} />
        ) : (
          <Copy aria-hidden size={16} />
        )}
        {isPromptCopied ? 'Copied' : 'Copy setup prompt'}
      </button>
      <a
        href={GROKBOT_DOWNLOAD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start font-main text-xs font-medium text-black underline decoration-black/30 underline-offset-2 hover:decoration-black"
      >
        Get Grok Bot
      </a>
      <span role="status" className="font-main text-xs text-black">
        {status}
      </span>
    </div>
  );
};

export default GrokBotSetup;
