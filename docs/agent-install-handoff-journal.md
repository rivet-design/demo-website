# Agent install handoff

## Checklist

- [x] Trace the existing install prompt, raw command, and attribution paths.
- [x] Compare a shared helper with a separate handoff module. Keep the shared helper.
- [x] Confirm literal prompt and encoded deep-link regressions fail before implementation.
- [x] Add typed generic and targeted prompts with the existing attribution flag.
- [ ] Replace copy-only agent rows with Claude and Codex links plus Copy to agent.
- [ ] Verify the controls in a browser and run the affected tests and build.
- [ ] Publish a ready pull request and hand CI monitoring to the coordinator.

## Throughput checkpoint

- Blocking first steps. Read the shared command builder and attribution contract before edits.
- Independent workstreams. Core host selection and website handoff changes use separate repositories.
- Shared mutable state. Website command, prompt, and deep-link helpers stay in `src/lib/install.ts`.
- Smallest safe decomposition. One website owner edits the helper, component, tests, and attribution documentation. The coordinator reviews and verifies the browser.

## Decisions and evidence

The universal payload is one sentence. Attribution stays inside the command as
`--ref r_<eight base62 characters>`. `EMBED_INSTALL_REF_IN_COPY` stays enabled.
Claude links target `claude://code/new?q=`, which opens a coding session rather
than desktop chat. Codex links target `codex://new?prompt=`. Neither link sends
the prefilled prompt automatically.

Seven helper regressions failed because the prompt and deep-link builders did
not exist. After implementation, the helper and existing ref suites pass all
23 tests. The TypeScript check and scoped ESLint pass.

The website must deploy after the Rivet package with host-aware untargeted
installation is published. An older package can treat bare `install` as an
installation for every detected host.

The expected React companion skill was not present in the available skill
roots. The TypeScript skill and existing React patterns govern the change.
The default Node 23 version falls outside Jest's supported engine range.
Verification uses the installed Node 24.18.0 binary.
