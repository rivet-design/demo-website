# rivet.design

Run `npm ci`, then `npm run dev`. Validate with `npm run lint`, `npm run build`,
and `npm test -- --runInBand`. Browser configuration is in `.env.example`
(`.env.sample` remains available for existing setups).

## Mobile install email

Below the `md` breakpoint, the hero offers **Email me the link**. The browser
posts to `/api/install-link`; it never writes these requests to Supabase or
forwards them to Clay. The email links to `/install` with UTM parameters and a
single install ref. That page reuses the homepage's prompt picker and command
rows, and preserves the ref in copies and `download_clicked` events. Phones
see a note to open the link on a computer. Existing desktop install flows and
the waitlist remain unchanged.

The existing server runtime is the Cloudflare Worker in `worker/clay-proxy.js`.
There is no deployed Vercel `api/` directory: `/api/clay-webhook` in
`useEmailSignup` is a fallback URL, and `VITE_CLAY_PROXY_URL` selects the Worker.
The new endpoint uses the same Worker pattern, with a separate entry and
configuration so the Clay deployment stays independent. It calls the Resend
REST API and Supabase RPC using server-only bindings; no Node SDK is needed.

### Deployment (production and preview)

1. Create a Resend **send-only** API key. Verify the chosen sending domain with
   the SPF and DKIM records supplied by Resend; optionally add DMARC. Confirm
   the sender and copy. The default is `Rivet <hello@rivet.design>`; if using
   `mail.rivet.design`, change the sender to an address on that verified subdomain.
2. Apply `supabase/migrations/202610190001_install_link_requests.sql` through
   the project's normal migration process or the Supabase SQL editor.
3. Set the following bindings on the install-link Worker with
   `npx wrangler secret put NAME --config worker/wrangler.install-link.toml`:

   | Variable                    | Purpose / default                                 |
   | --------------------------- | ------------------------------------------------- |
   | `RESEND_API_KEY`            | Required, send-only Resend key                    |
   | `SUPABASE_URL`              | Required, the database project URL                |
   | `SUPABASE_SERVICE_ROLE_KEY` | Required, bypasses RLS; never expose to a browser |
   | `INSTALL_LINK_FROM`         | `Rivet <hello@rivet.design>` (non-secret config)  |
   | `PUBLIC_SITE_URL`           | `https://rivet.design` (non-secret config)        |

4. Deploy with `npx wrangler deploy --config worker/wrangler.install-link.toml`.
   The route requires the `rivet.design` zone on Cloudflare and traffic proxied
   through it. Keep `CF-Connecting-IP` intact. Requests without that trusted
   header fail closed. The route must take precedence over the frontend host's
   SPA fallback. Ensure `/install` itself serves the SPA on the frontend host.
5. For previews, create a **separate** Worker/config and proxied hostname in
   your Cloudflare zone (for example `preview.rivet.design` pointing to the
   frontend preview). Route that hostname's `/api/install-link` to its Worker,
   set `PUBLIC_SITE_URL` to the same preview origin, and configure its own
   Resend/Supabase secrets. A bare `*.onrender.com` preview is outside your
   Cloudflare zone and needs this custom hostname; adding Render environment
   variables alone does not deploy or configure a Cloudflare Worker.
6. Send a real request and check delivery within a minute in Gmail, Apple Mail,
   and Outlook. Inspect received headers for SPF and DKIM **PASS**. Browser
   screenshots and mocked tests cannot establish deliverability or native
   email-client rendering. Provider acceptance (`sent`) is not inbox delivery.

For local endpoint development, use
`npx wrangler dev --config worker/wrangler.install-link.toml` with a local
`worker/.dev.vars` file (ignored by git). Test through the Worker URL, with a
test `CF-Connecting-IP` header; do not put production secrets in browser env.
The Vite-only development server does not serve this API. UI tests mock it.

### Abuse protection and retries

The honeypot is silently accepted before storage. Valid requests are limited
to five per IP per rolling hour. The database stores a salted SHA-256 IP hash,
never the raw IP; expired rate-limit rows are deleted on subsequent requests.
Keep the service key stable to keep the hash stable during a quota window.
Both tables use RLS with no anonymous or authenticated policies or grants.
Only `service_role` can access the tables and RPCs.

`claim_install_link` takes transaction-level locks for the IP and address,
so multiple Worker instances cannot bypass limits with simultaneous requests.
Sent addresses are suppressed for 24 hours and logged as `suppressed_duplicate`.
The schema adds a transient `pending` status and `updated_at` lease to the
spec's final statuses (`sent`, `failed`, `suppressed_duplicate`). An in-flight
claim returns a retryable error rather than a false success. Failed sends and
leases older than one minute reuse the row, ref, and Resend idempotency key;
this also handles a provider timeout or a failed database write after a send.
Resend's idempotency window is 24 hours. No marketing contact is created.

### Measurement and future plugins

`mobile_install_email_opened` contains placement; `mobile_install_email_submitted`
contains placement and success. Neither contains the email. The entire dialog
is excluded from PostHog autocapture and its text is masked for recordings.
The existing auth-token `before_send` redaction is preserved.

PostHog captures the normal `/install` pageview and email UTM parameters.
Copies carry `source: email_install_page` and `install_ref`. Existing
`/auth-success?ref=...` telemetry carries the same ref. Join successful request
rows, copies, and `editor_sign_in_completed` on `install_ref`; deduplicate rows
by ref and filter to `status = 'sent'` when counting sent emails. The server
does not emit an optional PostHog event. Resend acceptance and inbox delivery
are distinct, as are a copied command and a completed sign-in.

Keep `/install` as the stable destination when official plugins ship. Today
it offers only supported prompt-based installs. Future plugin choices can
replace or supplement those controls without changing previously sent links;
old emails' fallback commands remain point-in-time content. Before claiming
end-to-end plugin attribution, verify how the official install/auth flow
preserves the ref. Track plugin outbound clicks separately from command
copies and completed installs. No unshipped plugin links are exposed here.

Ship this separately from other homepage changes by at least a week, then
compare phone opens, submits, sent emails, email page visits, copies, and
ref-matched sign-ins against the baseline of about one phone copy per week.
