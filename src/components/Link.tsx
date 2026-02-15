import { ReactNode } from 'react';

type LinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
};

const Link = ({ href, children, className = '', external = false }: LinkProps) => {
  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <a
      href={href}
      className={`text-primary hover:text-primary-hover underline transition-colors ${className}`}
      {...externalProps}
    >
      {children}
    </a>
  );
};

export default Link;