import { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import useEmailSignup from '../hooks/useEmailSignup';
import { posthog } from '@/lib/posthog';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Tag stored on the signup so a later send (Resend) can target just these
// mobile captures with the MCP setup instructions.
const SOURCE_TAG = 'mobile-mcp-instructions';

/**
 * Mobile-only hero CTA. Installing the Rivet MCP is a desktop action, so on
 * phones we capture an email instead and (in a later PR) send setup
 * instructions the user can follow back on desktop. Collect-only for now —
 * the signup is stored + tagged; no email is sent yet.
 */
const MobileEmailCta = () => {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { isSubmitting, isSuccess, error, submitSignup } = useEmailSignup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email.trim())) {
      setValidationError('Please enter a valid email address');
      return;
    }
    setValidationError(null);
    const ok = await submitSignup({
      email: email.trim(),
      description: SOURCE_TAG,
    });
    if (ok) {
      posthog.capture('mobile_email_cta_submitted', { source: 'landing-hero' });
    }
  };

  if (isSuccess) {
    return (
      <div className="flex w-full max-w-sm items-center justify-center gap-2 rounded-lg border border-green/20 bg-green/5 px-4 py-3 text-green">
        <Check className="h-5 w-5 shrink-0" />
        <span className="font-main text-[15px]">
          Thanks — we’ll email you setup instructions.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-2">
      <div className="flex w-full gap-2">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (validationError) setValidationError(null);
          }}
          placeholder="you@email.com"
          disabled={isSubmitting}
          aria-label="Email address"
          className="min-w-0 flex-1 rounded-lg border border-black/15 bg-white px-4 py-3 text-left font-main text-[15px] text-black placeholder-black/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-80"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="shrink-0 rounded-lg bg-primary px-5 py-3 font-main text-[15px] text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-80"
        >
          {isSubmitting ? 'Sending…' : 'Email me'}
        </button>
      </div>
      <p className="font-main text-[13px] leading-snug text-black/55">
        Installing the MCP is a desktop step — we’ll send instructions to your
        inbox.
      </p>
      {validationError ? (
        <p className="font-main text-[13px] text-red-500">{validationError}</p>
      ) : null}
      {error ? (
        <p className="flex items-center gap-1.5 font-main text-[13px] text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </form>
  );
};

export default MobileEmailCta;
