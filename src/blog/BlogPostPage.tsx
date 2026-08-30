import { useEffect } from 'react';
import { MDXProvider } from '@mdx-js/react';
import BlogShell from './BlogShell';
import { formatPostDate, getBlogPost } from './posts';
import { mdxComponents } from './mdx-components';

const BlogPostPage = () => {
  const slug = decodeURIComponent(
    window.location.pathname.replace(/^\/blog\//, ''),
  );
  const post = getBlogPost(slug);

  useEffect(() => {
    document.title = post
      ? `${post.meta.title} — Rivet`
      : 'Post not found — Rivet';

    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (description && post) description.content = post.meta.description;
  }, [post]);

  if (!post) {
    return (
      <BlogShell>
        <div className="mx-auto max-w-3xl px-4 py-28 text-center font-main">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            404
          </p>
          <h1 className="mt-4 text-5xl font-normal tracking-tight">
            Post not found
          </h1>
          <a
            href="/blog"
            className="mt-8 inline-block text-lg underline underline-offset-4"
          >
            Back to the blog
          </a>
        </div>
      </BlogShell>
    );
  }

  const { Content, meta } = post;

  return (
    <BlogShell>
      <article className="mx-auto w-full max-w-4xl px-4 pb-28 pt-16 sm:px-8 sm:pt-24">
        <header className="mx-auto max-w-3xl border-b border-black/15 pb-12 sm:pb-16">
          <a
            href="/blog"
            className="font-main text-sm font-medium text-black/50 transition-colors hover:text-primary"
          >
            ← Blog
          </a>
          <h1 className="mt-8 font-main text-5xl font-normal leading-[1.04] tracking-[-0.04em] text-black sm:text-7xl">
            {meta.title}
          </h1>
          <p className="mt-6 max-w-2xl font-main text-xl leading-relaxed text-black/60">
            {meta.description}
          </p>
          <div className="mt-8 flex items-center gap-3 font-main text-sm text-black/50">
            <span>{meta.author}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={meta.publishedAt}>
              {formatPostDate(meta.publishedAt)}
            </time>
          </div>
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

export default BlogPostPage;
