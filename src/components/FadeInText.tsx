import { ReactNode } from 'react';

type FadeInTextProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
};

const FadeInText = ({
  children,
  className = '',
}: FadeInTextProps) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default FadeInText;
