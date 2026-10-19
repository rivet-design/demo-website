import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

type WaitlistSignup = {
  firstName: string;
  lastName: string;
  email: string;
  description?: string;
};

type UseEmailSignupResult = {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  submitSignup: (data: WaitlistSignup) => Promise<boolean>;
  reset: () => void;
};

const useEmailSignup = (): UseEmailSignupResult => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitSignup = async (data: WaitlistSignup): Promise<boolean> => {
    if (!supabase) {
      setError('Email signup is not configured');
      return false;
    }

    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      const [supabaseResult, clayResult] = await Promise.allSettled([
        supabase.from('email_signups').insert([
          {
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            description: data.description || null,
          },
        ]),
        fetch(import.meta.env.VITE_CLAY_PROXY_URL || '/api/clay-webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            description: data.description || null,
          }),
        }),
      ]);

      let hasError = false;
      const errors: string[] = [];

      if (supabaseResult.status === 'fulfilled') {
        const { error: insertError } = supabaseResult.value;
        if (insertError) {
          hasError = true;
          if (insertError.code === '23505') {
            errors.push('This email is already subscribed');
          } else {
            errors.push('Failed to save to database');
          }
        }
      } else {
        hasError = true;
        errors.push('Failed to save to database');
        console.error('Supabase error:', supabaseResult.reason);
      }

      if (clayResult.status === 'rejected') {
        console.error('Clay webhook error:', clayResult.reason);
      } else if (clayResult.status === 'fulfilled' && !clayResult.value.ok) {
        console.error(
          'Clay webhook failed:',
          clayResult.value.status,
          clayResult.value.statusText,
        );
      }

      if (hasError) {
        setError(errors.join('. '));
        return false;
      }

      setIsSuccess(true);
      return true;
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error subscribing to email', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setIsSuccess(false);
    setError(null);
  };

  return { isSubmitting, isSuccess, error, submitSignup, reset };
};

export default useEmailSignup;
