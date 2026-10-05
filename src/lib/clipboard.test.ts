import { writeClipboard } from './clipboard';

const stubClipboard = (clipboard: Partial<Clipboard> | undefined) => {
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboard,
    configurable: true,
  });
};

describe('writeClipboard', () => {
  it('writes the text and reports success', async () => {
    let written = '';
    stubClipboard({
      writeText: async (text: string) => {
        written = text;
      },
    });

    await expect(writeClipboard('npx rivet')).resolves.toEqual({ ok: true });
    expect(written).toBe('npx rivet');
  });

  it('reports the error name when the browser denies the write', async () => {
    stubClipboard({
      writeText: () =>
        Promise.reject(new DOMException('denied', 'NotAllowedError')),
    });

    await expect(writeClipboard('npx rivet')).resolves.toEqual({
      ok: false,
      errorName: 'NotAllowedError',
    });
  });

  it('reports a failure when the clipboard API is missing', async () => {
    stubClipboard(undefined);

    await expect(writeClipboard('npx rivet')).resolves.toEqual({
      ok: false,
      errorName: 'TypeError',
    });
  });
});
