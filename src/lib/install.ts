import { EMBED_INSTALL_REF_IN_COPY, type InstallRef } from './installRef';

export type InstallAgentId = 'claude' | 'cursor' | 'codex';
export type InstallTarget = InstallAgentId | 'agent';
export type DeepLinkAgentId = Exclude<InstallAgentId, 'cursor'>;

export const AGENT_LOGOS: Record<InstallAgentId, string> = {
  claude: '/images/claude.svg',
  cursor: '/images/cursor.svg',
  codex: '/images/codex.svg',
};

export const INSTALL_COMMANDS: Record<InstallTarget, string> = {
  agent: 'npx -y rivet-design@latest install',
  claude: 'npx -y rivet-design@latest install claude',
  cursor: 'npx -y rivet-design@latest install cursor --mcp',
  codex: 'npx -y rivet-design@latest install codex',
};

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
};

export const installDeepLink = (
  agent: DeepLinkAgentId,
  ref: InstallRef,
): string =>
  `${INSTALL_DEEP_LINKS[agent]}${encodeURIComponent(installPrompt(agent, ref))}`;
