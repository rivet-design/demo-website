// Per-agent Rivet install data shared by the CTA dropdown (PromptInstallButton)
// and the CLI-command accordion (InstallAccordion), so the commands the site
// shows and the commands embedded in copy prompts can never drift apart.
//
// Command shape: `-y` keeps npx non-interactive (agents run these headlessly,
// where npx's "Ok to proceed?" prompt would stall) and `@latest` forces a
// registry resolve so a stale npx cache or old global install never serves an
// outdated version. The agent ids mirror rivet core's harness registry.
export type InstallAgentId = 'claude' | 'cursor' | 'codex';

export const AGENT_LOGOS: Record<InstallAgentId, string> = {
  claude: '/images/claude.svg',
  cursor: '/images/cursor.svg',
  codex: '/images/codex.svg',
};

export const INSTALL_COMMANDS: Record<InstallAgentId, string> = {
  claude: 'npx -y rivet-design@latest install claude-code claude-desktop',
  cursor: 'npx -y rivet-design@latest install cursor',
  codex: 'npx -y rivet-design@latest install codex',
};
