import type { ReactNode } from 'react';
import GravityField from '../../components/GravityField';
import HeroCycle from '../../components/HeroCycle';
import { useScrollReveal } from '../../hooks/use-scroll-reveal';

/**
 * The About article's building blocks, implementing the Figma composition
 * (Rivet Brand Exploration, node 977:9457). Placement lives in index.css —
 * these components supply structure and the corner marks; the grid decides
 * where each block sits.
 */

/** Rivet's corner marks: four squares straddling a picture's corners. */
const Corners = () => (
  <>
    <span aria-hidden className="image-corner image-corner--tl" />
    <span aria-hidden className="image-corner image-corner--tr" />
    <span aria-hidden className="image-corner image-corner--bl" />
    <span aria-hidden className="image-corner image-corner--br" />
  </>
);

/** A run of copy in the accent, for the lines the drawing picks out. */
export const Accent = ({ children }: { children: ReactNode }) => (
  <span className="about-accent">{children}</span>
);

/**
 * The rivet mark, set where a full stop would go. It closes the sentence, so
 * it is sized and spaced like punctuation — in em, off the type it follows —
 * rather than as a picture that happens to sit nearby.
 */
export const Mark = () => (
  <img src="/images/about/quote-mark.webp" alt="." className="text-mark" draggable={false} />
);

type ImageProps = { src: string; alt: string };

/**
 * The masthead: the picture bleeding off the left edge to column 7, and the
 * lede set away from it in column 9. One row, because in the drawing they sit
 * side by side — the lede starting partway down the picture.
 *
 * The picture wears only its two right-hand marks; the left edge bleeds off
 * the page, so there is no column line there for the others.
 */
export const Masthead = ({ src, alt, children }: ImageProps & { children: ReactNode }) => {
  const reveal = useScrollReveal<HTMLDivElement>();
  return (
  <div ref={reveal.ref} style={reveal.style} className="not-prose article-row masthead">
    <div className="about-hero">
      <div className="about-hero__frame">
        <HeroCycle
          className="about-hero__img"
          src={src}
          alt={alt}
          frames={[
            '/images/about/hero-cycle-1.webp',
            '/images/about/hero-cycle-2.webp',
            '/images/about/hero-cycle-3.webp',
            '/images/about/hero-cycle-4.webp',
          ]}
        />
        <span aria-hidden className="about-hero__wash" />
      </div>
      {/* Only the two right-hand marks: this picture bleeds off the left edge,
          so there is no column line over there for a mark to sit on. */}
      <span aria-hidden className="image-corner image-corner--tr" />
      <span aria-hidden className="image-corner image-corner--br" />
      <img
        src="/images/about/blob-cluster.svg"
        alt=""
        aria-hidden
        draggable={false}
        className="about-hero__blob"
      />
    </div>
    {/* Placed in CSS, not with col-start/col-span utilities: Tailwind's
        col-span-* emits the `grid-column` shorthand, which resets the start
        line col-start-* had just set. */}
    <div className="masthead__intro">
      <p className="article-label mb-10">Intro</p>
      <div className="article-body">{children}</div>
    </div>
  </div>
  );
};

/**
 * The chapter: a display heading held in two columns beside a numbered table
 * that runs to the page's right edge.
 */
export const Chapter = ({ title, children }: { title: string; children: ReactNode }) => {
  // The heading arrives on its own and does NOT go soft on the way out: the
  // rows beside it stay sharp long after it has left the band, and a heading
  // defocusing next to crisp content reads as a bug rather than as depth.
  const reveal = useScrollReveal<HTMLHeadingElement>({ leave: false });
  return (
    <section className="not-prose article-row chapter">
      {/* One span per drawn line, rather than a newline the CSS cannot reach:
          on a phone the first two join into one and the heading sets in two
          rows instead of three. */}
      <h2 ref={reveal.ref} style={reveal.style} className="chapter__title">
        {title.split('\n').map((line) => (
          <span key={line} className="chapter__line">
            {line}
          </span>
        ))}
      </h2>
      <div className="chapter__rows">{children}</div>
    </section>
  );
};

type ToolRowProps = ImageProps & { label: string; heading: string; children: ReactNode };

/**
 * One row of the chapter table: numeral and tag, headline, copy, picture.
 * The numeral comes from a CSS counter — the document does the counting, so
 * the component takes no index.
 */
export const ToolRow = ({ label, heading, src, alt, children }: ToolRowProps) => {
  const reveal = useScrollReveal<HTMLDivElement>();
  return (
  <div ref={reveal.ref} style={reveal.style} className="tool-row">
    <div className="tool-row__marker">
      <p aria-hidden className="tool-row__num" />
      <p className="article-label">{label}</p>
    </div>
    <h3 className="tool-row__heading">{heading}</h3>
    <div className="tool-row__body">{children}</div>
    <figure className="tool-row__figure">
      <img src={src} alt={alt} loading="lazy" decoding="async" />
      <Corners />
    </figure>
  </div>
  );
};

/** The largest type on the page, with a paragraph set away from it. */
export const PullQuote = ({ children, aside }: { children: ReactNode; aside?: ReactNode }) => {
  const reveal = useScrollReveal<HTMLQuoteElement>();
  return (
    <blockquote ref={reveal.ref} style={reveal.style} className="not-prose article-row pull-quote">
      <div className="pull-quote__body">{children}</div>
      {aside && <div className="pull-quote__aside article-body">{aside}</div>}
    </blockquote>
  );
};

/**
 * Copy in the first three columns, picture from column 6 off the right edge.
 *
 * The sign-off lives in this row rather than following it, because it is set
 * against the picture: its copy ends level with the picture's bottom edge, and
 * only a shared row can hold that as the picture's height changes.
 */
export const WideFigure = ({
  src,
  alt,
  signoffTitle,
  signoff,
  children,
}: ImageProps & {
  children: ReactNode;
  signoffTitle?: string;
  signoff?: ReactNode;
}) => {
  const reveal = useScrollReveal<HTMLElement>();
  return (
  <section ref={reveal.ref} style={reveal.style} className="not-prose article-row wide-figure">
    <div className="wide-figure__text">
      <div className="article-body">{children}</div>
      {signoffTitle && (
        <div className="wide-figure__signoff">
          <h2 className="signoff__title">{signoffTitle}</h2>
          <div className="article-body">{signoff}</div>
        </div>
      )}
    </div>
    <figure className="wide-figure__media">
      <img className="wide-figure__img" src={src} alt={alt} loading="lazy" decoding="async" />
      {/* Over the picture, not under it: the cluster reads as sitting on the
          photograph, so it is painted after it rather than being clipped by
          the picture's own top edge. */}
      <img
        src="/images/about/blob-union.svg"
        alt=""
        aria-hidden
        draggable={false}
        className="wide-figure__blob"
      />
      <span aria-hidden className="image-corner image-corner--tl" />
      <span aria-hidden className="image-corner image-corner--bl" />
    </figure>
  </section>
  );
};

/**
 * The closing block: the heading and its copy stacked in column 6, with a
 * texture panel bleeding off each edge behind them.
 */
export const Closing = ({ children }: { children: ReactNode }) => {
  const reveal = useScrollReveal<HTMLDivElement>();
  return (
  <div ref={reveal.ref} style={reveal.style} className="not-prose article-row closing-row">
    {/* The same field the landing page's install section runs, on the same
        terms: edge to edge behind the block, masked so it reads only down the
        two sides and has faded out well before the heading. One texture used
        twice, rather than a second one that merely resembles it. */}
    <div aria-hidden className="closing-row__field">
      <GravityField
        cell={16}
        scale={0.044}
        style={{
          opacity: 0.55,
          WebkitMaskImage:
            'linear-gradient(to right, #000 0%, #000 6%, transparent 40%, transparent 60%, #000 94%, #000 100%)',
          maskImage:
            'linear-gradient(to right, #000 0%, #000 6%, transparent 40%, transparent 60%, #000 94%, #000 100%)',
        }}
      />
    </div>
    {children}
  </div>
  );
};
