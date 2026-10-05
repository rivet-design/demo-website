import { toast } from 'sonner';
import { writeClipboard } from '@/lib/clipboard';
import {
  installNextSteps,
  type InstallAgentId,
  type InstallCopyKind,
} from '@/lib/install';
import { posthog } from '@/lib/posthog';

type InstallCopy = {
  agent: InstallAgentId;
  kind: InstallCopyKind;
  text: string;
};

const COPIED_TITLES: Record<InstallCopyKind, string> = {
  prompt: 'Prompt copied',
  command: 'Command copied',
};

const SUCCESS_DURATION_MS = 20_000;

const NextSteps = ({ steps }: { steps: string[] }) => (
  <ol className="mt-1 list-decimal space-y-0.5 pl-4">
    {steps.map((step) => (
      <li key={step}>{step}</li>
    ))}
  </ol>
);

const ManualCopyField = ({ text }: { text: string }) => (
  <textarea
    readOnly
    autoFocus
    value={text}
    rows={3}
    aria-label="Install text to copy"
    onFocus={(e) => e.currentTarget.select()}
    // Sonner captures the pointer for swipe-to-dismiss, which would swallow
    // the drag that selects text in this field.
    onPointerDown={(e) => e.stopPropagation()}
    className="type-code-sm mt-2 block w-full resize-none rounded-md border border-white/15 bg-white/10 p-2 text-white focus:outline-none focus:ring-1 focus:ring-white/40"
  />
);

export const copyInstallText = async ({
  agent,
  kind,
  text,
}: InstallCopy): Promise<boolean> => {
  const result = await writeClipboard(text);
  const steps = installNextSteps(kind, agent);

  if (result.ok) {
    toast.success(COPIED_TITLES[kind], {
      description: <NextSteps steps={steps} />,
      duration: SUCCESS_DURATION_MS,
      closeButton: true,
    });
    return true;
  }

  posthog.capture('install_copy_failed', {
    download_type: agent,
    copy_kind: kind,
    error_name: result.errorName,
  });
  toast.error(`Couldn't copy the ${kind}`, {
    description: (
      <>
        <p>Copy it from here, then:</p>
        <ManualCopyField text={text} />
        <NextSteps steps={steps} />
      </>
    ),
    duration: Infinity,
    closeButton: true,
  });
  return false;
};
