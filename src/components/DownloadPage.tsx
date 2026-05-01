import { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { posthog } from '@/lib/posthog';
import NavBar from './NavBar';
import Footer from './Footer';

const R2_PUBLIC_URL = 'https://releases.rivet.design';

type ReleaseManifest = {
  version: string;
  url: string;
};

type InstallTool = 'claude' | 'cursor' | 'codex';

const TOOL_LOGOS: Record<InstallTool, string> = {
  claude: '/images/claude.svg',
  cursor: '/images/cursor.svg',
  codex: '/images/codex.svg',
};

const ToolLogo = ({ id, label }: { id: InstallTool; label: string }) => (
  <img
    src={TOOL_LOGOS[id]}
    alt={label}
    width={20}
    height={20}
    className="shrink-0 brightness-0"
  />
);

type ToolOption =
  | { id: InstallTool; label: string; action: 'copy'; command: string }
  | { id: InstallTool; label: string; action: 'deeplink'; url: string };

const TOOL_OPTIONS: ToolOption[] = [
  {
    id: 'claude',
    label: 'Claude Code',
    action: 'copy',
    command: 'npx rivet-design install claude',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    action: 'deeplink',
    url: 'cursor://anysphere.cursor-deeplink/mcp/install?name=rivet&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsInJpdmV0LWRlc2lnbkBsYXRlc3QiLCJtY3AiLCItLWVkaXRvciIsImN1cnNvciJdfQ==',
  },
  {
    id: 'codex',
    label: 'Codex',
    action: 'copy',
    command: 'npx rivet-design install codex',
  },
];

const parseYamlManifest = (yaml: string): ReleaseManifest => {
  const versionMatch = yaml.match(/^version:\s*(.+)$/m);
  if (!versionMatch) throw new Error('Invalid manifest format');
  const version = versionMatch[1].trim();
  return {
    version,
    url: `${R2_PUBLIC_URL}/Rivet-${version}-arm64.dmg`,
  };
};

const DownloadPage = () => {
  const [manifest, setManifest] = useState<ReleaseManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${R2_PUBLIC_URL}/latest-mac.yml`)
      .then((res) => (res.ok ? res.text() : Promise.reject('Fetch failed')))
      .then((yaml) => setManifest(parseYamlManifest(yaml)))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleMcpAction = (tool: ToolOption) => {
    posthog.capture('mcp_setup_clicked', { tool: tool.id, source: 'download_page' });
    if (tool.action === 'deeplink') {
      window.location.href = tool.url;
    } else {
      navigator.clipboard.writeText(tool.command).then(() => {
        setCopiedId(tool.id);
        toast.success(`Copied to clipboard`, {
          description: `Paste this command into your terminal to install the ${tool.label} MCP server.`,
        });
        setTimeout(() => setCopiedId(null), 2000);
      });
    }
  };

  const handleDownload = (url: string) => {
    posthog.capture('download_clicked', { source: 'download_page', download_type: 'mac', url });
    window.location.href = url;
  };

  return (
    <>
      <Toaster position="bottom-right" theme="light" />
      <div className="flex min-h-screen flex-col bg-[#FAF9F7] px-[5vw] font-main text-green">
        <NavBar />
        
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col py-14 md:py-20">
          <header className="mb-12 space-y-6">
            <div className="text-center">
              <h1 className="font-main text-[32px] font-medium leading-[1.15] tracking-tight md:text-[44px]">
                Downloads
              </h1>
            </div>
          </header>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Desktop Section */}
            <section
              id="desktop-install"
              className="flex flex-col rounded-2xl border border-green/[0.08] bg-white p-8"
            >
              <div className="mb-6">
                <h2 className="mb-2 font-main text-[30px] font-medium tracking-tight">
                  Desktop App
                </h2>
                <p className="text-[15px] leading-relaxed text-green/55">
                  Native editor with full visual tooling.
                </p>
              </div>

              <div className="flex flex-1 flex-col justify-between gap-8 py-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green/[0.03]">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-green"
                        aria-hidden="true"
                      >
                        <path d="M18 17.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM6 17.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM12 17.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z" fill="currentColor" opacity="0.4"/>
                        <path d="M4 11V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M2 11h20v6a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-green/50">Platform</div>
                      <div className="font-main text-lg font-semibold text-green">macOS</div>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="h-2 w-full animate-pulse rounded-full bg-green/5" />
                ) : error ? (
                  <p className="text-sm text-red-500">Failed to load manifest. Please try again later.</p>
                ) : (
                  <div>
                    <button
                      onClick={() => handleDownload(manifest!.url)}
                      className="type-label-lg flex w-full items-center justify-center rounded-xl bg-primary px-6 py-4 text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      Download for Mac
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* MCP Section */}
            <section
              id="mcp-install"
              className="flex flex-col rounded-2xl border border-green/[0.08] bg-white p-8"
            >
              <div className="mb-6">
                <h2 className="mb-2 font-main text-[30px] font-medium tracking-tight">MCP Setup</h2>
                <p className="text-[15px] leading-relaxed text-green/55">
                  Connect Rivet directly inside Claude, Cursor, or Codex.
                </p>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                {TOOL_OPTIONS.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleMcpAction(tool)}
                    className="group flex items-center gap-4 rounded-xl border border-green/[0.06] bg-green/[0.01] p-4 transition-colors hover:border-primary/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green/5 transition-colors group-hover:bg-primary/5">
                      <ToolLogo id={tool.id} label={tool.label} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-main font-semibold text-green">{tool.label}</div>
                      <div className="text-xs text-green/45">
                        {tool.action === 'deeplink' ? 'Direct installation' : 'Terminal command'}
                      </div>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green/[0.04] text-green/30 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      {copiedId === tool.id ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : tool.action === 'deeplink' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6m4-3l5 5m0-5l-5 5m5-5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default DownloadPage;
