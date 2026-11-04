import { readFile } from 'node:fs/promises';

const REQUEST_TIMEOUT_MS = 10000;
const resources = [
  {
    path: '/grokbot-setup.md',
    file: new URL('../public/grokbot-setup.md', import.meta.url),
    contentTypes: ['text/plain', 'text/markdown', 'text/x-markdown'],
  },
  {
    path: '/images/grokbot.svg',
    file: new URL('../public/images/grokbot.svg', import.meta.url),
    contentTypes: ['image/svg+xml'],
  },
];

try {
  const [baseArgument, ...extraArguments] = process.argv.slice(2);
  if (!baseArgument || extraArguments.length > 0) {
    throw new Error('Usage: node scripts/verify-grokbot-setup.mjs <base-url>');
  }
  const baseUrl = new URL(baseArgument);
  if (!['http:', 'https:'].includes(baseUrl.protocol)) {
    throw new Error('The base URL must use HTTP or HTTPS.');
  }
  for (const resource of resources) {
    const url = new URL(resource.path, baseUrl);
    const expected = await readFile(resource.file);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`${url} returned HTTP ${response.status}.`);
    }
    const contentType = response.headers
      .get('content-type')
      ?.split(';')[0]
      .trim()
      .toLowerCase();
    if (!resource.contentTypes.includes(contentType)) {
      throw new Error(
        `${url} returned ${contentType ?? 'no content type'}; expected ${resource.contentTypes.join(' or ')}.`,
      );
    }
    const actual = Buffer.from(await response.arrayBuffer());
    if (!actual.equals(expected)) {
      throw new Error(`${url} does not match ${resource.file.pathname}.`);
    }
    console.log(`Verified ${url} (${contentType}, ${actual.length} bytes).`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
