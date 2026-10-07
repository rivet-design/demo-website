# Install ref attribution

Each install copy generates an `r_` ref with eight base62 characters. The
website records it as `install_ref` on `download_clicked` and as
`last_install_ref` on the person. `/auth-success` validates query-string refs
and records them on sign-in outcomes. Matching refs connect events across
browsers without merging PostHog identities. Token fragments remain redacted.

## Copy paths

The dropdown, accordion rows, copy icons, and manual command copies retain the
same ref between telemetry and copied text when embedding is enabled. The
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

## Conflict-resolution verification

The regression for native command copying failed before the copy handler was
added, then passed. The merged copy flow preserves clipboard fallback and copy
method telemetry. The full suite contains 71 passing tests; the production
build passes. Scoped lint passes for the PR files. Full lint remains blocked by
main's `HeroCycle.tsx` directive for the unregistered
`react-hooks/exhaustive-deps` rule.
