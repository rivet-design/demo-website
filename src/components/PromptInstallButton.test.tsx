import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { CaptureResult } from 'posthog-js';
import { posthog } from '../lib/posthog';
import * as installRef from '../lib/installRef';
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
    .filter((event) => event.event === 'download_clicked')
    .map((event) => ({
      source: event.properties.source,
      download_type: event.properties.download_type,
      install_ref: event.properties.install_ref as string,
    }));

let container: HTMLDivElement;
let root: Root;

const render = (element: ReactElement) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(element));
};

const click = (element: Element) =>
  act(() => {
    element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
  });

const openMenu = () => {
  const trigger = [...container.querySelectorAll('button')].find((button) =>
    button.textContent?.includes('Install Rivet'),
  );
  if (!trigger) throw new Error('install trigger not rendered');
  click(trigger);
  return trigger;
};

const menuItem = (label: string) => {
  const item = [...document.body.querySelectorAll('button, a')].find(
    (element) => element.textContent === label,
  );
  if (!item) throw new Error(`${label} row not rendered`);
  return item;
};

const pickItem = async (label: string) => {
  openMenu();
  const item = menuItem(label);
  item.addEventListener('click', (event) => event.preventDefault(), {
    once: true,
  });
  await act(async () => click(item));
  return item;
};

const copiedText = () =>
  (navigator.clipboard.writeText as jest.Mock).mock.calls.map(
    ([text]) => text as string,
  );

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

describe('PromptInstallButton', () => {
  it.each([
    'landing_hero',
    'landing_install_section',
    'story',
    'landing_nav',
    'story_nav',
  ] as const)('copies one short universal prompt from %s', async (source) => {
    render(<PromptInstallButton source={source} label="Install Rivet" />);
    await pickItem('Copy to agent');

    const [event] = downloadClicks();
    expect(event).toEqual({
      source,
      download_type: 'agent',
      install_ref: expect.stringMatching(/^r_[0-9A-Za-z]{8}$/),
    });
    expect(copiedText()).toEqual([
      `Install Rivet for this agent: \`npx -y rivet-design@latest install --ref ${event.install_ref}\``,
    ]);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it.each([
    ['Claude', 'claude', 'q'],
    ['Codex', 'codex', 'prompt'],
  ] as const)(
    'links Continue with %s to an attributed coding prompt',
    async (label, agent, parameter) => {
      render(
        <PromptInstallButton source="landing_hero" label="Install Rivet" />,
      );
      const item = await pickItem(`Continue with ${label}`);

      const [event] = downloadClicks();
      const link = new URL((item as HTMLAnchorElement).href);
      expect(event.download_type).toBe(agent);
      expect(link.protocol).toBe(`${agent}:`);
      expect(link.hostname).toBe(agent === 'claude' ? 'code' : 'new');
      expect(link.searchParams.get(parameter)).toBe(
        `Install Rivet for this agent: \`npx -y rivet-design@latest install ${agent} --ref ${event.install_ref}\``,
      );
      expect(copiedText()).toEqual([]);
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    },
  );

  it('carries the NavBar placement through to the copy event', async () => {
    render(<NavBar installSource="story_nav" />);
    await pickItem('Copy to agent');

    expect(downloadClicks()).toEqual([
      {
        source: 'story_nav',
        download_type: 'agent',
        install_ref: expect.stringMatching(/^r_[0-9A-Za-z]{8}$/),
      },
    ]);
  });

  it('uses a fresh attributed prompt on each handoff', async () => {
    render(<PromptInstallButton source="landing_hero" label="Install Rivet" />);
    await pickItem('Copy to agent');
    await pickItem('Continue with Claude');

    const refs = downloadClicks().map((event) => event.install_ref);
    expect(refs).toHaveLength(2);
    refs.forEach((ref) => expect(ref).toMatch(/^r_[0-9A-Za-z]{8}$/));
    expect(refs[0]).not.toBe(refs[1]);
    const people = sent
      .filter((event) => event.event === '$set')
      .map((event) => event.properties.$set.last_install_ref);
    expect(people).toEqual(refs);
  });

  it('keeps the exact short copy payload when attribution is disabled', async () => {
    jest.replaceProperty(installRef, 'EMBED_INSTALL_REF_IN_COPY', false);
    render(<PromptInstallButton source="landing_hero" label="Install Rivet" />);
    await pickItem('Copy to agent');

    expect(copiedText()).toEqual([
      'Install Rivet for this agent: `npx -y rivet-design@latest install`',
    ]);
  });

  it('activates the highlighted coding link with the keyboard', () => {
    render(<PromptInstallButton source="landing_hero" label="Install Rivet" />);
    const trigger = openMenu();
    const link = menuItem('Continue with Codex');
    link.addEventListener('click', (event) => event.preventDefault(), {
      once: true,
    });
    act(() => {
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
    });
    act(() => {
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
    });

    expect(downloadClicks()).toEqual([
      {
        source: 'landing_hero',
        download_type: 'codex',
        install_ref: expect.stringMatching(/^r_[0-9A-Za-z]{8}$/),
      },
    ]);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('still copies the prompt when PostHog throws', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(posthog, 'capture').mockImplementation(() => {
      throw new Error('blocked');
    });

    render(<PromptInstallButton source="landing_hero" label="Install Rivet" />);
    await pickItem('Copy to agent');

    expect(copiedText()).toEqual([
      expect.stringMatching(
        /^Install Rivet for this agent: `npx -y rivet-design@latest install --ref r_[0-9A-Za-z]{8}`$/,
      ),
    ]);
    expect(warning).toHaveBeenCalledWith(
      'telemetry: failed to send "download_clicked"',
      expect.objectContaining({ message: 'blocked' }),
    );
  });
});
