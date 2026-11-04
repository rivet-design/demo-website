import { EMBED_INSTALL_REF_IN_COPY, type InstallRef } from './installRef';

export type InstallAgentId =
  'claude' | 'claude-code' | 'cursor' | 'codex' | 'grokbot';
export type CommandInstallAgentId = Exclude<
  InstallAgentId,
  'codex' | 'grokbot'
>;
export type InstallTarget = InstallAgentId | 'agent';
type CommandInstallTarget = CommandInstallAgentId | 'agent';
export type DeepLinkAgentId = Exclude<
  InstallAgentId,
  'claude-code' | 'grokbot'
>;

export const AGENT_LOGOS: Record<InstallAgentId, string> = {
  claude: '/images/claude.svg',
  'claude-code': '/images/claude.svg',
  cursor: '/images/cursor.svg',
  codex: '/images/codex.svg',
  grokbot: '/images/grokbot.png',
};

export const GROKBOT_DOWNLOAD_URL = 'https://x.ai/bot';

export const GROKBOT_SETUP_PROMPT = `Set up Rivet in Grok Bot using a local stdio MCP connector on your cloud computer.

Install rivet-design@latest in a durable directory using a supported Node version. Load its dist/cli/handoff.js and verify that parseHandoff({callerAgent: "grokbot"}, {}) retains handoff.agent === "grokbot". If unsupported, stop and report the installed version and the need for a Rivet release with Grok Bot support.

Register the absolute Node executable as the connector command. Use the installed runtime's absolute bin/rivet.js path followed by "mcp", "serve", "--caller-agent", "grokbot" as its arguments. Set RIVET_PLUGIN_NAME=rivet, NODE_ENV=production, RIVET_AUTO_UPDATE_DISABLED=1, and RIVET_TELEMETRY_DISABLED=1 in the connector environment. Keep these paths and the runtime available across restarts.

Use your native workers and existing approval policy. Sign in through rivet_login, ask which project to use if needed, and open it with this runtime's CLI and environment using --no-browser and --caller-agent grokbot. Show previews in Computer view. Read saved design context with rivet_get_design_context({}) before exploring. Follow each returned workerPrompt and completeCommand exactly.`;

export const CODEX_PLUGIN_URL =
  'https://chatgpt.com/plugins/plugins_6ad7eb1d359c8191baea949a147fd869';

export const INSTALL_COMMANDS: Record<CommandInstallTarget, string> = {
  claude: 'npx -y rivet-design@latest install claude',
  'claude-code': 'npx -y rivet-design@latest install claude-code',
  // `--mcp` registers the `rivet mcp serve` server in ~/.cursor/mcp.json so
  // Rivet's MCP tools are available to Cursor. The install's global bootstrap
  // makes the registration durable (absolute path to the globally-installed
  // bin, not the ephemeral npx cache).
  cursor: 'npx -y rivet-design@latest install cursor --mcp',
  agent: 'npx -y rivet-design@latest install',
};

/** The command for one install, with attribution when embedding is enabled. */
export const copiedInstallCommand = (
  agent: CommandInstallTarget,
  ref: InstallRef,
): string =>
  EMBED_INSTALL_REF_IN_COPY
    ? `${INSTALL_COMMANDS[agent]} --ref ${ref}`
    : INSTALL_COMMANDS[agent];

export const installPrompt = (
  target: CommandInstallTarget,
  ref: InstallRef,
): string =>
  `Install Rivet for this agent: \`${copiedInstallCommand(target, ref)}\``;

/** Official download pages, offered when a deep link does not open the app. */
export const AGENT_DOWNLOAD_URLS: Record<DeepLinkAgentId, string> = {
  claude: 'https://claude.ai/download',
  codex: 'https://openai.com/codex/',
  cursor: 'https://cursor.com/download',
};

const INSTALL_DEEP_LINKS: Record<Exclude<DeepLinkAgentId, 'codex'>, string> = {
  claude: 'claude://code/new?q=',
  cursor: 'cursor://anysphere.cursor-deeplink/prompt?text=',
};

export const installDeepLink = (
  agent: DeepLinkAgentId,
  ref: InstallRef,
): string =>
  agent === 'codex'
    ? CODEX_PLUGIN_URL
    : `${INSTALL_DEEP_LINKS[agent]}${encodeURIComponent(installPrompt(agent, ref))}`;
