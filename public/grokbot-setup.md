# Set up Rivet in Grok Bot

Connect Rivet as a local stdio MCP server on Grok Bot's cloud computer. Keep the user's existing permissions and approval policy. Run installation only. Do not generate design directions unless the user asks.

If this URL returns HTML, a sign-in page, or unrelated content, stop and report that the setup guide is unavailable. Do not infer setup instructions from the website shell.

## Install a durable runtime

Use durable cloud storage that remains available after Grok Bot and its computer restart. Keep the Node executable, the installed Rivet package, and the connector configuration available at their original absolute paths.

Choose Node 22.16 or later on the 22.x release line, or Node 24 or later. Node 23 is unsupported. Check `node --version` before installing. If no supported runtime is available under the current permissions, stop and report the missing prerequisite.

Install the package in a durable directory. This example uses the cloud computer's home directory. Choose another absolute path if that directory does not persist on the computer.

```sh
export RIVET_RUNTIME_DIRECTORY="$HOME/.local/share/rivet-grokbot"
npm install --prefix "$RIVET_RUNTIME_DIRECTORY" rivet-design@latest
```

## Verify caller support and print the connector configuration

Run this generator with the supported Node executable. It verifies the installed release before printing the connector entry. If the check fails, stop before registering the connector. Report the installed version and the need for a published Rivet release with Grok Bot caller support. A merged core change alone does not update `rivet-design@latest`.

```sh
node --input-type=module <<'NODE'
import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [major, minor] = process.versions.node.split('.').map(Number);
if (!((major === 22 && minor >= 16) || major >= 24)) {
	throw new Error(`Unsupported Node ${process.version}. Use Node 22.16+ on 22.x or Node 24+.`);
}
const directory = process.env.RIVET_RUNTIME_DIRECTORY;
if (!directory || !isAbsolute(directory)) {
	throw new Error('Set RIVET_RUNTIME_DIRECTORY to the absolute durable installation directory.');
}
const packageDirectory = join(directory, 'node_modules', 'rivet-design');
const { version } = JSON.parse(readFileSync(join(packageDirectory, 'package.json'), 'utf8'));
let isCompatible;
try {
	const { parseHandoff } = await import(pathToFileURL(join(packageDirectory, 'dist', 'cli', 'handoff.js')).href);
	isCompatible = parseHandoff({ callerAgent: 'grokbot' }, {}).handoff.agent === 'grokbot';
} catch (error) {
	throw new Error(`Rivet ${version} could not verify Grok Bot caller support. Stop and report the need for a compatible published release.`, { cause: error });
}
if (!isCompatible) {
	throw new Error(`Rivet ${version} does not retain the Grok Bot caller identity. Stop and report the need for a compatible published release.`);
}
const configuration = {
	command: realpathSync(process.execPath),
	args: [realpathSync(join(packageDirectory, 'bin', 'rivet.js')), 'mcp', 'serve', '--caller-agent', 'grokbot'],
	env: {
		RIVET_PLUGIN_NAME: 'rivet',
		NODE_ENV: 'production',
		RIVET_AUTO_UPDATE_DISABLED: '1',
		RIVET_TELEMETRY_DISABLED: '1',
	},
};
console.log(JSON.stringify(configuration, null, 2));
NODE
```

Register the printed entry in Grok Bot's local MCP connector settings. Use the absolute Node executable as `command`. Keep the argument array in order, beginning with the absolute `bin/rivet.js` path. Preserve all four environment values. Keep the registration and runtime across restarts. There is no Grok Bot global installer target.

Confirm that Grok Bot discovers the connector's tools. If registration or tool discovery fails, report the error under the existing approval policy. Do not switch providers, widen permissions, or install an alternative runtime to evade a denial.

## Sign in and open the project

Call the exposed `rivet_login` MCP tool. Show its hosted authorization URL to the user and let the user finish sign-in. Do not invent credentials or claim that opening the URL completed sign-in.

Ask which project to use if the project is unclear. Open that project's absolute directory with the exact Node executable and Rivet bin from the verified connector entry. Preserve the connector environment for the lifecycle CLI command. Replace the example paths below with those inspected values.

```sh
env RIVET_PLUGIN_NAME=rivet NODE_ENV=production RIVET_AUTO_UPDATE_DISABLED=1 RIVET_TELEMETRY_DISABLED=1 \
	/absolute/path/to/node /absolute/path/to/bin/rivet.js \
	open --project /absolute/path/to/project --no-browser --caller-agent grokbot
```

Use the returned `editorUrl`, including its fragment, in Grok Bot's Computer view. Show previews there. Follow any returned saved guidance and report a guidance-loading error. If authentication remains required, show the returned authorization URL and wait for the user to finish before retrying. Keep the original runtime and environment for later lifecycle commands.

## Follow the user's next design request

Before exploring designs, read account-wide saved design context with `rivet_get_design_context({})`. Apply the returned instructions unless the current user request overrides or excludes them. Installing the connector does not authorize an exploration.

When the user asks for an exploration, use the connector's exposed tools and the current host's native workers. Keep the current model and approval policy unless the user explicitly requests another supported model. Follow the returned `workerPrompt`, `completeCommand`, and `parallelism` exactly. A direct assignment stays in the current host. A delegated assignment uses one native worker per work item. Each worker completes its own assignment immediately with its exact completion command. Do not replace native workers with detached execution or delay a finished item's completion for its siblings.

If native delegation, the requested model, a path, or a required permission is unavailable, report the assigned work as failed through its completion command. Include the concrete error. Do not retry with broader permissions or switch providers to bypass the failure.

Keep the user's work intact. Do not cancel explorations or apply a design without the user's instruction. If the connector's tool catalog differs from the expected workflow, report the mismatch instead of inventing a tool.
