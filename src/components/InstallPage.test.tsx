import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { posthog } from '../lib/posthog';
import { INSTALL_COMMANDS } from '../lib/install';
import InstallPage from './InstallPage';

jest.mock('../lib/posthog', () => ({
  posthog: { capture: jest.fn(), setPersonProperties: jest.fn() },
}));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
let writeText: jest.Mock;
let phone = false;
let resize: () => void;
const capture = posthog.capture as jest.Mock;
const click = async (element: Element) => {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};
const renderAt = async (path: string) => {
  window.history.replaceState(null, '', path);
  await act(async () => root.render(<InstallPage />));
};

beforeEach(() => {
  phone = false;
  capture.mockClear();
  window.getSelection()?.removeAllRanges();
  writeText = jest.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  Object.defineProperty(window, 'isSecureContext', {
    value: true,
    configurable: true,
  });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      get matches() {
        return phone;
      },
      addEventListener: (_event: string, listener: () => void) => {
        resize = listener;
      },
      removeEventListener: jest.fn(),
    }),
  });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

it('reuses a valid email ref on every copy and tracks its source', async () => {
  await renderAt('/install?ref=r_aZ09bY18&utm_source=email');
  for (const label of ['Codex', 'Claude', 'Cursor']) {
    await click(
      container.querySelector(
        `button[aria-label="Copy ${label} install command"]`,
      )!,
    );
  }
  expect(writeText.mock.calls.map(([command]) => command)).toEqual([
    `${INSTALL_COMMANDS.codex} --ref r_aZ09bY18`,
    `${INSTALL_COMMANDS.claude} --ref r_aZ09bY18`,
    `${INSTALL_COMMANDS.cursor} --ref r_aZ09bY18`,
  ]);
  expect(capture.mock.calls).toHaveLength(3);
  for (const [event, props] of capture.mock.calls) {
    expect(event).toBe('download_clicked');
    expect(props).toMatchObject({
      source: 'email_install_page',
      install_ref: 'r_aZ09bY18',
    });
  }
});

it.each(['?ref=invalid', '', '?ref=r_123456789'])(
  'generates one stable fallback ref for %s',
  async (query) => {
    await renderAt(`/install${query}`);
    const button = container.querySelector(
      'button[aria-label="Copy Codex install command"]',
    )!;
    await click(button);
    await click(button);
    const ref = capture.mock.calls[0][1].install_ref;
    expect(ref).toMatch(/^r_[A-Za-z0-9]{8}$/);
    expect(capture.mock.calls[1][1].install_ref).toBe(ref);
    expect(writeText).toHaveBeenLastCalledWith(
      `${INSTALL_COMMANDS.codex} --ref ${ref}`,
    );
  },
);

it('reuses the ref in the homepage prompt component', async () => {
  await renderAt('/install?ref=r_aZ09bY18');
  await click(
    [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Install Rivet',
    )!,
  );
  await click(
    [...document.querySelectorAll('button')].find(
      (button) => button.textContent === 'Codex',
    )!,
  );
  expect(writeText).toHaveBeenCalledWith(
    `Please set up Rivet for Codex by running: ${INSTALL_COMMANDS.codex} --ref r_aZ09bY18`,
  );
  expect(capture).toHaveBeenCalledWith(
    'download_clicked',
    expect.objectContaining({
      source: 'email_install_page',
      install_ref: 'r_aZ09bY18',
    }),
  );
});

it('preserves the ref when copying a selected command manually', async () => {
  await renderAt('/install?ref=r_aZ09bY18');
  const code = container.querySelector('code')!;
  const range = document.createRange();
  range.selectNodeContents(code);
  window.getSelection()?.addRange(range);
  const event = new Event('copy', { bubbles: true, cancelable: true });
  const setData = jest.fn();
  Object.defineProperty(event, 'clipboardData', { value: { setData } });
  act(() => code.dispatchEvent(event));
  expect(setData).toHaveBeenCalledWith(
    'text/plain',
    `${INSTALL_COMMANDS.codex} --ref r_aZ09bY18`,
  );
  expect(capture).toHaveBeenCalledWith(
    'download_clicked',
    expect.objectContaining({
      source: 'email_install_page',
      install_ref: 'r_aZ09bY18',
      copy_method: 'manual_select',
    }),
  );
});

it('shows the computer note without copy buttons on phones and responds to resizing', async () => {
  phone = true;
  await renderAt('/install?ref=r_aZ09bY18');
  expect(container.textContent).toContain('Open this on your computer');
  expect(container.querySelector('button')).toBeNull();
  phone = false;
  act(() => resize());
  expect(
    container.querySelector('button[aria-label="Copy Codex install command"]'),
  ).not.toBeNull();
});
