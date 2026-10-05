import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { CaptureResult } from 'posthog-js';
import { posthog } from '../lib/posthog';
import NavBar from './NavBar';
import PromptInstallButton from './PromptInstallButton';

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
    }));

let container: HTMLDivElement;
let root: Root;

const render = (element: ReactElement) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(element));
};

const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

const pickAgent = async (label: string) => {
  const trigger = [...container.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('Install Rivet'),
  );
  if (!trigger) throw new Error('install trigger not rendered');
  click(trigger);
  const row = [...document.body.querySelectorAll('button')].find(
    (b) => b.textContent === label,
  );
  if (!row) throw new Error(`${label} row not rendered`);
  await act(async () => {
    row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

beforeEach(() => {
  sent = [];
  Object.assign(navigator, {
    clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

describe('PromptInstallButton download_clicked', () => {
  it.each([
    ['landing_hero', 'Codex', 'codex'],
    ['landing_install_section', 'Claude', 'claude'],
    ['landing_nav', 'Cursor', 'cursor'],
    ['story_nav', 'Codex', 'codex'],
  ] as const)(
    'sends source %s with the picked agent',
    async (source, label, downloadType) => {
      render(<PromptInstallButton source={source} label="Install Rivet" />);
      await pickAgent(label);

      expect(downloadClicks()).toEqual([
        { source, download_type: downloadType },
      ]);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining(`install ${downloadType}`),
      );
    },
  );

  it('carries the NavBar placement through to the event', async () => {
    render(<NavBar installSource="story_nav" />);
    await pickAgent('Cursor');

    expect(downloadClicks()).toEqual([
      { source: 'story_nav', download_type: 'cursor' },
    ]);
  });

  it('still copies the prompt when PostHog throws', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(posthog, 'capture').mockImplementation(() => {
      throw new Error('blocked');
    });

    render(<PromptInstallButton source="landing_hero" label="Install Rivet" />);
    await pickAgent('Codex');

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('install codex'),
    );
  });
});
