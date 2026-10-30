import * as installRef from './installRef';
import { CODEX_PLUGIN_URL, installDeepLink, installPrompt } from './install';

const REF = 'r_aZ09bY18' as const;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('installPrompt', () => {
  it('keeps the universal prompt to one short sentence', () => {
    jest.replaceProperty(installRef, 'EMBED_INSTALL_REF_IN_COPY', false);

    expect(installPrompt('agent', REF)).toBe(
      'Install Rivet for this agent: `npx -y rivet-design@latest install`',
    );
  });

  it('preserves attribution inside the universal command', () => {
    expect(installPrompt('agent', REF)).toBe(
      'Install Rivet for this agent: `npx -y rivet-design@latest install --ref r_aZ09bY18`',
    );
  });

  it.each([
    ['claude', 'claude'],
    ['cursor', 'cursor --mcp'],
  ] as const)('targets only the selected %s coding agent', (agent, target) => {
    expect(installPrompt(agent, REF)).toBe(
      `Install Rivet for this agent: \`npx -y rivet-design@latest install ${target} --ref ${REF}\``,
    );
  });
});

describe('installDeepLink', () => {
  it('opens the Codex plugin listing without CLI arguments or a composer prompt', () => {
    expect(installDeepLink('codex', REF)).toBe(CODEX_PLUGIN_URL);
    jest.replaceProperty(installRef, 'EMBED_INSTALL_REF_IN_COPY', false);
    expect(installDeepLink('codex', REF)).toBe(CODEX_PLUGIN_URL);
  });

  it.each([
    ['claude', 'claude:', 'code', '/new', 'q'],
    ['cursor', 'cursor:', 'anysphere.cursor-deeplink', '/prompt', 'text'],
  ] as const)(
    'prefills the %s coding composer with its attributed prompt',
    (agent, protocol, hostname, pathname, parameter) => {
      const link = installDeepLink(agent, REF);
      const url = new URL(link);

      expect(url.protocol).toBe(protocol);
      expect(url.hostname).toBe(hostname);
      expect(url.pathname).toBe(pathname);
      expect([...url.searchParams.keys()]).toEqual([parameter]);
      expect(url.searchParams.get(parameter)).toBe(
        `Install Rivet for this agent: \`npx -y rivet-design@latest install ${agent}${agent === 'cursor' ? ' --mcp' : ''} --ref r_aZ09bY18\``,
      );
      expect(link).not.toContain(' ');
      expect(link).not.toContain('`');
    },
  );

  it.each(['claude', 'cursor'] as const)(
    'respects the attribution rollout flag in %s deep links',
    (agent) => {
      jest.replaceProperty(installRef, 'EMBED_INSTALL_REF_IN_COPY', false);

      const url = new URL(installDeepLink(agent, REF));
      const parameter = agent === 'claude' ? 'q' : 'text';
      expect(url.searchParams.get(parameter)).toBe(
        `Install Rivet for this agent: \`npx -y rivet-design@latest install ${agent}${agent === 'cursor' ? ' --mcp' : ''}\``,
      );
    },
  );
});
