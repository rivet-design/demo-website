import type { ReactNode } from 'react';
import Footer from '../components/Footer';
import NavBar from '../components/NavBar';
import { pageBackground } from '../lib/background';

type BlogShellProps = {
  children: ReactNode;
};

const BlogShell = ({ children }: BlogShellProps) => (
  <div
    className={`page-gutter-x relative flex min-h-screen flex-col ${pageBackground.className}`}
    style={pageBackground.style}
  >
    <NavBar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default BlogShell;
