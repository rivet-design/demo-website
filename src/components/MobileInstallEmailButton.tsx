// Phone-only stand-in for the install CTAs. Installing Rivet means pasting an
// `npx` command into a coding agent on a computer, which a phone can't do, so
// this captures the visitor's email instead and they install later from their
// computer. Signups land in the same `email_signups` table as the waitlist,
// tagged via `description` so they can be told apart.
import { useState } from 'react';
import { AlertCircle, Mail } from 'lucide-react';
import useEmailSignup from '@/hooks/useEmailSignup';
import { telemetry, type MobileInstallPlacement } from '@/lib/telemetry';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export const MOBILE_INSTALL_REQUEST_TAG = 'mobile_install_request';

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
  const [validationError, setValidationError] = useState<string | null>(null);
  const { isSubmitting, isSuccess, error, submitSignup, reset } =
    useEmailSignup();

  const handleOpenChange = (next: boolean) => {
    if (next) {
      telemetry.trackMobileInstallEmailOpened({ placement });
    } else if (isSuccess) {
      setEmail('');
      reset();
    }
    setValidationError(null);
    setOpen(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    setValidationError(null);
    const success = await submitSignup(
      { email: trimmed, description: MOBILE_INSTALL_REQUEST_TAG },
      { forwardToClay: false, allowExisting: true },
    );
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
      <DialogContent className="rounded-lg border-[#642e39]/20 text-[#642e39]">
        <DialogHeader>
          <DialogTitle className="type-heading-2 pr-6 font-main font-normal">
            {isSuccess
              ? "You're on the list"
              : 'Install Rivet on your computer'}
          </DialogTitle>
          <DialogDescription className="font-main text-[#642e39]/80">
            {isSuccess
              ? "We'll email you the install link. Open it on your computer to add Rivet to Codex, Claude, or Cursor."
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
              type="email"
              inputMode="email"
              autoComplete="email"
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
              <p className="type-caption flex items-start gap-2 text-red-600">
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
