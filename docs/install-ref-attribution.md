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

## Rollout gate

`EMBED_INSTALL_REF_IN_COPY` in `src/lib/installRef.ts` stays `false` until both
prerequisites are verified:

1. npm's `rivet-design@latest` contains the `--ref` parser from
   rivet-design/rivet-core#1149. Check the published package itself; a merged
   PR or a release workflow in progress is insufficient.
2. The hosted proxy carries the ref through both CLI PKCE callbacks and editor
   sign-in redirects to `/auth-success`.

At verification on October 6, 2026, npm's latest release was `0.21.1`; its
package lacked both `rememberInstallRef` and `dist/utils/installRef.js`.
Do not enable embedding against that release. Once the prerequisites pass,
set the flag to `true` and update the default-command assertions to expect refs.
The explicit enabled-mode tests already exercise the copied-text contract.

## Conflict-resolution verification

The regression for native command copying failed before the copy handler was
added, then passed. The merged copy flow preserves clipboard fallback and copy
method telemetry. The full suite contains 70 passing tests; the production
build passes. Scoped lint passes for the PR files. Full lint remains blocked by
main's `HeroCycle.tsx` directive for the unregistered
`react-hooks/exhaustive-deps` rule.
