import { useState, useCallback } from 'react';

type UseClipboardReturn = {
  isCopied: boolean;
  copyToClipboard: (text: string) => Promise<void>;
};

const useClipboard = (resetDelay = 2000): UseClipboardReturn => {
  const [isCopied, setIsCopied] = useState(false);

  const fallbackCopy = (text: string): boolean => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  };

  const copyToClipboard = useCallback(
    async (text: string): Promise<void> => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          setIsCopied(true);
        } else {
          const success = fallbackCopy(text);
          if (success) {
            setIsCopied(true);
          } else {
            throw new Error('Fallback copy failed');
          }
        }
      } catch (err) {
        console.warn('Failed to copy text to clipboard:', err);
        throw err;
      }

      setTimeout(() => setIsCopied(false), resetDelay);
    },
    [resetDelay],
  );

  return { isCopied, copyToClipboard };
};

export default useClipboard;
