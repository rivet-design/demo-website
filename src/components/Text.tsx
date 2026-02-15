import { ReactNode } from 'react';
import { Copy, Check } from 'lucide-react';
import useClipboard from '../hooks/useClipboard';

type TextProps = {
  children: ReactNode;
  className?: string;
};

type CodeProps = TextProps & {
  copyable?: boolean;
};

export const Heading1 = ({ children, className = '' }: TextProps) => {
  return (
    <h1 className={`type-heading-1 text-content ${className}`}>{children}</h1>
  );
};

export const Heading2 = ({ children, className = '' }: TextProps) => {
  return (
    <h2 className={`type-heading-2 text-content ${className}`}>{children}</h2>
  );
};

export const Heading3 = ({ children, className = '' }: TextProps) => {
  return (
    <h3 className={`type-heading-3 text-content ${className}`}>{children}</h3>
  );
};

export const Body = ({ children, className = '' }: TextProps) => {
  return (
    <p className={`type-body text-content-muted ${className}`}>{children}</p>
  );
};

export const BodyLarge = ({ children, className = '' }: TextProps) => {
  return (
    <p className={`type-subtitle text-content-muted ${className}`}>
      {children}
    </p>
  );
};

export const Caption = ({ children, className = '' }: TextProps) => {
  return (
    <span className={`type-caption text-content-subtle ${className}`}>
      {children}
    </span>
  );
};

export const Code = ({
  children,
  className = '',
  copyable = false,
}: CodeProps) => {
  const { isCopied, copyToClipboard } = useClipboard();

  const handleCopy = async () => {
    if (typeof children === 'string') {
      try {
        await copyToClipboard(children);
      } catch (err) {
        console.error('Error copying to clipboard', err);
      }
    }
  };

  if (!copyable) {
    return (
      <code
        className={`type-code rounded bg-main-input px-2 py-1 text-content ${className}`}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <code
        className={`type-code flex w-full justify-between rounded bg-main-input px-2 py-1 text-content ${className}`}
      >
        {children}
        <button
          onClick={handleCopy}
          className="rounded px-2 py-1 text-xs text-content-muted transition-colors hover:bg-main-input hover:text-content"
          title="Copy to clipboard"
        >
          {isCopied ? <Check size={12} color="green" /> : <Copy size={12} />}
        </button>
      </code>
    </div>
  );
};
