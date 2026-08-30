import { useEffect } from 'react';
import { MDXProvider } from '@mdx-js/react';
import BlogShell from './BlogShell';
import { mdxComponents } from './mdx-components';
import { getBlogPost } from './posts';

const aboutPost = getBlogPost('story-of-rivet');

if (!aboutPost) {
  throw new Error('The About page requires the "story-of-rivet" MDX post.');
}

const AboutPage = () => {
  const { Content, meta } = aboutPost;

  useEffect(() => {
    document.title = 'About — Rivet';

    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (description) description.content = meta.description;
  }, [meta.description]);

  return (
    <BlogShell>
      <article className="mx-auto w-full max-w-6xl px-4 pb-28 pt-16 sm:px-8 sm:pt-24">
        <header className="mx-auto max-w-[64rem]">
          <h1 className="font-main text-4xl font-normal leading-[1.08] tracking-[-0.035em] text-black sm:text-5xl xl:whitespace-nowrap">
            {meta.title}
          </h1>
        </header>

        <div className="prose prose-lg prose-neutral mx-auto mt-10 max-w-[42rem] font-main text-black prose-headings:scroll-mt-24 prose-headings:font-main prose-headings:font-normal prose-headings:leading-tight prose-headings:tracking-[-0.025em] prose-headings:text-black prose-p:leading-[1.45] prose-p:text-black prose-a:text-primary prose-a:decoration-primary/35 prose-a:underline-offset-4 hover:prose-a:decoration-primary prose-blockquote:border-primary prose-blockquote:font-normal prose-blockquote:text-black prose-figcaption:text-black prose-strong:text-black prose-code:text-black prose-li:leading-[1.45] prose-li:text-black prose-th:text-black prose-td:text-black sm:mt-12">
          <MDXProvider components={mdxComponents}>
            <Content />
          </MDXProvider>
        </div>
      </article>
    </BlogShell>
  );
};

export default AboutPage;
