// Per-agent Rivet install data shared by the CTA dropdown (PromptInstallButton),
// the hero's agent buttons (HeroInstallOptions) and the CLI-command accordion
// (InstallAccordion), so the commands the site
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
  // `--mcp` registers the `rivet mcp serve` server in ~/.cursor/mcp.json so
  // Rivet's MCP tools are available to Cursor. The install's global bootstrap
  // makes the registration durable (absolute path to the globally-installed
  // bin, not the ephemeral npx cache).
  cursor: 'npx -y rivet-design@latest install cursor --mcp',
  codex: 'npx -y rivet-design@latest install codex',
};

export type InstallAgent = {
  id: InstallAgentId;
  label: string;
  prompt: string;
};

// Agent choices in display order, each with the paste-ready prompt that runs
// its install command. Users rarely know which Claude surface they're on, so
// the Claude prompt names both explicitly — the command itself shows what
// gets set up (Claude Code + Claude Desktop chat MCP).
export const INSTALL_AGENTS: InstallAgent[] = [
  {
    id: 'codex',
    label: 'Codex',
    prompt: `Please set up Rivet for Codex by running: ${INSTALL_COMMANDS.codex}`,
  },
  {
    id: 'claude',
    label: 'Claude',
    prompt: `Please set up Rivet for Claude Code and Claude Desktop by running: ${INSTALL_COMMANDS.claude}`,
  },
  {
    id: 'cursor',
    label: 'Cursor',
    prompt: `Please set up Rivet for Cursor by running: ${INSTALL_COMMANDS.cursor}`,
  },
];
