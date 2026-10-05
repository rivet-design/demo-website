import { installNextSteps } from './install';

describe('installNextSteps', () => {
  it('walks a prompt copier through paste, approval, and sign-in for their agent', () => {
    expect(installNextSteps('prompt', 'claude')).toEqual([
      'Paste it into Claude Code.',
      'Allow the command when Claude Code asks.',
      'Sign in with Google in the browser window that opens.',
    ]);
    expect(installNextSteps('prompt', 'cursor')).toEqual([
      'Paste it into Cursor.',
      'Click Run when Cursor shows the command.',
      'Sign in with Google in the browser window that opens.',
    ]);
  });

  it('skips the agent steps for a command the user runs themselves', () => {
    expect(installNextSteps('command', 'codex')).toEqual([
      'Run it in your terminal.',
      'Sign in with Google in the browser window that opens.',
    ]);
  });
});
