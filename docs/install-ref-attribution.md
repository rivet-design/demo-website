# Install ref attribution

Each install handoff generates an `r_` ref with eight base62 characters. The
website records it as `install_ref` on `download_clicked` and as
`last_install_ref` on the person. `/auth-success` validates query-string refs
and records them on sign-in outcomes. Matching refs connect events across
browsers without merging PostHog identities. Token fragments remain redacted.

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

Every desktop activation and copy attempt prepares a fresh ref. Desktop links
record `download_clicked` with `download_type` set to `codex`, `claude`, or
`cursor`. A successful prompt copy records `agent` after the clipboard write.
These events record handoff intent, not proof that an app opened or Rivet
installed. The ref in the decoded prompt matches `install_ref` and the
person's `last_install_ref`. The embedding flag controls refs in every path.

The dropdown, accordion rows, copy icons, and manual command copies retain the
same ref between telemetry and the command when embedding is enabled. The
accordion keeps `copy_method` values `row_click`, `icon`, and `manual_select`.

A native copy of a complete accordion command appends its ref through the copy
event's clipboard data. Partial text selections remain unchanged. If an
automatic clipboard write fails, the command remains selected for a native
keyboard copy, which generates its own ref.

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
