import { useEffect } from 'react';
import { useScrollReveal } from '../hooks/use-scroll-reveal';
import { MDXProvider } from '@mdx-js/react';
import BlogShell from './BlogShell';
import GridOverlay from '../components/GridOverlay';
import SquareField from '../components/SquareField';
import TitleShapes from '../components/TitleShapes';
import { mdxComponents } from './mdx-components';
import { getBlogPost } from './posts';

const aboutPost = getBlogPost('story-of-rivet');

/**
 * The display title breaks before this word. Where a headline turns is a
 * design decision, so it is made here rather than smuggled into the post's
 * metadata as a newline — and if the word ever leaves the title, the heading
 * simply wraps on its own again.
 */
const TITLE_BREAK_BEFORE = 'infinitely';

const titleLines = (title: string): string[] => {
  const at = title.indexOf(TITLE_BREAK_BEFORE);
  return at > 0 ? [title.slice(0, at).trim(), title.slice(at)] : [title];
};

if (!aboutPost) {
  throw new Error('The About page requires the "story-of-rivet" MDX post.');
}

const AboutPage = () => {
  const { Content, meta } = aboutPost;
  // The masthead title is the page's first block, so it carries the entrance
  // but not the leaving blur — the picture under it is still sharp long after
  // the title has left the band.
  const titleReveal = useScrollReveal<HTMLElement>({ once: true, leave: false });

  useEffect(() => {
    document.title = 'About — Rivet';

    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (description) description.content = meta.description;
  }, [meta.description]);

  return (
    <BlogShell>
      {/* No max-width and no padding of its own: the article IS the frame's
          content box, so its 12 columns are the page's 12 columns. Everything
          inside is placed on them. */}
      {/* The grid frame. It breaks out of the shell's page gutter and re-insets
          to the nav's own margin, so the 12 columns span nearly the full
          viewport while the nav and footer keep the site's normal gutter —
          the grid is this page's, not the site's. Tagged data-page-frame:
          GridOverlay and SquareField measure THIS element's padding box
          rather than re-deriving it from --frame-inset-x, since that var is a
          vw-based clamp and vw counts the scrollbar the padding box does
          not. */}
        <article
          data-page-frame
          // No w-full: an explicit width:100% resolves against <main>'s content
          // box, and the negative bleed margins then only SHIFT the box
          // instead of widening it. Left at auto, the block grid fills its
          // containing block plus the negative margins — the full viewport.
          className="bleed-page-gutter-x page-grid relative z-10 px-[var(--frame-inset-x)] pb-14 pt-[clamp(2rem,11vh,9rem)]"
        >
        <TitleShapes />
        <SquareField />
        {/* Columns 1–8, off the page's own left margin. 103px on the
            drawing's 1728 frame — 5.95vw, clamped — with its 0.81 leading and
            -0.06em tracking, so the two lines read as one block. */}
        <header
          ref={titleReveal.ref}
          style={titleReveal.style}
          className="relative z-10 col-span-12 text-left md:col-span-8"
        >
          <h1 className="font-main text-[clamp(2.75rem,5.95vw,7rem)] font-normal leading-[0.9] tracking-[-0.045em] text-black">
            {titleLines(meta.title).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
        </header>

        {/* The flow spans all 12 columns and each block places itself. No
            prose classes: this composition sets its own type at the drawing's
            sizes, and prose's 65ch cap is a measure rather than a grid
            position — it would leave every column's right edge short of the
            line it should land on. */}
        <div className="article-flow col-span-12 mt-4 text-left font-main sm:mt-6 text-black prose-headings:scroll-mt-24 prose-headings:font-main prose-headings:font-normal prose-headings:leading-tight prose-headings:tracking-[-0.025em] prose-headings:text-black prose-p:leading-[1.45] prose-p:text-black prose-a:text-primary prose-a:decoration-primary/35 prose-a:underline-offset-4 hover:prose-a:decoration-primary prose-blockquote:border-primary prose-blockquote:font-normal prose-blockquote:text-black prose-figcaption:text-black/55 prose-strong:text-black prose-code:text-black prose-li:leading-[1.45] prose-li:text-black prose-th:text-black prose-td:text-black sm:mt-12">
          <MDXProvider components={mdxComponents}>
            <Content />
          </MDXProvider>
        </div>
      </article>
      <GridOverlay />
    </BlogShell>
  );
};

export default AboutPage;
