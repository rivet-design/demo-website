import * as installRef from './installRef';
import { copiedInstallCommand, INSTALL_COMMANDS } from './install';

const { generateInstallRef, isInstallRef, parseInstallRef } = installRef;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('generateInstallRef', () => {
  it('is r_ plus 8 base62 characters', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateInstallRef()).toMatch(/^r_[0-9A-Za-z]{8}$/);
    }
  });

  it('is fresh on every call', () => {
    const refs = new Set(Array.from({ length: 500 }, generateInstallRef));
    expect(refs.size).toBe(500);
  });

  it('skips bytes that would bias the alphabet', () => {
    const bytes = [255, 248, 0, 61, 62, 247, 10, 36, 35, 1];
    jest
      .spyOn(globalThis.crypto, 'getRandomValues')
      .mockImplementation(<T extends ArrayBufferView | null>(array: T): T => {
        const view = array as unknown as Uint8Array;
        view.forEach((_, i) => {
          view[i] = bytes.shift() ?? 0;
        });
        return array;
      });

    // 255 and 248 are dropped; the rest map to byte % 62.
    expect(generateInstallRef()).toBe('r_0z0zAaZ1');
  });
});

describe('parseInstallRef', () => {
  it('accepts a well-formed ref', () => {
    expect(parseInstallRef('r_aZ09bY18')).toBe('r_aZ09bY18');
    expect(isInstallRef('r_aZ09bY18')).toBe(true);
  });

  it.each([
    ['missing', null],
    ['empty', ''],
    ['no prefix', 'aZ09bY18'],
    ['wrong prefix', 'x_aZ09bY18'],
    ['too short', 'r_aZ09bY1'],
    ['too long', 'r_aZ09bY189'],
    ['non-base62', 'r_aZ09bY-8'],
    ['trailing junk', 'r_aZ09bY18 '],
    ['an email', 'someone@example.com'],
  ])('rejects %s', (_, raw) => {
    expect(parseInstallRef(raw)).toBeNull();
  });
});

describe('copiedInstallCommand', () => {
  const ref = 'r_aZ09bY18' as const;

  it('copies the plain command while the flag is off', () => {
    expect(installRef.EMBED_INSTALL_REF_IN_COPY).toBe(false);
    expect(copiedInstallCommand('codex', ref)).toBe(INSTALL_COMMANDS.codex);
  });

  it('appends --ref once the flag is on', () => {
    jest.replaceProperty(installRef, 'EMBED_INSTALL_REF_IN_COPY', true);

    expect(copiedInstallCommand('cursor', ref)).toBe(
      'npx -y rivet-design@latest install cursor --mcp --ref r_aZ09bY18',
    );
  });
});
