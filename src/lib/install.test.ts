import * as installRef from './installRef';
import { installDeepLink, installPrompt } from './install';

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

  it.each(['claude', 'codex'] as const)(
    'targets only the selected %s coding agent',
    (agent) => {
      expect(installPrompt(agent, REF)).toBe(
        `Install Rivet for this agent: \`npx -y rivet-design@latest install ${agent} --ref ${REF}\``,
      );
    },
  );
});

describe('installDeepLink', () => {
  it.each([
    ['claude', 'claude:', 'code', '/new', 'q'],
    ['codex', 'codex:', 'new', '', 'prompt'],
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
        `Install Rivet for this agent: \`npx -y rivet-design@latest install ${agent} --ref r_aZ09bY18\``,
      );
      expect(link).not.toContain(' ');
      expect(link).not.toContain('`');
    },
  );

  it('respects the attribution rollout flag in deep links', () => {
    jest.replaceProperty(installRef, 'EMBED_INSTALL_REF_IN_COPY', false);

    const url = new URL(installDeepLink('claude', REF));
    expect(url.searchParams.get('q')).toBe(
      'Install Rivet for this agent: `npx -y rivet-design@latest install claude`',
    );
  });
});
