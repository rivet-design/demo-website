// Phone-only stand-in for the install CTAs. Installing Rivet means pasting an
// `npx` command into a coding agent on a computer, which a phone can't do, so
// this emails a link to the install page they can open later on their computer.
import { useState } from 'react';
import { AlertCircle, Mail } from 'lucide-react';
import { telemetry, type MobileInstallPlacement } from '@/lib/telemetry';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ORANGE_PILL =
  'flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-primary/20 bg-[linear-gradient(137.74deg,rgb(236,68,35)_41.128%,rgb(243,138,118)_121.74%)] px-5 py-[10px] font-aileron text-base leading-[1.164] tracking-[-0.16px] text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-70';

type MobileInstallEmailButtonProps = {
  placement: MobileInstallPlacement;
  className?: string;
};

const MobileInstallEmailButton = ({
  placement,
  className = '',
}: MobileInstallEmailButtonProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      telemetry.trackMobileInstallEmailOpened({ placement });
    } else if (isSuccess) {
      setEmail('');
      setIsSuccess(false);
    }
    setValidationError(null);
    setError(null);
    setOpen(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const trimmed = email.trim();
    if (trimmed.length > 254 || !EMAIL_REGEX.test(trimmed)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    setValidationError(null);
    setError(null);
    setIsSubmitting(true);
    let success = false;
    try {
      const response = await fetch('/api/install-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, placement, website }),
        signal: AbortSignal.timeout(30_000),
      });
      const result = await response.json();
      success = response.ok && result.ok === true;
    } catch {
      success = false;
    } finally {
      setIsSubmitting(false);
    }
    if (success) {
      setSubmittedEmail(trimmed);
      setIsSuccess(true);
    } else {
      setError("We couldn't send that just now. Try again in a minute.");
    }
    telemetry.trackMobileInstallEmailSubmitted({ placement, success });
  };

  const message = validationError ?? error;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* The hero row clips at its container's padding on narrow phones,
          so the icon and some padding give way first. */}
      <DialogTrigger className={`${ORANGE_PILL} max-[359px]:px-3 ${className}`}>
        <Mail className="h-4 w-4 shrink-0 max-[369px]:hidden" aria-hidden />
        Email me the link
      </DialogTrigger>
      <DialogContent className="ph-no-capture ph-mask rounded-lg border-[#642e39]/20 text-[#642e39]">
        <DialogHeader>
          <DialogTitle className="type-heading-2 pr-6 font-main font-normal">
            {isSuccess ? 'Check your inbox' : 'Install Rivet on your computer'}
          </DialogTitle>
          <DialogDescription className="font-main text-[#642e39]/80">
            {isSuccess
              ? `Check your inbox. We sent the install link to ${submittedEmail}. Open it on your computer to add Rivet to Claude, Codex, or Cursor.`
              : 'Rivet installs into the coding agent on your computer. Leave your email and we’ll send you the install link for later.'}
          </DialogDescription>
        </DialogHeader>
        {!isSuccess && (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-2 flex flex-col gap-3"
          >
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              hidden
              aria-hidden="true"
              tabIndex={-1}
              autoComplete="off"
            />
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={254}
              aria-label="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="you@example.com"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[#642e39]/30 bg-white px-3 py-2.5 font-main text-base text-[#642e39] placeholder-[#642e39]/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className={ORANGE_PILL}
            >
              {isSubmitting ? 'Sending…' : 'Send link'}
            </button>
            {message ? (
              <p
                role="alert"
                className="type-caption flex items-start gap-2 text-red-600"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{message}</span>
              </p>
            ) : null}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MobileInstallEmailButton;
