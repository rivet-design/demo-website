import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { CaptureResult } from 'posthog-js';
import { posthog } from '../lib/posthog';
import * as installRef from '../lib/installRef';
import InstallAccordion from './InstallAccordion';
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
  Object.defineProperty(window, 'isSecureContext', {
    value: true,
    configurable: true,
  });
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

const REF = /^r_[0-9A-Za-z]{8}$/;

const copiedText = () =>
  (navigator.clipboard.writeText as jest.Mock).mock.calls.map(
    ([text]) => text as string,
  );

const refsSent = () => ({
  events: sent
    .filter((e) => e.event === 'download_clicked')
    .map((e) => e.properties.install_ref as string),
  people: sent
    .filter((e) => e.event === '$set')
    .map((e) => e.properties.$set.last_install_ref as string),
});

const copyFromAccordion = async (label: string) => {
  const button = container.querySelector(
    `button[aria-label="Copy ${label} install command"]`,
  );
  if (!button) throw new Error(`${label} copy button not rendered`);
  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

describe.each([
  [
    'PromptInstallButton',
    () =>
      render(
        <PromptInstallButton source="landing_hero" label="Install Rivet" />,
      ),
    pickAgent,
  ],
  ['InstallAccordion', () => render(<InstallAccordion />), copyFromAccordion],
] as const)('%s install_ref', (_, mount, copy) => {
  it('sends a fresh ref on the event and the person for every copy', async () => {
    mount();
    await copy('Codex');
    await copy('Claude');

    const { events, people } = refsSent();
    expect(events).toHaveLength(2);
    events.forEach((ref) => expect(ref).toMatch(REF));
    expect(events[0]).not.toBe(events[1]);
    expect(people).toEqual(events);
  });

  it('leaves the ref out of the copied text while embedding is off', async () => {
    mount();
    await copy('Codex');

    const [text] = copiedText();
    expect(text).toMatch(/npx -y rivet-design@latest install codex$/);
    expect(text).not.toContain('--ref');
    expect(text).not.toContain(refsSent().events[0]);
  });

  it('puts the same ref in the copied command once embedding is on', async () => {
    jest.replaceProperty(installRef, 'EMBED_INSTALL_REF_IN_COPY', true);
    mount();
    await copy('Cursor');

    const [ref] = refsSent().events;
    expect(copiedText()).toEqual([
      expect.stringMatching(
        new RegExp(
          `npx -y rivet-design@latest install cursor --mcp --ref ${ref}$`,
        ),
      ),
    ]);
  });
});
