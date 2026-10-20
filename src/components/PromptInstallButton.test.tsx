import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { CaptureResult } from 'posthog-js';
import { toast } from 'sonner';
import { posthog } from '../lib/posthog';
import * as installRef from '../lib/installRef';
import InstallAccordion from './InstallAccordion';
import NavBar from './NavBar';
import PromptInstallButton from './PromptInstallButton';

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }),
}));

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
  const trigger = container.querySelector(
    'button[aria-label="Choose your agent"]',
  );
  if (!trigger) throw new Error('install trigger not rendered');
  if (trigger.getAttribute('aria-expanded') !== 'true') click(trigger);
  const popup = document.querySelector(
    '[aria-label="Choose where to install Rivet"]',
  )!;
  const row = [...popup.querySelectorAll('button')].find((button) =>
    label === 'Terminal'
      ? button.textContent === 'Copy instructions'
      : button.getAttribute('aria-label') ===
        `Continue in ${label}${label === 'Claude Code' ? ' (Terminal)' : ' (Desktop)'}`,
  );
  if (!row) throw new Error(`${label} row not rendered`);
  await act(async () => {
    row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

beforeEach(() => {
  sent = [];
  window.getSelection()?.removeAllRanges();
  jest.clearAllMocks();
  jest.spyOn(window, 'open').mockReturnValue(null);
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
    ['landing_hero', 'ChatGPT', 'codex'],
    ['landing_install_section', 'Claude', 'claude'],
    ['story', 'Claude', 'claude'],
    ['landing_nav', 'Cursor', 'cursor'],
    ['story_nav', 'ChatGPT', 'codex'],
  ] as const)(
    'sends source %s with the picked agent',
    async (source, label, downloadType) => {
      render(<PromptInstallButton source={source} label="Install Rivet" />);
      await pickAgent(label);

      expect(downloadClicks()).toEqual([
        { source, download_type: downloadType },
      ]);
      expect(openedPrompts()).toEqual([
        expect.stringContaining(
          `install ${downloadType === 'claude' ? 'claude-code claude-desktop' : downloadType}`,
        ),
      ]);
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
      expect(
        container
          .querySelector('[aria-expanded]')
          ?.getAttribute('aria-expanded'),
      ).toBe('true');
    },
  );

  it('carries the NavBar placement through to the event', async () => {
    render(<NavBar installSource="story_nav" />);
    await pickAgent('Cursor');

    expect(downloadClicks()).toEqual([
      { source: 'story_nav', download_type: 'cursor' },
    ]);
  });

  it('still opens the app when PostHog throws', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(posthog, 'capture').mockImplementation(() => {
      throw new Error('blocked');
    });

    render(<PromptInstallButton source="landing_hero" label="Install Rivet" />);
    await pickAgent('ChatGPT');

    expect(openedPrompts()).toEqual([expect.stringContaining('install codex')]);
  });
});

const REF = /^r_[0-9A-Za-z]{8}$/;

const copiedText = () =>
  (navigator.clipboard.writeText as jest.Mock).mock.calls.map(
    ([text]) => text as string,
  );

const openedPrompts = () =>
  (window.open as jest.Mock).mock.calls.map(([url]) => {
    const params = new URL(url).searchParams;
    return params.get('prompt') ?? params.get('q') ?? params.get('text');
  });

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
    openedPrompts,
    'ChatGPT',
  ],
  [
    'InstallAccordion',
    () => render(<InstallAccordion />),
    copyFromAccordion,
    copiedText,
    'Codex',
  ],
] as const)(
  '%s install_ref',
  (_, mount, activate, deliveredText, codexLabel) => {
    it('sends a fresh ref on the event and the person for every activation', async () => {
      mount();
      await activate(codexLabel);
      await activate('Claude');

      const { events, people } = refsSent();
      expect(events).toHaveLength(2);
      events.forEach((ref) => expect(ref).toMatch(REF));
      expect(events[0]).not.toBe(events[1]);
      expect(people).toEqual(events);
    });

    it('leaves the ref out of the delivered text while embedding is off', async () => {
      jest.replaceProperty(installRef, 'EMBED_INSTALL_REF_IN_COPY', false);
      mount();
      await activate(codexLabel);

      const [text] = deliveredText();
      expect(text).toMatch(/npx -y rivet-design@latest install codex$/);
      expect(text).not.toContain('--ref');
      expect(text).not.toContain(refsSent().events[0]);
    });

    it('puts the same ref in the delivered command by default', async () => {
      mount();
      await activate('Cursor');

      const [ref] = refsSent().events;
      expect(deliveredText()).toEqual([
        expect.stringMatching(
          new RegExp(
            `npx -y rivet-design@latest install cursor --mcp --ref ${ref}$`,
          ),
        ),
      ]);
    });
  },
);

describe('PromptInstallButton desktop handoff', () => {
  it.each([
    ['ChatGPT', 'codex://new', 'prompt'],
    ['Claude', 'claude://code/new', 'q'],
    ['Claude Code', 'claude-cli://open', 'q'],
    ['Cursor', 'cursor://anysphere.cursor-deeplink/prompt', 'text'],
  ])(
    'opens %s with an encoded install prompt',
    async (label, base, parameter) => {
      render(
        <PromptInstallButton source="landing_hero" label="Install Rivet" />,
      );
      await pickAgent(label);

      const [[url, target, features]] = (window.open as jest.Mock).mock.calls;
      const parsed = new URL(url);
      expect(`${parsed.protocol}//${parsed.host}${parsed.pathname}`).toBe(base);
      expect(target).toBe('_blank');
      expect(features).toBe('noopener,noreferrer');
      expect(toast).not.toHaveBeenCalled();
      expect([...parsed.searchParams.keys()]).toEqual([parameter]);
      const prompt = parsed.searchParams.get(parameter)!;
      expect(prompt).toContain(`--ref ${refsSent().events[0]}`);
      expect(url).toBe(`${base}?${parameter}=${encodeURIComponent(prompt)}`);
    },
  );

  it('opens the selected app with arrow keys and Enter', () => {
    render(<PromptInstallButton source="landing_hero" label="Install Rivet" />);
    const trigger = container.querySelector(
      'button[aria-label="Choose your agent"]',
    )!;
    click(trigger);
    for (const key of ['ArrowDown', 'ArrowDown', 'Enter']) {
      act(() => {
        trigger.dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true }),
        );
      });
    }
    expect(window.open).toHaveBeenCalledWith(
      expect.stringMatching(/^claude:\/\/code\/new\?q=/),
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('offers a copy fallback with the same prompt and install ref', async () => {
    render(<PromptInstallButton source="landing_hero" label="Install Rivet" />);
    await pickAgent('Claude');

    const copy = [...document.body.querySelectorAll('button')].find(
      (button) => button.textContent === 'Copy prompt',
    )!;
    await act(async () => click(copy));
    expect(copy.textContent).toBe('Copied');
    expect(toast).not.toHaveBeenCalled();
    expect(copiedText()).toEqual(openedPrompts());
    expect(downloadClicks()).toHaveLength(1);
  });

  it.each(['denied', 'unavailable'])(
    'handles %s clipboard access in the fallback',
    async (failure) => {
      if (failure === 'denied') {
        (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(
          new Error('denied'),
        );
      } else {
        Object.assign(navigator, { clipboard: undefined });
      }
      render(
        <PromptInstallButton source="landing_hero" label="Install Rivet" />,
      );
      await pickAgent('ChatGPT');
      expect(window.open).toHaveBeenCalledTimes(1);

      const copy = [...document.body.querySelectorAll('button')].find(
        (button) => button.textContent === 'Copy prompt',
      )!;
      await act(async () => click(copy));
      expect(document.querySelector('textarea')?.value).toBe(
        openedPrompts()[0],
      );
      expect(toast.error).not.toHaveBeenCalled();
    },
  );
});

describe('PromptInstallButton terminal options', () => {
  it('opens Claude Code in a terminal with only its own install target', async () => {
    render(<PromptInstallButton source="story" label="Install Rivet" />);
    await pickAgent('Claude Code');
    expect(window.open).toHaveBeenCalledWith(
      expect.stringMatching(/^claude-cli:\/\/open\?q=/),
      '_blank',
      'noopener,noreferrer',
    );
    const [prompt] = openedPrompts();
    expect(prompt).toMatch(/install claude-code --ref r_[0-9A-Za-z]{8}$/);
    expect(prompt).not.toContain('claude-desktop');
    expect(downloadClicks()).toEqual([
      { source: 'story', download_type: 'claude-code' },
    ]);
  });

  it('shows terminal commands from every install menu without opening an app', async () => {
    render(<PromptInstallButton source="story_nav" label="Install Rivet" />);
    await pickAgent('Terminal');
    expect(window.open).not.toHaveBeenCalled();
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      'Install from your terminal',
    );
    expect(
      document.querySelector('[role="dialog"]')?.textContent,
    ).not.toContain('Or run the install command yourself');
    const copy = document.querySelector(
      'button[aria-label="Copy Claude Code install command"]',
    )!;
    await act(async () => click(copy));
    expect(copiedText()).toEqual([
      expect.stringMatching(/install claude-code --ref r_[0-9A-Za-z]{8}$/),
    ]);
    expect(downloadClicks()).toEqual([
      { source: 'story_nav', download_type: 'claude-code' },
    ]);
    expect(toast).not.toHaveBeenCalled();
  });

  it('reaches Terminal with ArrowUp and Enter', () => {
    render(<PromptInstallButton source="landing_hero" label="Install Rivet" />);
    const trigger = container.querySelector(
      'button[aria-label="Choose your agent"]',
    )!;
    click(trigger);
    for (const key of ['ArrowUp', 'Enter']) {
      act(() =>
        trigger.dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true }),
        ),
      );
    }
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      'Install from your terminal',
    );
    expect(window.open).not.toHaveBeenCalled();
  });

  it('does not relaunch an app when Enter is pressed on the copy fallback', async () => {
    render(<PromptInstallButton source="landing_hero" label="Install Rivet" />);
    await pickAgent('Claude');
    const copy = [...document.body.querySelectorAll('button')].find(
      (button) => button.textContent === 'Copy prompt',
    )!;
    act(() =>
      copy.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      ),
    );
    expect(window.open).toHaveBeenCalledTimes(1);
  });
});

it('keeps the same copy fallback after the nav menu dismisses on scroll', async () => {
  render(
    <PromptInstallButton
      source="landing_nav"
      label="Install Rivet"
      dismissOnScroll
    />,
  );
  await pickAgent('Claude Code');
  const [prompt] = openedPrompts();
  act(() => window.dispatchEvent(new Event('scroll')));
  expect(
    container.querySelector('[aria-expanded]')?.getAttribute('aria-expanded'),
  ).toBe('false');
  click(container.querySelector('button[aria-label="Choose your agent"]')!);
  const copy = [...document.body.querySelectorAll('button')].find(
    (button) => button.textContent === 'Copy prompt',
  );
  expect(copy).toBeDefined();
  await act(async () => click(copy!));
  expect(copiedText()).toEqual([prompt]);
  expect(downloadClicks()).toHaveLength(1);
});

it('launches the default app from the main button without opening the menu', async () => {
  render(<PromptInstallButton source="landing_hero" />);
  const main = container.querySelector('button')!;
  expect(main.textContent).toBe('Continue in ChatGPT (Desktop)');
  await act(async () => click(main));
  expect(window.open).toHaveBeenCalledWith(
    expect.stringMatching(/^codex:\/\/new\?prompt=/),
    '_blank',
    'noopener,noreferrer',
  );
  expect(
    container.querySelector('[aria-expanded]')?.getAttribute('aria-expanded'),
  ).toBe('false');
});

it('updates the main action after choosing another agent', async () => {
  render(<PromptInstallButton source="landing_hero" />);
  await pickAgent('Claude Code');
  const main = container.querySelector('button')!;
  expect(main.textContent).toBe('Continue in Claude Code (Terminal)');
  await act(async () => click(main));
  expect(window.open).toHaveBeenCalledTimes(2);
  expect((window.open as jest.Mock).mock.calls[1][0]).toMatch(
    /^claude-cli:\/\/open\?q=/,
  );
});
