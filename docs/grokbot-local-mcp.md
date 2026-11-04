# Grok Bot local MCP setup

Sam chose local MCP and preview review through Grok Bot's Computer view for
the first release. Add Grok Bot to the shared agent chooser using a copyable
setup prompt. Device-accessible previews, shareable direction links, and
marketplace packaging remain follow-up work.

Grok Bot has no Rivet global installer target. The prompt must register the
installed runtime's absolute Node executable and bin as a local stdio MCP
connector on the Bot's computer. Keep the existing host approval policy and
native worker delegation. Do not invent a prompt-prefill deep link.

The CTA and successful prompt copies use `download_clicked` with
`download_type: grokbot` and `install_method: local_mcp`. They generate no CLI
install ref, do not change `last_install_ref`, and do not imply successful
installation. No setup prompt, filesystem path, or credentials enter telemetry.

## Release prerequisite

Publish a CLI with Grok Bot caller support before deploying the website
change. A core merge alone does not update `rivet-design@latest`. The prompt
must verify that the installed runtime's `parseHandoff` retains
`handoff.agent === "grokbot"` and stop with an actionable explanation if it
does not. Accepting an unknown caller flag alone is insufficient evidence.

The host icon is resized from the installed Grok Bot app's `icon.icns`
resource. The download link uses the official [Grok Bot page](https://x.ai/bot).

Core support:

https://github.com/rivet-design/rivet-core/pull/1296

Host permission-denial and app-restart checks remain part of MCP acceptance.
The website checks establish its chooser and copy flow only.

## Delivery checklist

- [x] Inspect the shared install CTA, command accordion, and attribution contract.
- [x] Use a clean checkout from main with Sam's approval.
- [x] Reproduce the missing Grok Bot chooser and setup flow with failing tests.
- [x] Add the entry, setup prompt, and existing-event attribution.
- [x] Verify copy success, copy failure, keyboard navigation, and host switching.
- [x] Verify desktop and mobile layouts in a real browser.
- [x] Publish a ready PR.
- [ ] Settle checks and review feedback on the final commit.

## Verification evidence

The full suite passes 198 tests. Browser checks cover the desktop layout and
390- and 320-pixel mobile widths. At 320 pixels, the setup panel fits inside
12-pixel margins and the selected host label renders in full. Explicit
content width on the nested chooser containers prevents intrinsic flex
shrinkage from clipping that label; full-width placements retain their
existing layout.

The browser clipboard exactly matches the visible prompt. Keyboard navigation
opens setup, Escape closes it and restores focus to the primary action, and
the unit regression keeps an older desktop handoff from replacing the Grok
Bot panel. Clipboard denial selects the prompt and records no successful
copy event.
