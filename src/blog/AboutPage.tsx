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
      <article className="mx-auto w-full max-w-4xl px-4 pb-28 pt-16 sm:px-8 sm:pt-24">
        <header className="mx-auto max-w-3xl">
          <h1 className="font-main text-5xl font-normal leading-[1.04] tracking-[-0.04em] text-black sm:text-7xl">
            {meta.title}
          </h1>
          <p className="mt-6 max-w-2xl font-main text-xl leading-relaxed text-black/60">
            {meta.description}
          </p>
        </header>

        <div className="prose prose-lg prose-neutral mx-auto mt-12 max-w-3xl font-main prose-headings:scroll-mt-24 prose-headings:font-main prose-headings:font-normal prose-headings:tracking-[-0.025em] prose-p:leading-[1.75] prose-a:text-primary prose-a:decoration-primary/35 prose-a:underline-offset-4 hover:prose-a:decoration-primary prose-blockquote:border-primary prose-blockquote:font-normal prose-img:rounded-2xl sm:mt-16">
          <MDXProvider components={mdxComponents}>
            <Content />
          </MDXProvider>
        </div>
      </article>
    </BlogShell>
  );
};

export default AboutPage;
