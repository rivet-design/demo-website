import { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import useEmailSignup from '../hooks/useEmailSignup';
import { Button } from './ui/button';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EmailSignupFormProps = {
  onSuccessChange?: (isSuccess: boolean) => void;
};

const EmailSignupForm = ({ onSuccessChange }: EmailSignupFormProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { isSubmitting, isSuccess, error, submitSignup } = useEmailSignup();

  const validateForm = useCallback((): boolean => {
    if (!firstName.trim()) {
      setValidationError('First name is required');
      return false;
    }
    if (!lastName.trim()) {
      setValidationError('Last name is required');
      return false;
    }
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    if (!EMAIL_REGEX.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    setValidationError(null);
    return true;
  }, [firstName, lastName, email]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      const success = await submitSignup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        description: description.trim() || undefined,
      });

      if (success) {
        onSuccessChange?.(true);
      }
    },
    [
      firstName,
      lastName,
      email,
      description,
      submitSignup,
      validateForm,
      onSuccessChange,
    ],
  );

  return (
    <div className="w-full">
      <div className="flex flex-col py-6">
        {isSuccess ? (
          <div className="flex items-center gap-3 rounded-lg">
            <Button
              variant="secondaryOutline"
              className="w-full"
              onClick={() => {
                window.open(
                  'https://cal.com/samjgorman/talk-about-rivet',
                  '_blank',
                );
              }}
            >
              Book a demo
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (validationError) {
                    setValidationError(null);
                  }
                }}
                placeholder="First name"
                className="min-w-0 flex-1 rounded-lg border border-gray-600 bg-green px-3 py-2 text-left font-main text-white placeholder-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (validationError) {
                    setValidationError(null);
                  }
                }}
                placeholder="Last name"
                className="min-w-0 flex-1 rounded-lg border border-gray-600 bg-green px-3 py-2 text-left font-main text-white placeholder-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationError) {
                  setValidationError(null);
                }
              }}
              placeholder="Email"
              className="w-full rounded-lg border border-gray-600 bg-green px-3 py-2 text-left font-main text-white placeholder-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isSubmitting}
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why do you want to use Rivet? (optional, but helps us prioritize)"
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-600 bg-green px-3 py-2 text-left font-main text-white placeholder-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isSubmitting}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="type-label w-full rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-90"
            >
              {isSubmitting ? 'Signing up...' : 'Join waitlist'}
            </button>
          </form>
        )}
        {validationError ? (
          <p className="type-caption mt-1.5 text-red-400">{validationError}</p>
        ) : null}
        {error ? (
          <div className="type-caption mt-1.5 flex items-start gap-2 text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EmailSignupForm;
