import { useMemo, useState } from 'react';

type InstallOption = {
  id: 'claude' | 'cursor' | 'codex';
  title: string;
  command: string;
  deepLink: string;
};

const encodeConfig = (value: unknown): string => {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
};

const toTerminalDeepLink = (command: string): string =>
  `terminal://run?command=${encodeURIComponent(command)}`;

const McpPage = () => {
  const [copiedId, setCopiedId] = useState<InstallOption['id'] | null>(null);

  const installOptions = useMemo<InstallOption[]>(
    () => [
      {
        id: 'claude',
        title: 'Claude Code',
        command: 'npx rivet-design install claude',
        deepLink: toTerminalDeepLink('npx rivet-design install claude'),
      },
      {
        id: 'cursor',
        title: 'Cursor',
        command: 'npx rivet-design install cursor',
        deepLink: `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(
          'Rivet',
        )}&config=${encodeURIComponent(
          encodeConfig({
            command: 'npx',
            args: ['rivet-design', 'install', 'cursor'],
          }),
        )}`,
      },
      {
        id: 'codex',
        title: 'Codex CLI',
        command: 'npx rivet-design install codex',
        deepLink: toTerminalDeepLink('npx rivet-design install codex'),
      },
    ],
    [],
  );

  const handleCopy = async (option: InstallOption) => {
    try {
      await navigator.clipboard.writeText(option.command);
      setCopiedId(option.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFFF3] px-[5vw] py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <a
          href="/"
          className="font-main inline-block w-fit text-sm text-[#555555] transition-colors hover:text-foreground"
        >
          ← Back
        </a>

        <div className="flex flex-col gap-2">
          <h1 className="font-main text-3xl font-normal text-foreground">Rivet MCP</h1>
          <p className="font-main text-base text-[#555555]">
            Click an install option below to run the setup command.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {installOptions.map((option) => (
            <section
              key={option.id}
              className="rounded-lg border border-[#E8E6DB] bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-main text-lg font-medium text-foreground">{option.title}</h2>
                <span className="font-main text-xs uppercase tracking-wide text-[#777777]">
                  Install
                </span>
              </div>

              <code className="font-mono mb-4 block overflow-x-auto rounded-md bg-[#F6F6F1] px-3 py-2 text-sm text-[#2A2A2A]">
                {option.command}
              </code>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={option.deepLink}
                  className="type-label rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-hover"
                >
                  Run command
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(option)}
                  className="type-label rounded-md border border-[#DAD8CC] bg-white px-4 py-2 text-foreground transition-colors hover:bg-[#F6F6F1]"
                >
                  {copiedId === option.id ? 'Copied' : 'Copy command'}
                </button>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default McpPage;
