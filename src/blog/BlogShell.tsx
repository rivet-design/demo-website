import type { CSSProperties, ReactNode } from 'react';
import Footer from '../components/Footer';
import NavBar from '../components/NavBar';
import { blogBackground } from '../lib/background';

type BlogShellProps = {
  children: ReactNode;
  /**
   * Override the page ground. Defaults to the flat tan. Kept as a
   * prop so the shell still owns the background — a page painting its own
   * layer would sit on top of this one rather than replace it.
   */
  background?: CSSProperties;
};

const BlogShell = ({ children, background }: BlogShellProps) => (
  <div
    className="page-gutter-x relative flex min-h-screen flex-col"
    style={background ?? blogBackground}
  >
    {/* The line raster that opens the page, edge to edge behind everything —
        the nav included, which is why it lives here rather than in the article.
        Its own alpha carries the pattern and thins out downward, so it needs no
        mask. */}
    <div aria-hidden className="page-texture">
      <img src="/images/about/top-raster.webp" alt="" draggable={false} />
    </div>
    {/* Transparent, not frosted: the raster behind it is a fine line pattern,
        and both halves of the frosted treatment wreck it — the blur smears the
        lines and the tint washes them out. With no layer of its own the bar
        lets the pattern run through unbroken. */}
    <NavBar frosted={false} fill={{ backgroundColor: 'transparent' }} />
    {/* Positioned, so it stacks above the texture: an unpositioned <main>
        would paint under an absolutely positioned sibling at z-index 0. */}
    <main className="relative z-10 flex-1">{children}</main>
    <Footer />
  </div>
);

export default BlogShell;
