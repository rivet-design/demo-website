import { useEffect, useState } from 'react';
import { telemetry } from '../lib/telemetry';

const PROXY_URL = 'https://rivet-proxy.onrender.com';

type AuthState = 'processing' | 'success' | 'error';

/**
 * OAuth callback page for Rivet authentication (used by both the MCP and
 * desktop login flows, which have no local UI server to catch the callback)
 * Extracts tokens from URL hash and completes the OAuth flow
 */
const AuthSuccessPage = () => {
  const [authState, setAuthState] = useState<AuthState>('processing');
  const [error, setError] = useState<string | null>(null);

  /**
   * @effect Extract tokens from URL hash and complete OAuth flow
   * @deps None - runs once on mount
   */
  useEffect(() => {
    const completeAuth = async () => {
      try {
        // Get session ID from query params
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');

        // Extract tokens from URL hash (Supabase implicit flow)
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        // Drop the token fragment immediately so it never reaches browser
        // history, session replay, or later analytics captures.
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search,
        );

        if (!sessionId) {
          // Tokens-without-session is the Supabase Site URL fallback: the
          // requested redirect_to was not allowlisted, so the query was
          // dropped while the token fragment survived.
          telemetry.trackLandingAuthFailed({
            reason: 'missing_session',
            hadAccessToken: Boolean(accessToken),
          });
          setError('Missing session ID');
          setAuthState('error');
          return;
        }

        if (!accessToken) {
          telemetry.trackLandingAuthFailed({
            reason: 'missing_token',
            hadAccessToken: false,
          });
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
          telemetry.trackLandingAuthFailed({
            reason: 'proxy_rejected',
            hadAccessToken: true,
          });
          setError(result.error || 'Authentication failed');
          setAuthState('error');
          return;
        }

        telemetry.trackLandingAuthCompleted();
        setAuthState('success');
      } catch (err) {
        telemetry.trackLandingAuthFailed({
          reason: 'exception',
          hadAccessToken: false,
        });
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
