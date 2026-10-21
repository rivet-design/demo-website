// Per-agent Rivet install data shared by the CTA dropdown (PromptInstallButton)
// and the CLI-command accordion (InstallAccordion), so the commands the site
// shows and the commands embedded in copy prompts can never drift apart.
//
// Command shape: `-y` keeps npx non-interactive (agents run these headlessly,
// where npx's "Ok to proceed?" prompt would stall) and `@latest` forces a
// registry resolve so a stale npx cache or old global install never serves an
// outdated version. The agent ids mirror rivet core's harness registry.
import { EMBED_INSTALL_REF_IN_COPY, type InstallRef } from './installRef';

export type InstallAgentId = 'claude' | 'claude-code' | 'cursor' | 'codex';
export type InstallTarget = InstallAgentId | 'agent';
export type DeepLinkAgentId = Exclude<InstallAgentId, 'claude-code'>;

export const AGENT_LOGOS: Record<InstallAgentId, string> = {
  claude: '/images/claude.svg',
  'claude-code': '/images/claude.svg',
  cursor: '/images/cursor.svg',
  codex: '/images/codex.svg',
};

export const INSTALL_COMMANDS: Record<InstallTarget, string> = {
  claude: 'npx -y rivet-design@latest install claude',
  'claude-code': 'npx -y rivet-design@latest install claude-code',
  // `--mcp` registers the `rivet mcp serve` server in ~/.cursor/mcp.json so
  // Rivet's MCP tools are available to Cursor. The install's global bootstrap
  // makes the registration durable (absolute path to the globally-installed
  // bin, not the ephemeral npx cache).
  cursor: 'npx -y rivet-design@latest install cursor --mcp',
  codex: 'npx -y rivet-design@latest install codex',
  agent: 'npx -y rivet-design@latest install',
};

/** The command for one install, with attribution when embedding is enabled. */
export const copiedInstallCommand = (
  agent: InstallTarget,
  ref: InstallRef,
): string =>
  EMBED_INSTALL_REF_IN_COPY
    ? `${INSTALL_COMMANDS[agent]} --ref ${ref}`
    : INSTALL_COMMANDS[agent];

export const installPrompt = (target: InstallTarget, ref: InstallRef): string =>
  `Install Rivet for this agent: \`${copiedInstallCommand(target, ref)}\``;

const INSTALL_DEEP_LINKS: Record<DeepLinkAgentId, string> = {
  claude: 'claude://code/new?q=',
  codex: 'codex://new?prompt=',
  cursor: 'cursor://anysphere.cursor-deeplink/prompt?text=',
};

export const installDeepLink = (
  agent: DeepLinkAgentId,
  ref: InstallRef,
): string =>
  `${INSTALL_DEEP_LINKS[agent]}${encodeURIComponent(installPrompt(agent, ref))}`;
