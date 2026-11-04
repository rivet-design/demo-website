# Grok Bot local MCP setup

Sam chose local MCP and preview review through Grok Bot's Computer view for
the first release. Add Grok Bot to the shared agent chooser using a copyable
setup prompt that links to [the public setup guide](../public/grokbot-setup.md).
The copied URL is always `https://rivet.design/grokbot-setup.md`, including on
preview deployments. Device-accessible previews, shareable direction links, and
marketplace packaging remain follow-up work.

Grok Bot has no Rivet global installer target. The guide registers the
installed runtime's absolute Node executable and bin as a local stdio MCP
connector on the Bot's computer. Keep the existing host approval policy and
native worker delegation. Do not invent a prompt-prefill deep link.

The CTA and successful prompt copies use `download_clicked` with
`download_type: grokbot` and `install_method: local_mcp`. They generate no CLI
install ref, do not change `last_install_ref`, and do not imply successful
installation. No setup prompt, filesystem path, or credentials enter telemetry.

## Release prerequisite

Publish a CLI with Grok Bot caller support before deploying the website
change. A core merge alone does not update `rivet-design@latest`. The guide
verifies that the installed runtime's `parseHandoff` retains
`handoff.agent === "grokbot"` and stops with an actionable explanation if it
does not. Accepting an unknown caller flag alone is insufficient evidence.

The host icon is Sam's supplied SVG, retained byte for byte at
`public/images/grokbot.svg`. Ordinary image rendering preserves its white eyes.
The download link uses the official [Grok Bot page](https://x.ai/bot).

Core support:

https://github.com/rivet-design/rivet-core/pull/1296

Host permission-denial and app-restart checks remain part of MCP acceptance.
The website checks establish its chooser and copy flow only.

A local MCP protocol audit started two server processes with the same saved
configuration. Both advertised 18 intent-v2 tools. This proves local protocol
reconnection and configuration reuse. It does not prove that the Grok Bot app
retains the connector, sign-in, or results after a full restart. Actual app
restart, hosted-storage durability, and host permission-denial QA remain open.

The canonical guide URL returned the SPA HTML during this task. Production
deployment and validation remain pending. An HTTP 200 response does not
establish readiness. Deploy and verify the guide
and icon before enabling the entry for production users. From the matching
website checkout, run the exact-body HTTP check against the deployed origin:

```sh
node scripts/verify-grokbot-setup.mjs https://rivet.design
```

The check requires Markdown or plain-text MIME for the guide and
`image/svg+xml` for the icon. Both response bodies must match the committed
public files exactly. A compatible published core package and a passing
deployed-artifact check are separate rollout prerequisites.

## Delivery checklist

- [x] Inspect the shared install CTA, command accordion, and attribution contract.
- [x] Use a clean checkout from main with Sam's approval.
- [x] Reproduce the missing Grok Bot chooser and setup flow with failing tests.
- [x] Add the entry, setup prompt, and existing-event attribution.
- [x] Verify copy success, copy failure, keyboard navigation, and host switching.
- [x] Verify desktop and mobile layouts in a real browser.
- [x] Publish a ready PR.
- [ ] Validate the published compatible CLI and deployed public guide.
- [ ] Settle checks and review feedback on the final commit.

## Verification evidence

Browser checks before the prompt and SVG revision cover the desktop layout and
390- and 320-pixel mobile widths. At 320 pixels, the setup panel fits inside
12-pixel margins and the selected host label renders in full. Explicit
content width on the nested chooser containers prevents intrinsic flex
shrinkage from clipping that label; full-width placements retain their
existing layout.

The browser clipboard exactly matches the visible prompt. Keyboard navigation
opens setup, Escape closes it and restores focus to the primary action even
when focus has left the setup panel, and
the unit regression keeps an older desktop handoff from replacing the Grok
Bot panel. Clipboard denial selects the prompt and records no successful
copy event.

Review found that the original Escape listener only watched desktop fallback
state. A failing DOM regression reproduced Escape on the main CTA leaving
Grok Bot setup open. The shared document listener now watches both setup
states, and the redundant in-panel listener is removed.

The clipboard hook regressions cover repeat successes, overlap completion
order, custom delays, independent instances, pending writes after unmount,
and fallback focus restoration on success and failure. The hook owns one
reset timer per instance. Its latest successful completion renews feedback.
Failure keeps the previous success deadline and still logs and rejects.
`InstallCommandRow` keeps its separate existing `copiedId` timer policy.

The public guide's configuration generator runs verbatim against the built
core candidate and prints the expected absolute command, arguments, and
environment. It rejects the known incompatible cached `0.22.0` package before
printing a connector entry. These checks do not establish support in the
current published npm package.

Run focused regressions and the local HTTP check with a real built preview:

```sh
npm test -- --runInBand --runTestsByPath src/hooks/useClipboard.test.tsx src/components/PromptInstallButton.test.tsx src/lib/install.test.ts src/lib/handoff.test.ts src/components/InstallAccordion.test.tsx
npm run build
npm run preview -- --host 127.0.0.1 --port 4183 --strictPort
```

In another terminal, run:

```sh
node scripts/verify-grokbot-setup.mjs http://127.0.0.1:4183
```

The final revision passes all 215 tests across 13 suites on Node 24.18.0,
lint, and the production build. Browser verification confirms the supplied
SVG loads, the short prompt copies exactly by button and keyboard, and Escape
restores focus. At 320 pixels, the panel is 296 pixels wide with 12-pixel
margins and no page overflow. The built guide and SVG pass exact-content and
MIME checks. A passing local artifact check does not validate the canonical
production URL or a real Grok Bot connector installation.
