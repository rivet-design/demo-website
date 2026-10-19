import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { CaptureResult } from 'posthog-js';
import { posthog, redactAuthTokens } from '../lib/posthog';
import MobileInstallEmailButton from './MobileInstallEmailButton';

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let sent: CaptureResult[] = [];
posthog.init('phc_test', {
  api_host: 'http://posthog.invalid',
  autocapture: true,
  capture_pageview: false,
  disable_session_recording: true,
  advanced_disable_flags: true,
  persistence: 'memory',
  before_send: (event) => {
    const clean = redactAuthTokens(event);
    if (clean) sent.push(clean);
    return null;
  },
});
let container: HTMLDivElement;
let root: Root;
let network: jest.Mock;
const click = async (element: Element) => {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};
const setInput = async (selector: string, value: string) => {
  const input = document.querySelector(selector)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
const submit = async () => {
  await act(async () =>
    document
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  );
};
const open = async () => click(container.querySelector('button')!);

beforeEach(() => {
  sent = [];
  network = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  globalThis.fetch = network;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<MobileInstallEmailButton placement="hero" />));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

it('posts to the server and shows the address only in the success dialog', async () => {
  await open();
  await setInput('input[type="email"]', 'person@example.com');
  await submit();
  expect(network).toHaveBeenCalledTimes(1);
  expect(network).toHaveBeenCalledWith(
    '/api/install-link',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        email: 'person@example.com',
        placement: 'hero',
        website: '',
      }),
    }),
  );
  expect(document.body.textContent).toContain(
    'Check your inbox. We sent the install link to person@example.com. Open it on your computer to add Rivet to Claude, Codex, or Cursor.',
  );
  expect(document.querySelector('form')).toBeNull();
  expect(
    sent
      .filter((event) => event.event.startsWith('mobile_install_email'))
      .map((event) => [
        event.event,
        event.properties.placement,
        event.properties.success,
      ]),
  ).toEqual([
    ['mobile_install_email_opened', 'hero', undefined],
    ['mobile_install_email_submitted', 'hero', true],
  ]);
});

it.each(['provider', 'network'])(
  'shows a retryable %s failure and preserves the address',
  async (failure) => {
    if (failure === 'network')
      network.mockRejectedValueOnce(new Error('offline'));
    else
      network.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ ok: false, error: 'send_failed' }),
      });
    await open();
    await setInput('input[type="email"]', 'person@example.com');
    await submit();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "We couldn't send that just now. Try again in a minute.",
    );
    expect(
      (document.querySelector('input[type="email"]') as HTMLInputElement).value,
    ).toBe('person@example.com');
    expect(
      sent.find((event) => event.event === 'mobile_install_email_submitted')
        ?.properties.success,
    ).toBe(false);
    await submit();
    expect(document.body.textContent).toContain('We sent the install link');
  },
);

it('rejects invalid email before any request', async () => {
  await open();
  await setInput('input[type="email"]', 'invalid');
  await submit();
  expect(network).not.toHaveBeenCalled();
  expect(document.querySelector('[role="alert"]')?.textContent).toContain(
    'Please enter a valid email address',
  );
});

it('keeps the honeypot outside keyboard navigation, screen readers, and autofill', async () => {
  await open();
  const field = document.querySelector(
    'input[name="website"]',
  ) as HTMLInputElement;
  expect(field.hidden).toBe(true);
  expect(field.tabIndex).toBe(-1);
  expect(field.getAttribute('aria-hidden')).toBe('true');
  expect(field.autocomplete).toBe('off');
});

it('keeps the typed address out of every captured event, including real autocapture', async () => {
  await open();
  await setInput('input[type="email"]', 'private.person@example.com');
  await click(document.querySelector('button[type="submit"]')!);
  const description = document.querySelector('[role="dialog"] p')!;
  await click(description);
  await click(
    [...document.querySelectorAll('button')].find(
      (button) => button.textContent === 'Close',
    )!,
  );
  expect(
    sent.some((event) => event.event === 'mobile_install_email_submitted'),
  ).toBe(true);
  expect(sent.some((event) => event.event === '$autocapture')).toBe(true);
  expect(JSON.stringify(sent)).not.toContain('private.person@example.com');
  expect(JSON.stringify(sent)).not.toContain('private.person');
});
