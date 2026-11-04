import { act, StrictMode, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import useClipboard from './useClipboard';

type ClipboardHandle = ReturnType<typeof useClipboard>;

type ClipboardButtonProps = {
  id?: string;
  resetDelay?: number;
  onRender: (clipboard: ClipboardHandle) => void;
};

const ClipboardButton = ({
  id = 'copy',
  resetDelay,
  onRender,
}: ClipboardButtonProps) => {
  const clipboard = useClipboard(resetDelay);
  onRender(clipboard);
  return <button id={id}>{clipboard.isCopied ? 'Copied' : 'Copy'}</button>;
};

const pendingWrite = () => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let isRootMounted: boolean;
let clipboard: ClipboardHandle;
let writeText: jest.Mock;
const execCommandDescriptor = Object.getOwnPropertyDescriptor(
  document,
  'execCommand',
);

const render = (element?: ReactElement) =>
  act(() => {
    root.render(
      element ?? <ClipboardButton onRender={(value) => (clipboard = value)} />,
    );
  });

const unmount = () => {
  act(() => root.unmount());
  isRootMounted = false;
};

const wait = (milliseconds: number) =>
  act(() => jest.advanceTimersByTime(milliseconds));

const copy = async (text = 'Rivet setup') => {
  await act(async () => clipboard.copyToClipboard(text));
};

beforeEach(() => {
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  isRootMounted = true;
  writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  Object.defineProperty(window, 'isSecureContext', {
    value: true,
    configurable: true,
  });
});

afterEach(() => {
  if (isRootMounted) unmount();
  container.remove();
  jest.useRealTimers();
  jest.restoreAllMocks();
  if (execCommandDescriptor) {
    Object.defineProperty(document, 'execCommand', execCommandDescriptor);
  } else {
    Reflect.deleteProperty(document, 'execCommand');
  }
});

it.each([2000, 800])(
  'keeps feedback for %s ms after the latest successful copy',
  async (resetDelay) => {
    render(
      <ClipboardButton
        resetDelay={resetDelay}
        onRender={(value) => (clipboard = value)}
      />,
    );
    expect(container.textContent).toBe('Copy');
    await copy('first');
    wait(resetDelay - 100);
    await copy('second');
    wait(100);
    expect(container.textContent).toBe('Copied');
    wait(resetDelay - 101);
    expect(container.textContent).toBe('Copied');
    wait(1);
    expect(container.textContent).toBe('Copy');
    expect(writeText.mock.calls).toEqual([['first'], ['second']]);
  },
);

it('keeps a full interval when successful copies share a timestamp', async () => {
  render();
  await copy('first');
  await copy('second');
  wait(1999);
  expect(container.textContent).toBe('Copied');
  wait(1);
  expect(container.textContent).toBe('Copy');
  expect(writeText.mock.calls).toEqual([['first'], ['second']]);
});

it('applies a changed delay to future copies without changing an active deadline', async () => {
  const renderWithDelay = (resetDelay: number) =>
    render(
      <ClipboardButton
        resetDelay={resetDelay}
        onRender={(value) => (clipboard = value)}
      />,
    );
  renderWithDelay(1000);
  await copy();
  wait(400);
  renderWithDelay(3000);
  wait(599);
  expect(container.textContent).toBe('Copied');
  wait(1);
  expect(container.textContent).toBe('Copy');
  await copy();
  wait(2999);
  expect(container.textContent).toBe('Copied');
  wait(1);
  expect(container.textContent).toBe('Copy');
});

it.each(['success', 'false', 'throw'] as const)(
  'restores focus and removes temporary DOM after fallback %s',
  async (result) => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let selection: {
      command: string;
      tagName: string;
      value: string;
      start: number;
      end: number;
    };
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: jest.fn((command: string) => {
        const textarea = document.activeElement as HTMLTextAreaElement;
        selection = {
          command,
          tagName: textarea.tagName,
          value: textarea.value,
          start: textarea.selectionStart,
          end: textarea.selectionEnd,
        };
        if (result === 'throw') throw new Error('Clipboard unavailable');
        return result === 'success';
      }),
    });
    render();
    const button = container.querySelector('button')!;
    button.focus();
    if (result === 'success') {
      await copy();
      expect(container.textContent).toBe('Copied');
      expect(warning).not.toHaveBeenCalled();
    } else {
      await act(async () => {
        await expect(clipboard.copyToClipboard('Rivet setup')).rejects.toThrow(
          'Fallback copy failed',
        );
      });
      expect(container.textContent).toBe('Copy');
      expect(warning.mock.calls).toEqual([
        [
          'Failed to copy text to clipboard:',
          new Error('Fallback copy failed'),
        ],
      ]);
    }
    expect(selection!).toEqual({
      command: 'copy',
      tagName: 'TEXTAREA',
      value: 'Rivet setup',
      start: 0,
      end: 11,
    });
    expect(document.activeElement).toBe(button);
    expect(document.querySelector('textarea')).toBeNull();
  },
);

it('removes fallback DOM when the previous focus target is disconnected', async () => {
  const origin = document.createElement('button');
  document.body.appendChild(origin);
  Object.defineProperty(window, 'isSecureContext', {
    value: false,
    configurable: true,
  });
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: jest.fn(() => {
      origin.remove();
      return true;
    }),
  });
  render();
  origin.focus();
  await act(async () => clipboard.copyToClipboard('Rivet setup'));
  expect(clipboard.isCopied).toBe(true);
  expect(document.activeElement).toBe(document.body);
  expect(document.querySelector('textarea')).toBeNull();
});

it('preserves the prior success deadline when a native copy fails', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const denied = new Error('Clipboard denied');
  render();
  await copy('first');
  wait(1000);
  writeText.mockRejectedValueOnce(denied);
  await act(async () => {
    await expect(clipboard.copyToClipboard('second')).rejects.toBe(denied);
  });
  wait(999);
  expect(container.textContent).toBe('Copied');
  wait(1);
  expect(container.textContent).toBe('Copy');
  expect(warning.mock.calls).toEqual([
    ['Failed to copy text to clipboard:', denied],
  ]);
});

it.each([0, 1])(
  'renews feedback in successful completion order when write %s finishes first',
  async (firstCompleted) => {
    const writes = [pendingWrite(), pendingWrite()];
    writeText
      .mockReturnValueOnce(writes[0].promise)
      .mockReturnValueOnce(writes[1].promise);
    render();
    const results = [
      clipboard.copyToClipboard('first'),
      clipboard.copyToClipboard('second'),
    ];
    expect(container.textContent).toBe('Copy');
    await act(async () => {
      writes[firstCompleted].resolve();
      await results[firstCompleted];
    });
    expect(container.textContent).toBe('Copied');
    wait(1900);
    await act(async () => {
      writes[1 - firstCompleted].resolve();
      await results[1 - firstCompleted];
    });
    wait(1999);
    expect(container.textContent).toBe('Copied');
    wait(1);
    expect(container.textContent).toBe('Copy');
    expect(writeText.mock.calls).toEqual([['first'], ['second']]);
  },
);

it('keeps copied feedback independent between hook instances', async () => {
  let otherClipboard!: ClipboardHandle;
  render(
    <>
      <ClipboardButton id="first" onRender={(value) => (clipboard = value)} />
      <ClipboardButton
        id="second"
        onRender={(value) => (otherClipboard = value)}
      />
    </>,
  );
  await copy('first');
  wait(1000);
  await act(async () => otherClipboard.copyToClipboard('second'));
  wait(1000);
  expect(container.querySelector('#first')?.textContent).toBe('Copy');
  expect(container.querySelector('#second')?.textContent).toBe('Copied');
  wait(1000);
  expect(container.querySelector('#second')?.textContent).toBe('Copy');
});

it('clears the active reset timer when unmounted', async () => {
  render();
  await copy();
  expect(container.textContent).toBe('Copied');
  expect(jest.getTimerCount()).toBe(1);
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it('resolves a pending native copy after unmount without scheduling feedback', async () => {
  const write = pendingWrite();
  writeText.mockReturnValueOnce(write.promise);
  render();
  const result = clipboard.copyToClipboard('Rivet setup');
  unmount();
  await act(async () => {
    write.resolve();
    await expect(result).resolves.toBeUndefined();
  });
  expect(writeText.mock.calls).toEqual([['Rivet setup']]);
  expect(jest.getTimerCount()).toBe(0);
});

it('preserves warning and rejection for a pending native copy after unmount', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const denied = new Error('Clipboard denied');
  const write = pendingWrite();
  writeText.mockReturnValueOnce(write.promise);
  render();
  const result = clipboard.copyToClipboard('Rivet setup');
  unmount();
  await act(async () => {
    write.reject(denied);
    await expect(result).rejects.toBe(denied);
  });
  expect(warning.mock.calls).toEqual([
    ['Failed to copy text to clipboard:', denied],
  ]);
  expect(jest.getTimerCount()).toBe(0);
});

it('allows copies after Strict Mode replays effect setup', async () => {
  render(
    <StrictMode>
      <ClipboardButton onRender={(value) => (clipboard = value)} />
    </StrictMode>,
  );
  await copy();
  expect(container.textContent).toBe('Copied');
  wait(2000);
  expect(container.textContent).toBe('Copy');
});
