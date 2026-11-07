import { useState, useCallback, useEffect, useRef } from 'react';

type UseClipboardReturn = {
  isCopied: boolean;
  copyToClipboard: (text: string) => Promise<void>;
};

const useClipboard = (resetDelay = 2000): UseClipboardReturn => {
  const [isCopied, setIsCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  const fallbackCopy = (text: string): boolean => {
    const previousFocus = document.activeElement;
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    try {
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      textArea.remove();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    }
  };

  const copyToClipboard = useCallback(
    async (text: string): Promise<void> => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const success = fallbackCopy(text);
          if (!success) throw new Error('Fallback copy failed');
        }
      } catch (err) {
        console.warn('Failed to copy text to clipboard:', err);
        throw err;
      }

      if (!isMountedRef.current) return;
      if (resetTimerRef.current !== null) clearTimeout(resetTimerRef.current);
      setIsCopied(true);
      resetTimerRef.current = setTimeout(() => {
        resetTimerRef.current = null;
        if (isMountedRef.current) setIsCopied(false);
      }, resetDelay);
    },
    [resetDelay],
  );

  return { isCopied, copyToClipboard };
};

export default useClipboard;
