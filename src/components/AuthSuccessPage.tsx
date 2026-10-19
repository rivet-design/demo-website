import { useEffect, useState } from 'react';
import {
  telemetry,
  PKCE_ERROR_REASONS,
  type AuthFlow,
  type PkceErrorReason,
  type SignInFailureReason,
} from '../lib/telemetry';
import { parseInstallRef } from '../lib/installRef';

const PROXY_URL = 'https://rivet-proxy.onrender.com';

type AuthState = 'processing' | 'success' | 'error';

type AuthOutcome =
  | { kind: 'success'; flow: AuthFlow }
  | {
      kind: 'error';
      flow: AuthFlow;
      reason: SignInFailureReason;
      message: string;
    };

/** Friendly copy for the PKCE callback's ?reason= codes (see proxy auth.ts). */
const PKCE_ERROR_MESSAGES: Record<PkceErrorReason, string> = {
  session_expired:
    'This sign-in link expired. Start the sign-in again from your editor or terminal.',
  provider_denied: 'Google did not complete the sign-in. Please try again.',
  exchange_failed:
    'The sign-in could not be completed (the link may have been used already). Please try again.',
  verification_failed: 'The sign-in could not be verified. Please try again.',
  session_invalid: 'This sign-in link is invalid. Please start again.',
  internal: 'Something went wrong on our side. Please try again.',
};

const parsePkceErrorReason = (raw: string | null): PkceErrorReason | null =>
  PKCE_ERROR_REASONS.find((reason) => reason === raw) ?? null;

const resolveAuth = async (): Promise<AuthOutcome> => {
  const urlParams = new URLSearchParams(window.location.search);

  // PKCE flow: the proxy already finished the login; just render it.
  const pkceOutcome = urlParams.get('login');
  if (pkceOutcome === 'complete') return { kind: 'success', flow: 'pkce' };
  if (pkceOutcome === 'error') {
    const reason = parsePkceErrorReason(urlParams.get('reason'));
    return {
      kind: 'error',
      flow: 'pkce',
      reason: reason ?? 'unknown',
      message: reason
        ? PKCE_ERROR_MESSAGES[reason]
        : 'Something went wrong. Please try again.',
    };
  }

  // Legacy implicit flow: relay hash tokens to the proxy.
  const sessionId = urlParams.get('session');
  if (!sessionId) {
    return {
      kind: 'error',
      flow: 'implicit',
      reason: 'missing_session',
      message: 'Missing session ID',
    };
  }

  // Extract tokens from URL hash (Supabase implicit flow)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  if (!accessToken) {
    return {
      kind: 'error',
      flow: 'implicit',
      reason: 'missing_token',
      message: 'No access token received',
    };
  }

  try {
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
      return {
        kind: 'error',
        flow: 'implicit',
        reason: 'proxy_rejected',
        message: result.error || 'Authentication failed',
      };
    }

    return { kind: 'success', flow: 'implicit' };
  } catch (err) {
    return {
      kind: 'error',
      flow: 'implicit',
      reason: 'request_failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
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
    const installRef = parseInstallRef(
      new URLSearchParams(window.location.search).get('ref'),
    );
    resolveAuth().then((outcome) => {
      switch (outcome.kind) {
        case 'success':
          telemetry.trackEditorSignInCompleted({
            flow: outcome.flow,
            installRef,
          });
          setAuthState('success');
          return;
        case 'error':
          telemetry.trackEditorSignInFailed({
            flow: outcome.flow,
            reason: outcome.reason,
            installRef,
          });
          setError(outcome.message);
          setAuthState('error');
          return;
        default: {
          const unhandled: never = outcome;
          throw new Error(
            `Unhandled auth outcome: ${JSON.stringify(unhandled)}`,
          );
        }
      }
    });
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
