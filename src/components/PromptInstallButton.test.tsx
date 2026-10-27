import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { CaptureResult } from 'posthog-js';
import { toast } from 'sonner';
import { posthog } from '../lib/posthog';
import * as handoff from '../lib/handoff';
import * as installRef from '../lib/installRef';
import InstallAccordion from './InstallAccordion';
import NavBar from './NavBar';
import PromptInstallButton from './PromptInstallButton';

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(() => 'opening-toast'),
    error: jest.fn(),
    dismiss: jest.fn(),
  }),
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
  const row = [...popup.querySelectorAll('button')].find(
    (button) =>
      button.getAttribute('aria-label') ===
      (label === 'Copy prompt' ? label : `Continue in ${label}`),
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
  jest.spyOn(handoff, 'openDeepLink').mockImplementation(() => {});
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
    ['story', 'Claude', 'claude'],
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
      expect(openedPrompts()).toEqual([
        `Install Rivet for this agent: \`npx -y rivet-design@latest install ${downloadType}${downloadType === 'cursor' ? ' --mcp' : ''} --ref ${refsSent().events[0]}\``,
      ]);
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
      expect(
        container
          .querySelector('[aria-expanded]')
          ?.getAttribute('aria-expanded'),
      ).toBe('false');
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
    await pickAgent('Codex');

    expect(openedPrompts()).toEqual([expect.stringContaining('install codex')]);
  });
});

const REF = /^r_[0-9A-Za-z]{8}$/;

const copiedText = () =>
  (navigator.clipboard.writeText as jest.Mock).mock.calls.map(
    ([text]) => text as string,
  );

const openedPrompts = () =>
  (handoff.openDeepLink as jest.Mock).mock.calls.map(([url]) => {
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
    'Codex',
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
      expect(text).toMatch(/npx -y rivet-design@latest install codex`?$/);
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
            'npx -y rivet-design@latest install cursor --mcp --ref ' +
              ref +
              '`?$',
          ),
        ),
      ]);
    });
  },
);

describe('PromptInstallButton desktop handoff', () => {
  it.each([
    ['Codex', 'codex://new', 'prompt'],
    ['Claude', 'claude://code/new', 'q'],
    ['Cursor', 'cursor://anysphere.cursor-deeplink/prompt', 'text'],
  ])(
    'opens %s with an encoded install prompt',
    async (label, base, parameter) => {
      render(
        <PromptInstallButton source="landing_hero" label="Install Rivet" />,
      );
      await pickAgent(label);

      const [[url]] = (handoff.openDeepLink as jest.Mock).mock.calls;
      const parsed = new URL(url);
      expect(`${parsed.protocol}//${parsed.host}${parsed.pathname}`).toBe(base);
      expect(toast.success).toHaveBeenCalledWith(`Opening ${label}…`, {
        duration: 3000,
      });
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
    expect(handoff.openDeepLink).toHaveBeenCalledWith(
      expect.stringMatching(/^claude:\/\/code\/new\?q=/),
    );
  });
});

describe('PromptInstallButton copy prompt', () => {
  it('shows exactly three desktop agents and the copy action', () => {
    render(<PromptInstallButton source="landing_hero" />);
    click(container.querySelector('button[aria-label="Choose your agent"]')!);
    const chooser = document.querySelector(
      '[aria-label="Choose where to install Rivet"]',
    )!;
    expect(
      [...chooser.querySelectorAll('button')].map(
        (button) => button.textContent,
      ),
    ).toEqual(['Codex', 'Claude', 'Cursor', 'Copy prompt']);
  });

  it('copies a general install prompt with a fresh ref without opening an app', async () => {
    render(<PromptInstallButton source="story_nav" />);
    await pickAgent('Copy prompt');
    const [ref] = refsSent().events;
    expect(ref).toMatch(REF);
    expect(refsSent().people).toEqual([ref]);
    expect(copiedText()).toEqual([
      `Install Rivet for this agent: \`npx -y rivet-design@latest install --ref ${ref}\``,
    ]);
    expect(downloadClicks()).toEqual([
      { source: 'story_nav', download_type: 'agent' },
    ]);
    expect(handoff.openDeepLink).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Prompt copied', {
      description: 'Paste it into your agent to install Rivet.',
      duration: 5000,
    });
    expect(document.querySelector('[role="status"]')?.textContent).toBe(
      'Prompt copied',
    );
    expect(container.querySelector('button')?.textContent).toBe(
      'Continue in Codex',
    );
    await pickAgent('Copy prompt');
    expect(refsSent().events[1]).not.toBe(ref);
  });

  it('leaves the ref out of the copied prompt when embedding is off', async () => {
    jest.replaceProperty(installRef, 'EMBED_INSTALL_REF_IN_COPY', false);
    render(<PromptInstallButton source="landing_hero" />);
    await pickAgent('Copy prompt');
    expect(copiedText()).toEqual([
      'Install Rivet for this agent: `npx -y rivet-design@latest install`',
    ]);
  });

  it('reaches the copy action with ArrowUp and Enter', async () => {
    render(<PromptInstallButton source="landing_hero" />);
    const trigger = container.querySelector(
      'button[aria-label="Choose your agent"]',
    )!;
    click(trigger);
    for (const key of ['ArrowUp', 'Enter']) {
      await act(async () => {
        trigger.dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true }),
        );
      });
    }
    expect(copiedText()).toHaveLength(1);
    expect(handoff.openDeepLink).not.toHaveBeenCalled();
  });

  it('shows a retry message when copying fails, then recovers', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
      new Error('denied'),
    );
    render(<PromptInstallButton source="landing_hero" />);
    await pickAgent('Copy prompt');
    expect(downloadClicks()).toEqual([]);
    expect(toast.success).not.toHaveBeenCalled();
    expect(document.querySelector('[role="status"]')?.textContent).toBe(
      'Couldn’t copy. Try again.',
    );
    await pickAgent('Copy prompt');
    expect(document.querySelector('[role="status"]')?.textContent).toBe(
      'Prompt copied',
    );
    expect(downloadClicks()).toHaveLength(1);
  });
});

it('dismisses the nav chooser on scroll', () => {
  render(<PromptInstallButton source="landing_nav" dismissOnScroll />);
  const trigger = container.querySelector(
    'button[aria-label="Choose your agent"]',
  )!;
  click(trigger);
  act(() => window.dispatchEvent(new Event('scroll')));
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
});

it('launches the default app from the main button without opening the menu', async () => {
  render(<PromptInstallButton source="landing_hero" />);
  const main = container.querySelector('button')!;
  expect(main.textContent).toBe('Continue in Codex');
  await act(async () => click(main));
  expect(handoff.openDeepLink).toHaveBeenCalledWith(
    expect.stringMatching(/^codex:\/\/new\?prompt=/),
  );
  expect(
    container.querySelector('[aria-expanded]')?.getAttribute('aria-expanded'),
  ).toBe('false');
});

it('updates the main action after choosing another agent', async () => {
  render(<PromptInstallButton source="landing_hero" />);
  await pickAgent('Claude');
  const main = container.querySelector('button')!;
  expect(main.textContent).toBe('Continue in Claude');
  await act(async () => click(main));
  expect(handoff.openDeepLink).toHaveBeenCalledTimes(2);
  expect((handoff.openDeepLink as jest.Mock).mock.calls[1][0]).toMatch(
    /^claude:\/\/code\/new\?q=/,
  );
});

it('dismisses the hero chooser before page scrolling shrinks its anchor', () => {
  render(<PromptInstallButton source="landing_hero" />);
  const trigger = container.querySelector(
    'button[aria-label="Choose your agent"]',
  )!;
  click(trigger);
  act(() => window.dispatchEvent(new Event('scroll')));
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
});

it('dismisses the chooser when an ancestor scrolls', () => {
  render(
    <div data-scroll-container>
      <PromptInstallButton source="landing_hero" />
    </div>,
  );
  const trigger = container.querySelector(
    'button[aria-label="Choose your agent"]',
  )!;
  click(trigger);
  act(() =>
    container
      .querySelector('[data-scroll-container]')!
      .dispatchEvent(new Event('scroll')),
  );
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
});

it('allows the chooser contents to scroll without dismissing it', () => {
  render(<PromptInstallButton source="landing_hero" />);
  const trigger = container.querySelector(
    'button[aria-label="Choose your agent"]',
  )!;
  click(trigger);
  const chooser = document.querySelector(
    '[aria-label="Choose where to install Rivet"]',
  )!;
  act(() => chooser.dispatchEvent(new Event('scroll')));
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
});

it('keeps the chooser readable beside a scaled button and inside a narrow viewport', () => {
  render(<PromptInstallButton source="landing_hero" />);
  const anchor = container.querySelector('button')!.parentElement!;
  jest.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
    x: 100,
    y: 100,
    left: 100,
    top: 100,
    right: 220,
    bottom: 122,
    width: 120,
    height: 22,
    toJSON: () => ({}),
  });
  click(container.querySelector('button[aria-label="Choose your agent"]')!);
  const chooser = document.querySelector<HTMLElement>(
    '[aria-label="Choose where to install Rivet"]',
  )!;
  expect(Number.parseFloat(chooser.style.width)).toBeGreaterThanOrEqual(240);
  jest.replaceProperty(window, 'innerWidth', 220);
  act(() => window.dispatchEvent(new Event('resize')));
  expect(Number.parseFloat(chooser.style.width)).toBeLessThanOrEqual(196);
});

describe('PromptInstallButton handoff fallback', () => {
  // PostHog drops events once a faked Date jumps back between tests.
  beforeEach(() => jest.useFakeTimers({ doNotFake: ['Date'] }));
  afterEach(() => {
    jest.useRealTimers();
    setVisibility('visible');
  });

  const setVisibility = (state: DocumentVisibilityState) =>
    Object.defineProperty(document, 'visibilityState', {
      value: state,
      configurable: true,
    });
  const blur = () => act(() => window.dispatchEvent(new Event('blur')));
  const refocus = () => act(() => window.dispatchEvent(new Event('focus')));
  const hide = () =>
    act(() => {
      setVisibility('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
    });
  const stayAway = () =>
    act(() => {
      jest.advanceTimersByTime(handoff.BLUR_RETURN_WINDOW_MS);
    });
  const pressEscape = (target: Element) =>
    act(() => {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });

  const handoffResults = () =>
    sent
      .filter((e) => e.event === 'download_handoff')
      .map((e) => ({
        source: e.properties.source,
        download_type: e.properties.download_type,
        install_ref: e.properties.install_ref,
        handoff_result: e.properties.handoff_result,
      }));

  const fallbackPanel = () =>
    document.querySelector<HTMLElement>(
      '[role="dialog"][aria-label^="Install Rivet in"]',
    );

  const waitOutHandoff = () =>
    act(() => {
      jest.advanceTimersByTime(handoff.HANDOFF_TIMEOUT_MS);
    });

  it.each([
    ['hides', hide],
    ['stays blurred', stayAway],
  ])(
    'keeps the opening toast and shows no panel when the page blurs and %s',
    async (_, leave) => {
      render(<PromptInstallButton source="landing_hero" />);
      await pickAgent('Claude');
      act(() => {
        jest.advanceTimersByTime(500);
      });
      blur();
      await waitOutHandoff();
      expect(handoffResults()).toEqual([]);
      leave();
      refocus();

      const [ref] = refsSent().events;
      expect(handoffResults()).toEqual([
        {
          source: 'landing_hero',
          download_type: 'claude',
          install_ref: ref,
          handoff_result: 'blurred',
        },
      ]);
      expect(toast.success).toHaveBeenCalledWith('Opening Claude…', {
        duration: 3000,
      });
      expect(toast.dismiss).not.toHaveBeenCalled();
      expect(fallbackPanel()).toBeNull();
    },
  );

  it('replaces the toast with the fallback panel when the page keeps focus', async () => {
    render(<PromptInstallButton source="landing_hero" />);
    await pickAgent('Claude');
    expect(fallbackPanel()).toBeNull();
    await waitOutHandoff();

    const [ref] = refsSent().events;
    expect(handoffResults()).toEqual([
      {
        source: 'landing_hero',
        download_type: 'claude',
        install_ref: ref,
        handoff_result: 'no_blur',
      },
    ]);
    expect(toast.dismiss).toHaveBeenCalledWith('opening-toast');
    const panel = fallbackPanel()!;
    expect(panel.textContent).toContain(
      'Didn’t open? Paste this into Claude instead.',
    );
    expect(panel.querySelector('code')?.textContent).toBe(
      'npx -y rivet-design@latest install claude',
    );
    const download = [...panel.querySelectorAll('a')].find(
      (a) => a.textContent === 'Get Claude',
    );
    expect(download?.getAttribute('href')).toBe('https://claude.ai/download');
  });

  it('copies the command with the original ref and tracks the copy', async () => {
    render(<PromptInstallButton source="landing_nav" />);
    await pickAgent('Cursor');
    await waitOutHandoff();
    const [ref] = refsSent().events;

    await act(async () => {
      fallbackPanel()!
        .querySelector('button[aria-label="Copy Cursor install command"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(copiedText()).toEqual([
      `npx -y rivet-design@latest install cursor --mcp --ref ${ref}`,
    ]);
    const clicks = sent
      .filter((e) => e.event === 'download_clicked')
      .map((e) => ({
        source: e.properties.source,
        download_type: e.properties.download_type,
        install_ref: e.properties.install_ref,
        copy_method: e.properties.copy_method,
      }));
    expect(clicks).toEqual([
      {
        source: 'landing_nav',
        download_type: 'cursor',
        install_ref: ref,
        copy_method: undefined,
      },
      {
        source: 'handoff_fallback',
        download_type: 'cursor',
        install_ref: ref,
        copy_method: 'icon',
      },
    ]);
    expect(new Set(refsSent().people)).toEqual(new Set([ref]));
    expect(handoffResults().map((e) => e.handoff_result)).toEqual([
      'no_blur',
      'fallback_copied',
    ]);
    expect(handoffResults()[1]).toMatchObject({
      source: 'landing_nav',
      install_ref: ref,
    });
  });

  it('retries the same deep link and closes the panel once the app takes focus', async () => {
    render(<PromptInstallButton source="landing_hero" />);
    await pickAgent('Codex');
    await waitOutHandoff();
    const retry = [...fallbackPanel()!.querySelectorAll('button')].find(
      (b) => b.textContent === 'Try opening again',
    )!;
    click(retry);

    const opened = (handoff.openDeepLink as jest.Mock).mock.calls.map(
      ([url]) => url,
    );
    expect(opened).toHaveLength(2);
    expect(opened[1]).toBe(opened[0]);
    expect(refsSent().events).toHaveLength(1);

    blur();
    expect(fallbackPanel()).not.toBeNull();
    hide();
    expect(fallbackPanel()).toBeNull();
    expect(handoffResults().map((e) => e.handoff_result)).toEqual([
      'no_blur',
      'blurred',
    ]);
  });

  it('closes the panel from its dismiss button and on a new click', async () => {
    render(<PromptInstallButton source="landing_hero" />);
    await pickAgent('Codex');
    await waitOutHandoff();
    click(fallbackPanel()!.querySelector('button[aria-label="Dismiss"]')!);
    expect(fallbackPanel()).toBeNull();

    await act(async () => click(container.querySelector('button')!));
    await waitOutHandoff();
    expect(fallbackPanel()).not.toBeNull();
    await act(async () => click(container.querySelector('button')!));
    expect(fallbackPanel()).toBeNull();
  });

  it('shows the panel when a blur is followed by refocus, as after a cancelled browser prompt', async () => {
    render(<PromptInstallButton source="landing_hero" />);
    await pickAgent('Codex');
    blur();
    await waitOutHandoff();
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(fallbackPanel()).toBeNull();
    refocus();

    const [ref] = refsSent().events;
    expect(handoffResults()).toEqual([
      {
        source: 'landing_hero',
        download_type: 'codex',
        install_ref: ref,
        handoff_result: 'blur_returned',
      },
    ]);
    expect(toast.dismiss).toHaveBeenCalledWith('opening-toast');
    expect(fallbackPanel()!.textContent).toContain(
      'Didn’t open? Paste this into Codex instead.',
    );

    await act(async () => {
      fallbackPanel()!
        .querySelector('button[aria-label="Copy Codex install command"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(copiedText()).toEqual([
      `npx -y rivet-design@latest install codex --ref ${ref}`,
    ]);
    expect(handoffResults().map((e) => e.handoff_result)).toEqual([
      'blur_returned',
      'fallback_copied',
    ]);
  });

  it('records the attempt but not fallback_copied when the copy fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
      new Error('denied'),
    );
    render(<PromptInstallButton source="landing_hero" />);
    await pickAgent('Codex');
    await waitOutHandoff();
    await act(async () => {
      fallbackPanel()!
        .querySelector('button[aria-label="Copy Codex install command"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(downloadClicks()).toEqual([
      { source: 'landing_hero', download_type: 'codex' },
      { source: 'handoff_fallback', download_type: 'codex' },
    ]);
    expect(handoffResults().map((e) => e.handoff_result)).toEqual(['no_blur']);
    expect(fallbackPanel()!.textContent).toContain(
      'Command selected. Press ⌘C or Ctrl+C to copy.',
    );
  });

  it('closes the panel on Escape while focus stays on the CTA', async () => {
    render(<PromptInstallButton source="landing_hero" />);
    await pickAgent('Codex');
    await waitOutHandoff();
    const main = container.querySelector('button')!;
    main.focus();
    pressEscape(main);
    expect(fallbackPanel()).toBeNull();
  });

  it('keeps a dismissed panel closed when a retry later reports no_blur', async () => {
    render(<PromptInstallButton source="landing_hero" />);
    await pickAgent('Codex');
    await waitOutHandoff();
    click(
      [...fallbackPanel()!.querySelectorAll('button')].find(
        (b) => b.textContent === 'Try opening again',
      )!,
    );
    click(fallbackPanel()!.querySelector('button[aria-label="Dismiss"]')!);
    await waitOutHandoff();

    expect(fallbackPanel()).toBeNull();
    expect(handoffResults().map((e) => e.handoff_result)).toEqual([
      'no_blur',
      'no_blur',
    ]);
  });

  it('closes the panel when the chooser opens', async () => {
    render(<PromptInstallButton source="landing_hero" />);
    await pickAgent('Codex');
    await waitOutHandoff();
    const trigger = container.querySelector(
      'button[aria-label="Choose your agent"]',
    )!;
    click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(fallbackPanel()).toBeNull();

    click(trigger);
    await act(async () => click(container.querySelector('button')!));
    await waitOutHandoff();
    act(() => {
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
    });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(fallbackPanel()).toBeNull();
  });
});
