import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { CaptureResult } from 'posthog-js';
import { posthog } from '../lib/posthog';
import { INSTALL_COMMANDS } from '../lib/install';
import InstallAccordion from './InstallAccordion';

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let sent: CaptureResult[] = [];

posthog.init('phc_test', {
  api_host: 'http://posthog.invalid',
  autocapture: false,
  capture_pageview: false,
  disable_session_recording: true,
  advanced_disable_flags: true,
  persistence: 'memory',
  before_send: (event) => {
    if (event) sent.push(event);
    return null;
  },
});

const downloadClicks = () =>
  sent
    .filter((e) => e.event === 'download_clicked')
    .map((e) => ({
      source: e.properties.source,
      download_type: e.properties.download_type,
      copy_method: e.properties.copy_method,
    }));

let container: HTMLDivElement;
let root: Root;
let writeText: jest.Mock;

const row = (id: string) => {
  const el = container.querySelector(`[data-testid="install-command-${id}"]`);
  if (!el) throw new Error(`${id} row not rendered`);
  return el as HTMLElement;
};

const code = (id: string) => row(id).querySelector('code') as HTMLElement;

const toggle = () =>
  [...container.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('Or run the install command yourself'),
  ) as HTMLButtonElement;

const click = async (el: Element) => {
  await act(async () => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

const select = (el: Element) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
};

const copyEvent = (el: Element) =>
  act(() => {
    el.dispatchEvent(new Event('copy', { bubbles: true }));
  });

beforeEach(async () => {
  sent = [];
  writeText = jest.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  Object.defineProperty(window, 'isSecureContext', {
    value: true,
    configurable: true,
  });
  window.getSelection()?.removeAllRanges();

  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<InstallAccordion />));
  await click(toggle());
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

describe('InstallAccordion copy', () => {
  it('copies the command when the row is clicked', async () => {
    await click(code('claude'));

    expect(writeText).toHaveBeenCalledWith(INSTALL_COMMANDS.claude);
    expect(downloadClicks()).toEqual([
      {
        source: 'landing_accordion',
        download_type: 'claude',
        copy_method: 'row_click',
      },
    ]);
    expect(row('claude').textContent).toContain('Copied');
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      'Claude install command copied',
    );
  });

  it('copies once with copy_method icon when the icon is clicked', async () => {
    const icon = container.querySelector(
      'button[aria-label="Copy Cursor install command"]',
    )!;
    await click(icon);

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(INSTALL_COMMANDS.cursor);
    expect(downloadClicks()).toEqual([
      {
        source: 'landing_accordion',
        download_type: 'cursor',
        copy_method: 'icon',
      },
    ]);
  });

  it('counts a manual copy of selected command text', () => {
    select(code('codex'));
    copyEvent(code('codex'));

    expect(writeText).not.toHaveBeenCalled();
    expect(downloadClicks()).toEqual([
      {
        source: 'landing_accordion',
        download_type: 'codex',
        copy_method: 'manual_select',
      },
    ]);
  });

  it('ignores a copy event with nothing selected', () => {
    copyEvent(row('codex'));

    expect(downloadClicks()).toEqual([]);
  });

  it('does not overwrite the clipboard when a click ends a text selection', async () => {
    select(code('codex'));
    await click(code('codex'));

    expect(writeText).not.toHaveBeenCalled();
    expect(downloadClicks()).toEqual([]);
  });

  it('selects the command when the clipboard write fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    writeText.mockRejectedValue(new Error('denied'));

    await click(code('codex'));

    expect(window.getSelection()?.toString()).toBe(INSTALL_COMMANDS.codex);
    expect(row('codex').textContent).not.toContain('Copied');

    copyEvent(code('codex'));
    expect(downloadClicks().map((e) => e.copy_method)).toEqual([
      'row_click',
      'manual_select',
    ]);
  });

  it('still copies when PostHog throws', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(posthog, 'capture').mockImplementation(() => {
      throw new Error('blocked');
    });

    await click(code('claude'));

    expect(writeText).toHaveBeenCalledWith(INSTALL_COMMANDS.claude);
  });
});

describe('InstallAccordion toggle', () => {
  it('points at the panel and hides it from assistive tech when closed', async () => {
    const button = toggle();
    const panel = document.getElementById(
      button.getAttribute('aria-controls')!,
    )!;

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(panel.className).toContain('visible');
    expect(panel.className).not.toContain('invisible');

    await click(button);

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(panel.className).toContain('invisible');
  });
});
