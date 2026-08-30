import type { ReactNode } from 'react';

type CalloutProps = {
  children: ReactNode;
  title?: string;
  tone?: 'note' | 'warning' | 'success';
};

const calloutTone = {
  note: 'border-primary/30 bg-primary/[0.06]',
  warning: 'border-yellow-border/40 bg-yellow/15',
  success: 'border-green-border/40 bg-green/[0.06]',
};

export const Callout = ({ children, title, tone = 'note' }: CalloutProps) => (
  <aside
    className={`not-prose my-10 rounded-2xl border p-6 font-main text-black ${calloutTone[tone]}`}
  >
    {title && (
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide">
        {title}
      </p>
    )}
    <div className="text-base leading-relaxed text-black">{children}</div>
  </aside>
);

type FigureProps = {
  src: string;
  alt: string;
  caption?: string;
};

export const Figure = ({ src, alt, caption }: FigureProps) => (
  <figure className="not-prose my-12">
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="w-full rounded-2xl border border-black/10 object-cover"
    />
    {caption && (
      <figcaption className="mt-3 font-main text-sm leading-relaxed text-black">
        {caption}
      </figcaption>
    )}
  </figure>
);

export const ImageGrid = ({ children }: { children: ReactNode }) => (
  <div className="not-prose my-12 grid items-start gap-4 sm:grid-cols-2 [&>figure]:my-0">
    {children}
  </div>
);

export const PullQuote = ({ children }: { children: ReactNode }) => (
  <blockquote className="not-prose my-12 border-l-4 border-primary pl-6 font-main text-2xl font-medium leading-snug tracking-[-0.01em] text-black sm:text-3xl">
    {children}
  </blockquote>
);

export const Steps = ({ children }: { children: ReactNode }) => (
  <div className="not-prose my-10 rounded-2xl border border-black/10 bg-black/[0.025] p-6 font-main [&>ol]:m-0 [&>ol]:space-y-4 [&>ol]:pl-6">
    {children}
  </div>
);
