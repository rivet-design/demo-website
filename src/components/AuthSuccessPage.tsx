import { useEffect, useState } from 'react';

const PROXY_URL = 'https://rivet-proxy.onrender.com';

type AuthState = 'processing' | 'success' | 'error';

/**
 * OAuth callback page for desktop app authentication
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FEFFF3] px-4">
      <div className="max-w-md text-center">
        {authState === 'processing' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <h1 className="type-heading-2 mb-2 font-bold text-gray-900">
              Signing you in...
            </h1>
            <p className="text-gray-600">
              Please wait while we complete your authentication.
            </p>
          </>
        )}

        {authState === 'success' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="type-heading-2 mb-2 font-bold text-gray-900">
              You&apos;re signed in!
            </h1>
            <p className="mb-6 text-gray-600">
              You can now close this tab and return to the Rivet desktop app.
            </p>
          </>
        )}

        {authState === 'error' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <h1 className="type-heading-2 mb-2 font-bold text-gray-900">
              Authentication failed
            </h1>
            <p className="mb-4 text-gray-600">
              {error || 'Something went wrong. Please try again.'}
            </p>
            <p className="text-sm text-gray-500">
              You can close this tab and try signing in again from the Rivet
              app.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthSuccessPage;
