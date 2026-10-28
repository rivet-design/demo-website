# Install ref attribution

Each install handoff generates an `r_` ref with eight base62 characters. The
website records it as `install_ref` on `download_clicked` and as
`last_install_ref` on the person. `/auth-success` validates query-string refs
and records them on sign-in outcomes. Matching refs connect events across
browsers; a successful sign-in also identifies the browser by account id (see
[Sign-in](#sign-in)). Token fragments and session ids remain redacted.

## Handoff paths

The split CTA defaults to **Continue in Codex**. Its **Open in desktop**
section offers Codex, Claude, and Cursor; **Copy prompt** copies the general
installer for any coding agent, including terminal CLIs. The desktop links
prefill a coding session through `codex://new?prompt=`, `claude://code/new?q=`,
or `cursor://anysphere.cursor-deeplink/prompt?text=`. The user sends the prompt
in the destination app.

Every path uses the shared `installPrompt` builder:

```text
Install Rivet for this agent: `<command>`
```

Targeted commands use `install codex`, `install claude`, or `install cursor
--mcp`. Claude targets Claude Code, including its view in the desktop app;
it does not also configure Claude Desktop chat. The separate command accordion
keeps its existing Claude Code alias and command-copy behavior.

The general prompt uses bare `install`. With the matching CLI release, Rivet
returns a proposed agent and asks the host agent to get user confirmation in
the conversation before setup. The user can confirm, choose another supported
agent, or choose Other to see the support limit. Installed agents provide
suggestions rather than caller identity. The explicit-target follow-up retains
the attribution ref.

Publish the CLI package containing untargeted installation confirmation before
deploying this website change. A merge into the CLI's main branch does not make
that behavior available through `rivet-design@latest`; older packages may
configure every detected host for bare `install`.

Every desktop activation and copy attempt prepares a fresh ref, except fallback
copies, which reuse the ref of the click they follow. Desktop links
record `download_clicked` with `download_type` set to `codex`, `claude`, or
`cursor`. A successful prompt copy records `agent` after the clipboard write.
These events record handoff intent, not proof that an app opened or Rivet
installed. The ref in the decoded prompt matches `install_ref` and the
person's `last_install_ref`. The embedding flag controls refs in every path.

Desktop links open in the same tab. Each attempt to open the app (the first
click and every "Try opening again") records one `download_handoff` with the
click's `source`, `download_type`, and `install_ref` plus `handoff_result`:

- `left_page`: the visitor left the page, so we assume the app opened and show
  no panel.
- `fallback_shown`: the visitor stayed on the page or came back to it, so the
  "Didn't open?" panel appeared. The panel is held back only if, by then, the
  visitor had closed it, opened the agent menu, or clicked again; a newer
  click reports its own result.

The page counts as left when it is hidden or unloaded, or when it loses focus
within two seconds of the click and does not get it back within 15 seconds.
Losing focus and getting it back without the page ever being hidden, as when
someone cancels a browser's own "open this link with the app?" prompt, counts
as staying. Every platform and browser uses the same check.

The panel offers the agent's install command, a download link for the agent,
and a retry of the same link. A copy from the panel records `download_clicked`
with source `handoff_fallback`, the original `install_ref`, and its
`copy_method`; it does not add a `download_handoff`. The latest
`handoff_result` for a ref is the outcome.

The dropdown, accordion rows, fallback row, copy icons, and manual command copies retain the
same ref between telemetry and the command when embedding is enabled. The
accordion keeps `copy_method` values `row_click`, `icon`, and `manual_select`.

A native copy of a complete accordion command appends its ref through the copy
event's clipboard data. Partial text selections remain unchanged. If an
automatic clipboard write fails, the command remains selected for a native
keyboard copy, which generates its own ref.

## Sign-in

`/auth-success` has two entry URLs. `editor_sign_in_completed` and
`editor_sign_in_failed` record which one as `sign_in_flow`, next to the older
`auth_flow`:

| URL                                         | `sign_in_flow`   | `auth_flow` |
| ------------------------------------------- | ---------------- | ----------- |
| `?login=complete` or `?login=error&reason=` | `login_complete` | `pkce`      |
| `?session=<id>#access_token=...`            | `session`        | `implicit`  |

Both flows read `ref` from the query string only, never the fragment, and
send it as `install_ref` when it is a valid ref. A link without a ref sends no
`install_ref`.

On success the page calls `posthog.identify(<account id>)` before capturing
the completion, so the downloader's anonymous events merge into the account.
The account id is the Supabase auth user id, a UUID. Anything that is not a
UUID is ignored. The id comes from:

- `session`: the `sub` claim of the access token, read only after the proxy
  accepts the token.
- `login_complete`: an optional `account_id` query param.

A browser already identified (as the same account or a different one) is not
identified again, so a shared machine never merges two accounts.

The page removes the fragment and `session` from the address bar as soon as
it reads them. `before_send` also strips every fragment and the `session`,
`access_token`, `refresh_token`, `token`, and `code` query params from
`/auth-success` URLs in every event, since the initial pageview fires before
the page runs.

### rivet-core contract

The site does not build either sign-in URL. rivet-core does: the proxy's PKCE
callback redirects to `?login=...`, and the legacy flow passes
`https://rivet.design/auth-success?session=<id>` to Supabase as `redirectTo`.
To make every sign-in attributable, rivet-core must:

1. Append `&ref=<install ref>` to the `?session=` `redirectTo` whenever the
   install recorded a ref, URL-encoded, before the fragment. Supabase must
   still accept the URL: its redirect allowlist entry has to match
   `https://rivet.design/auth-success?session=...&ref=...` (for example
   `https://rivet.design/auth-success**`). Otherwise Supabase falls back to the
   Site URL and drops the query.
2. Optionally append `&account_id=<Supabase user id>` to the `?login=complete`
   redirect so PKCE sign-ins identify too. Send only the UUID, never an email
   or token.
3. If the CLI or app identifies PostHog users, use the same Supabase user id
   as the distinct id so the persons join.

## Rollout verification

`EMBED_INSTALL_REF_IN_COPY` in `src/lib/installRef.ts` is enabled. On October 6,
2026, the published `rivet-design@latest` package was verified as `0.21.2` and
contained both `rememberInstallRef` and `dist/utils/installRef.js` from
rivet-design/rivet-core#1149.

The hosted proxy initially returned HTTP 502, then recovered. Live requests
verified that an editor sign-in redirect carries the supplied ref to
`rivet.design/auth-success` and that a deliberately cancelled CLI PKCE callback
also carries its ref to that page. No user signed in during these checks. The
core auth tests cover successful PKCE callbacks through the same redirect path.

If rolling back command embedding, set the flag to `false`. Explicit disabled-mode
tests preserve plain-command behavior; default-mode tests require the copied
command and telemetry to carry the same ref.
