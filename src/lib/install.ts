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
  // `--mcp` registers the `rivet mcp serve` server in ~/.cursor/mcp.json so
  // Rivet's MCP tools are available to Cursor. The install's global bootstrap
  // makes the registration durable (absolute path to the globally-installed
  // bin, not the ephemeral npx cache).
  cursor: 'npx -y rivet-design@latest install cursor --mcp',
  codex: 'npx -y rivet-design@latest install codex',
};

// A prompt is pasted into the agent, which runs the command for the user. A
// command is run by the user in their own terminal.
export type InstallCopyKind = 'prompt' | 'command';

const SIGN_IN_STEP = 'Sign in with Google in the browser window that opens.';

const approveStep = (agent: InstallAgentId): string => {
  switch (agent) {
    case 'codex':
      return 'Approve the command when Codex asks.';
    case 'claude':
      return 'Allow the command when Claude Code asks.';
    case 'cursor':
      return 'Click Run when Cursor shows the command.';
    default: {
      const unhandled: never = agent;
      return unhandled;
    }
  }
};

const AGENT_APP_NAMES: Record<InstallAgentId, string> = {
  codex: 'Codex',
  claude: 'Claude Code',
  cursor: 'Cursor',
};

export const installNextSteps = (
  kind: InstallCopyKind,
  agent: InstallAgentId,
): string[] => {
  switch (kind) {
    case 'prompt':
      return [
        `Paste it into ${AGENT_APP_NAMES[agent]}.`,
        approveStep(agent),
        SIGN_IN_STEP,
      ];
    case 'command':
      return ['Run it in your terminal.', SIGN_IN_STEP];
    default: {
      const unhandled: never = kind;
      return unhandled;
    }
  }
};
