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
    <div className="text-base leading-[1.45] text-black">{children}</div>
  </aside>
);

type ArticleImageProps = {
  src: string;
  alt: string;
  caption?: string;
};

type ArticleImageFormat = 'rectangle' | 'square';

const imageFrameClass: Record<ArticleImageFormat, string> = {
  rectangle: 'max-w-[38rem]',
  square: 'max-w-[28rem]',
};

const imageAspectClass: Record<ArticleImageFormat, string> = {
  rectangle: 'aspect-[3/2]',
  square: 'aspect-square',
};

const ImageFrame = ({
  src,
  alt,
  format,
}: ArticleImageProps & { format: ArticleImageFormat }) => (
  <div
    className={`w-full overflow-hidden rounded-xl border border-black/10 ${imageAspectClass[format]}`}
  >
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover"
    />
  </div>
);

const ImageCaption = ({ children }: { children: ReactNode }) => (
  <figcaption className="mt-3 font-main text-sm leading-[1.4] text-black/55">
    {children}
  </figcaption>
);

const ArticleImage = ({
  src,
  alt,
  caption,
  format,
}: ArticleImageProps & { format: ArticleImageFormat }) => (
  <figure
    className={`not-prose mx-auto my-10 w-full ${imageFrameClass[format]}`}
  >
    <ImageFrame src={src} alt={alt} format={format} />
    {caption && <ImageCaption>{caption}</ImageCaption>}
  </figure>
);

export const RectangleImage = (props: ArticleImageProps) => (
  <ArticleImage {...props} format="rectangle" />
);

export const SquareImage = (props: ArticleImageProps) => (
  <ArticleImage {...props} format="square" />
);

export const ImageGrid = ({ children }: { children: ReactNode }) => (
  <div className="not-prose mx-auto my-10 grid max-w-[42rem] items-start gap-4 sm:grid-cols-2 [&>figure]:my-0">
    {children}
  </div>
);

type SplitImageTextProps = ArticleImageProps & {
  children: ReactNode;
  format?: ArticleImageFormat;
};

export const SplitImageText = ({
  src,
  alt,
  caption,
  children,
  format = 'rectangle',
}: SplitImageTextProps) => (
  <section className="not-prose mx-auto my-10 grid w-full gap-6 text-left md:grid-cols-2 md:items-center md:gap-8 xl:w-[54rem]">
    <figure className="m-0">
      <ImageFrame src={src} alt={alt} format={format} />
      {caption && <ImageCaption>{caption}</ImageCaption>}
    </figure>
    <div className="font-main text-lg leading-[1.45] text-black [&>p+p]:mt-4 [&>p]:m-0">
      {children}
    </div>
  </section>
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
