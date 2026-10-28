import { accountIdFromAccessToken, parseAccountId } from './authAccount';

const ACCOUNT_ID = '0b9f3c2e-1d4a-4f6b-9e8d-7c6b5a4f3e2d';

const base64Url = (value: string) =>
  btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const jwtWith = (claims: unknown) =>
  `${base64Url('{"alg":"HS256"}')}.${base64Url(JSON.stringify(claims))}.sig`;

describe('parseAccountId', () => {
  it('accepts a UUID', () => {
    expect(parseAccountId(ACCOUNT_ID)).toBe(ACCOUNT_ID);
  });

  it.each([
    ['missing', null],
    ['empty', ''],
    ['an email', 'someone@example.com'],
    ['a token', 'eyJhbGciOiJIUzI1NiJ9.e30.sig'],
    ['a UUID with trailing data', `${ACCOUNT_ID}x`],
    ['a number', 42],
  ])('rejects %s', (_, raw) => {
    expect(parseAccountId(raw)).toBeNull();
  });
});

describe('accountIdFromAccessToken', () => {
  it('reads the sub claim', () => {
    expect(
      accountIdFromAccessToken(
        jwtWith({ sub: ACCOUNT_ID, email: 'someone@example.com', aud: 'x?' }),
      ),
    ).toBe(ACCOUNT_ID);
  });

  it.each([
    ['not a JWT', 'opaque-token'],
    ['an undecodable payload', 'a.%%%.c'],
    ['a non-object payload', jwtWith('just a string')],
    ['no sub', jwtWith({ email: 'someone@example.com' })],
    ['a non-UUID sub', jwtWith({ sub: 'someone@example.com' })],
  ])('returns null for %s', (_, token) => {
    expect(accountIdFromAccessToken(token)).toBeNull();
  });
});
