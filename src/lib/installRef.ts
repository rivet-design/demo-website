// Install refs tie a Rivet install back to the site copy that started it. Each
// install copy gets a fresh ref; the CLI carries it to the sign-in URL as
// `?ref=`, and /auth-success reports it, so the copy and the sign-in can be
// matched on `install_ref` even when they happen in different browsers.
//
// Contract shared with rivet core's CLI: `r_` followed by exactly 8 base62
// characters, passed as `--ref <value>` to `rivet install`.

export const EMBED_INSTALL_REF_IN_COPY = true;

export type InstallRef = `r_${string}`;

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const REF_BODY_LENGTH = 8;
const INSTALL_REF_PATTERN = /^r_[0-9A-Za-z]{8}$/;

// 248 is the largest multiple of 62 that fits in a byte; rejecting bytes at or
// above it keeps every base62 character equally likely.
const UNBIASED_BYTE_LIMIT = 248;

const randomBytes = (count: number): Uint8Array => {
  const bytes = new Uint8Array(count);
  if (globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(bytes);
  }
  return bytes.map(() => Math.floor(Math.random() * 256));
};

export const generateInstallRef = (): InstallRef => {
  let body = '';
  while (body.length < REF_BODY_LENGTH) {
    for (const byte of randomBytes(REF_BODY_LENGTH)) {
      if (byte < UNBIASED_BYTE_LIMIT && body.length < REF_BODY_LENGTH) {
        body += BASE62[byte % 62];
      }
    }
  }
  return `r_${body}`;
};

export const isInstallRef = (value: unknown): value is InstallRef =>
  typeof value === 'string' && INSTALL_REF_PATTERN.test(value);

/** The ref from a query-string value, or null when it is missing or malformed. */
export const parseInstallRef = (raw: string | null): InstallRef | null =>
  isInstallRef(raw) ? raw : null;
