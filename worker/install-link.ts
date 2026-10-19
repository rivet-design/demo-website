import { generateInstallRef, isInstallRef } from '../src/lib/installRef';
import { renderInstallEmail } from './install-email';

export type InstallLinkEnv = {
  RESEND_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  INSTALL_LINK_FROM?: string;
  PUBLIC_SITE_URL?: string;
};

type Claim = {
  outcome: 'send' | 'duplicate' | 'rate_limited' | 'in_flight';
  id?: string;
  install_ref?: string;
};

const json = (body: object, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });

const rpc = async (env: InstallLinkEnv, name: string, body: object) => {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Install request storage unavailable');
  if (response.status === 204) return null;
  return response.json();
};

export const handleInstallLink = async (
  request: Request,
  env: InstallLinkEnv,
) => {
  if (request.method !== 'POST')
    return json({ ok: false }, 405, { Allow: 'POST' });
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin)
    return json({ ok: false }, 403);

  let body: Record<string, unknown>;
  try {
    // Bound the actual stream, including requests without Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return json({ ok: false }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return json({ ok: false }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    body = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new Error('Invalid body');
  } catch {
    return json({ ok: false }, 400);
  }
  if (body.website) return json({ ok: true });
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (
    email.length > 254 ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ||
    body.placement !== 'hero'
  ) {
    return json({ ok: false, error: 'invalid_request' }, 400);
  }
  if (
    !env.RESEND_API_KEY ||
    !env.SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  try {
    // Cloudflare overwrites this header; never trust caller-supplied X-Forwarded-For.
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip) return json({ ok: false, error: 'send_failed' }, 502);
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`${env.SUPABASE_SERVICE_ROLE_KEY}:${ip}`),
    );
    const ipHash = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    const claim: Claim = await rpc(env, 'claim_install_link', {
      p_email: email,
      p_ip_hash: ipHash,
      p_install_ref: generateInstallRef(),
    });
    if (claim.outcome === 'rate_limited')
      return json({ ok: false, error: 'rate_limited' }, 429, {
        'Retry-After': '3600',
      });
    if (claim.outcome === 'duplicate') return json({ ok: true });
    if (claim.outcome === 'in_flight')
      return json({ ok: false, error: 'send_failed' }, 502, {
        'Retry-After': '60',
      });
    if (
      claim.outcome !== 'send' ||
      !claim.id ||
      !isInstallRef(claim.install_ref)
    )
      throw new Error('Invalid claim');

    let messageId: string;
    try {
      const content = renderInstallEmail(
        claim.install_ref,
        env.PUBLIC_SITE_URL || 'https://rivet.design',
      );
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `install-link/${claim.id}`,
        },
        body: JSON.stringify({
          from: env.INSTALL_LINK_FROM || 'Rivet <hello@rivet.design>',
          to: [email],
          ...content,
          tags: [{ name: 'type', value: 'mobile_install' }],
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error('Email provider unavailable');
      const result = (await response.json()) as { id?: string };
      if (!result.id) throw new Error('Missing message id');
      messageId = result.id;
    } catch {
      await rpc(env, 'finish_install_link', {
        p_id: claim.id,
        p_status: 'failed',
        p_message_id: null,
      });
      return json({ ok: false, error: 'send_failed' }, 502);
    }
    await rpc(env, 'finish_install_link', {
      p_id: claim.id,
      p_status: 'sent',
      p_message_id: messageId,
    });
    return json({ ok: true });
  } catch {
    return json({ ok: false, error: 'send_failed' }, 502);
  }
};

export default { fetch: handleInstallLink };
