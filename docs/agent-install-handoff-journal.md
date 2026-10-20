# Agent install handoff

## Checklist

- [x] Trace the existing install prompt, raw command, and attribution paths.
- [x] Compare a shared helper with a separate handoff module. Keep the shared helper.
- [x] Confirm literal prompt and encoded deep-link regressions fail before implementation.
- [x] Add typed generic and targeted prompts with the existing attribution flag.
- [x] Replace copy-only agent rows with Claude and Codex links plus Copy to agent.
- [x] Run the affected tests and build.
- [ ] Verify the controls in a browser. Blocked because the browser access policy rejected localhost access.
- [x] Publish a ready pull request and hand CI monitoring to the coordinator.

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

## Installation confirmation

Sam approved confirming the detected agent in the host conversation before
untargeted setup. The short copied prompt and targeted deep links remain the
same. Bare install returns the proposed agent, evidence, supported choices, and
an Other explanation. A follow-up explicit-target invocation preserves the
install ref. Installed agents cannot establish caller identity. The website
must ship after the core package containing this confirmation behavior.

This follow-up changes Markdown documentation only. Existing website source and
its 78-test validation remain unchanged; whitespace checks pass. CI and review
for the documentation commit remain under coordinator monitoring.

The expected React companion skill was not present in the available skill
roots. The TypeScript skill and existing React patterns govern the change.
The default Node 23 version falls outside Jest's supported engine range.
Verification uses the installed Node 24.18.0 binary.

All seven website suites pass, with 78 tests. The production build and scoped
ESLint pass. Existing output warns about the ts-jest import configuration,
Browserslist data age, and production chunk size. No dependency configuration
changes are part of this task.

The coordinator's independent source review accepted the native anchors,
short prompt builder, and shared ref per menu opening. Actual rendered browser
verification remains blocked. Superset browser authentication was unavailable,
and the fallback browser explicitly denied localhost origin access. No other
browser surface was tried after that denial.

Ready website pull request: https://github.com/rivet-design/demo-website/pull/136.
The coordinator owns CI and review follow-through. The pull request remains
open for Sam's review and merge approval.
