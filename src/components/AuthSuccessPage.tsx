import { useEffect, useState } from 'react';

const PROXY_URL = 'https://rivet-proxy.onrender.com';

type AuthState = 'processing' | 'success' | 'error';

/** Friendly copy for the PKCE callback's ?reason= codes (see proxy auth.ts). */
const PKCE_ERROR_MESSAGES: Record<string, string> = {
  session_expired:
    'This sign-in link expired. Start the sign-in again from your editor or terminal.',
  provider_denied: 'Google did not complete the sign-in. Please try again.',
  exchange_failed:
    'The sign-in could not be completed (the link may have been used already). Please try again.',
  verification_failed: 'The sign-in could not be verified. Please try again.',
  session_invalid: 'This sign-in link is invalid. Please start again.',
  internal: 'Something went wrong on our side. Please try again.',
};

/**
 * OAuth callback page for Rivet authentication.
 *
 * PKCE flow (current): the proxy has already completed the login server-side
 * and redirects here with ?login=complete|error — this page is purely
 * informational and no tokens ever reach the browser.
 *
 * Implicit flow (legacy desktop/MCP clients): tokens arrive in the URL hash
 * and this page relays them to the proxy's /complete endpoint.
 */
const AuthSuccessPage = () => {
  const [authState, setAuthState] = useState<AuthState>('processing');
  const [error, setError] = useState<string | null>(null);

  /**
   * @effect Render the PKCE outcome, or relay legacy implicit-flow tokens
   * @deps None - runs once on mount
   */
  useEffect(() => {
    const completeAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);

        // PKCE flow: the proxy already finished the login; just render it.
        const pkceOutcome = urlParams.get('login');
        if (pkceOutcome === 'complete') {
          setAuthState('success');
          return;
        }
        if (pkceOutcome === 'error') {
          const reason = urlParams.get('reason') ?? '';
          setError(
            PKCE_ERROR_MESSAGES[reason] ??
              'Something went wrong. Please try again.',
          );
          setAuthState('error');
          return;
        }

        // Legacy implicit flow: relay hash tokens to the proxy.
        const sessionId = urlParams.get('session');

        if (!sessionId) {
          setError('Missing session ID');
          setAuthState('error');
          return;
        }

        // Extract tokens from URL hash (Supabase implicit flow)
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (!accessToken) {
          setError('No access token received');
          setAuthState('error');
          return;
        }

        // Complete OAuth flow with proxy
        const response = await fetch(`${PROXY_URL}/api/auth/google/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            accessToken,
            refreshToken,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || 'Authentication failed');
          setAuthState('error');
          return;
        }

        setAuthState('success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAuthState('error');
      }
    };

    completeAuth();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1c1c20] px-4 font-main text-content">
      <div className="max-w-md text-center">
        {authState === 'processing' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <h1 className="type-heading-2 mb-2 font-bold text-content">
              Signing you in...
            </h1>
            <p className="text-content-muted">
              Please wait while we complete your authentication.
            </p>
          </>
        )}

        {authState === 'success' && (
          <>
            <h1 className="type-heading-2 mb-2 font-bold text-content">
              You&apos;re signed in!
            </h1>
            <p className="mb-6 text-content-muted">
              You can now close this tab and return to Rivet.
            </p>
          </>
        )}

        {authState === 'error' && (
          <>
            <h1 className="type-heading-2 mb-2 font-bold text-content">
              Authentication failed
            </h1>
            <p className="mb-4 text-content-muted">
              {error || 'Something went wrong. Please try again.'}
            </p>
            <p className="text-sm text-content-subtle">
              You can close this tab and try signing in again from Rivet.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthSuccessPage;
