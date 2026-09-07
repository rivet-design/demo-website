import type { CSSProperties, ReactNode } from 'react';
import Footer from '../components/Footer';
import NavBar from '../components/NavBar';
import { pageBackground } from '../lib/background';

type BlogShellProps = {
  children: ReactNode;
  /**
   * Override the page ground. Defaults to the flat site background; About
   * passes the tan fade. Kept as a prop so the shell still owns the
   * background — a page painting its own layer would sit on top of this one
   * rather than replace it.
   */
  background?: CSSProperties;
};

const BlogShell = ({ children, background }: BlogShellProps) => (
  <div
    className={`page-gutter-x relative flex min-h-screen flex-col ${
      background ? '' : pageBackground.className
    }`}
    style={background ?? pageBackground.style}
  >
    <NavBar fill={pageBackground.style} />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default BlogShell;
