/** @jest-environment node */
import { handleInstallLink, type InstallLinkEnv } from './install-link';

const env: InstallLinkEnv = {
  RESEND_API_KEY: 'resend-secret',
  SUPABASE_URL: 'https://database.invalid',
  SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
};
const ref = 'r_aZ09bY18';
const request = (
  body: unknown = { email: ' Person@Example.com ', placement: 'hero' },
  headers = {},
) =>
  new Request('https://rivet.design/api/install-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '192.0.2.1',
      ...headers,
    },
    body: JSON.stringify(body),
  });
let network: jest.SpiedFunction<typeof fetch>;

beforeEach(() => {
  network = jest.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    if (String(url).endsWith('/claim_install_link')) {
      return Response.json({
        outcome: 'send',
        id: 'request-1',
        install_ref: ref,
      });
    }
    if (String(url).endsWith('/finish_install_link'))
      return new Response(null, { status: 204 });
    if (url === 'https://api.resend.com/emails')
      return Response.json({ id: 'message-1' });
    throw new Error('Unexpected network request');
  });
});
afterEach(() => jest.restoreAllMocks());

const sentMail = () =>
  network.mock.calls.filter(([url]) => url === 'https://api.resend.com/emails');
const claimResult = (outcome: string) =>
  network.mockResolvedValueOnce(Response.json({ outcome }));

it('normalizes an email, sends it once, and records the provider id', async () => {
  const result = await handleInstallLink(request(), env);
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({ ok: true });
  const claimBody = JSON.parse(network.mock.calls[0][1]!.body as string);
  expect(claimBody).toMatchObject({
    p_email: 'person@example.com',
    p_install_ref: expect.stringMatching(/^r_[0-9A-Za-z]{8}$/),
  });
  expect(claimBody.p_ip_hash).toMatch(/^[a-f0-9]{64}$/);
  expect(JSON.stringify(claimBody)).not.toContain('192.0.2.1');
  expect(sentMail()).toHaveLength(1);
  const options = sentMail()[0][1]!;
  expect(options.headers).toMatchObject({
    'Idempotency-Key': 'install-link/request-1',
    Authorization: 'Bearer resend-secret',
  });
  const payload = JSON.parse(options.body as string);
  expect(payload).toMatchObject({
    from: 'Rivet <hello@rivet.design>',
    to: ['person@example.com'],
    tags: [{ name: 'type', value: 'mobile_install' }],
  });
  expect(payload.text).toContain(`ref=${ref}`);
  expect(payload.text.match(new RegExp(`--ref ${ref}`, 'g'))).toHaveLength(3);
  expect(JSON.parse(network.mock.calls[2][1]!.body as string)).toEqual({
    p_id: 'request-1',
    p_status: 'sent',
    p_message_id: 'message-1',
  });
});

it('silently suppresses an address already sent within 24 hours', async () => {
  claimResult('duplicate');
  const result = await handleInstallLink(request(), env);
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({ ok: true });
  expect(sentMail()).toHaveLength(0);
});

it('drops a filled honeypot before storage or delivery', async () => {
  const result = await handleInstallLink(
    request({ website: 'spam', email: 'invalid' }),
    env,
  );
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({ ok: true });
  expect(network).not.toHaveBeenCalled();
});

it.each([
  'invalid',
  'a@b',
  'a b@example.com',
  `${'a'.repeat(250)}@example.com`,
])('rejects invalid email %s', async (email) => {
  expect(
    (await handleInstallLink(request({ email, placement: 'hero' }), env))
      .status,
  ).toBe(400);
  expect(network).not.toHaveBeenCalled();
});

it('marks a Resend failure and lets the client retry', async () => {
  network.mockResolvedValueOnce(
    Response.json({ outcome: 'send', id: 'request-1', install_ref: ref }),
  );
  network.mockResolvedValueOnce(
    Response.json({ message: 'provider error' }, { status: 500 }),
  );
  const result = await handleInstallLink(request(), env);
  expect(result.status).toBe(502);
  expect(await result.json()).toEqual({ ok: false, error: 'send_failed' });
  expect(JSON.parse(network.mock.calls[2][1]!.body as string)).toEqual({
    p_id: 'request-1',
    p_status: 'failed',
    p_message_id: null,
  });
});

it('enforces the database IP limit before sending', async () => {
  claimResult('rate_limited');
  const result = await handleInstallLink(request(), env);
  expect(result.status).toBe(429);
  expect(result.headers.get('Retry-After')).toBe('3600');
  expect(sentMail()).toHaveLength(0);
});

it('does not promise success for a concurrent send that is still pending', async () => {
  claimResult('in_flight');
  expect((await handleInstallLink(request(), env)).status).toBe(502);
  expect(sentMail()).toHaveLength(0);
});

it('fails closed when storage is unavailable', async () => {
  network.mockResolvedValueOnce(new Response('', { status: 503 }));
  expect((await handleInstallLink(request(), env)).status).toBe(502);
  expect(sentMail()).toHaveLength(0);
});

it('does not claim success if recording a sent message fails', async () => {
  network.mockResolvedValueOnce(
    Response.json({ outcome: 'send', id: 'request-1', install_ref: ref }),
  );
  network.mockResolvedValueOnce(Response.json({ id: 'message-1' }));
  network.mockResolvedValueOnce(new Response('', { status: 503 }));
  expect((await handleInstallLink(request(), env)).status).toBe(502);
});

it('honors configured sender and site URL', async () => {
  await handleInstallLink(request(), {
    ...env,
    INSTALL_LINK_FROM: 'Rivet <hello@mail.rivet.design>',
    PUBLIC_SITE_URL: 'https://preview.rivet.design',
  });
  const payload = JSON.parse(sentMail()[0][1]!.body as string);
  expect(payload.from).toBe('Rivet <hello@mail.rivet.design>');
  expect(payload.text).toContain('https://preview.rivet.design/install?');
});

it('rejects cross-origin calls and unsupported methods', async () => {
  expect(
    (
      await handleInstallLink(
        request(undefined, { Origin: 'https://other.invalid' }),
        env,
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await handleInstallLink(
        new Request('https://rivet.design/api/install-link'),
        env,
      )
    ).status,
  ).toBe(405);
  expect(network).not.toHaveBeenCalled();
});

it('bounds request bytes even without Content-Length', async () => {
  expect(
    (await handleInstallLink(request({ email: 'a'.repeat(3000) }), env)).status,
  ).toBe(413);
  expect(network).not.toHaveBeenCalled();
});
