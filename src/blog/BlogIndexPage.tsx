import { useEffect } from 'react';
import BlogShell from './BlogShell';
import { blogPosts, formatPostDate } from './posts';

const BlogIndexPage = () => {
  useEffect(() => {
    document.title = 'Blog — Rivet';
  }, []);

  return (
    <BlogShell>
      <section className="mx-auto w-full max-w-5xl px-4 pb-28 pt-20 sm:px-8 sm:pt-28">
        <p className="font-main text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Stories from Rivet
        </p>
        <h1 className="mt-4 max-w-3xl font-main text-5xl font-normal leading-[1.02] tracking-[-0.04em] text-black sm:text-7xl">
          Ideas about design, tools, and creative direction.
        </h1>

        <div className="mt-20 border-t border-black/15">
          {blogPosts.map(({ meta }) => (
            <article key={meta.slug} className="border-b border-black/15 py-10">
              <a
                href={`/blog/${meta.slug}`}
                className="group block sm:grid sm:grid-cols-[1fr_3fr] sm:gap-10"
              >
                <p className="font-main text-sm text-black/50">
                  {formatPostDate(meta.publishedAt)}
                </p>
                <div className="mt-4 sm:mt-0">
                  <h2 className="font-main text-3xl font-normal leading-tight tracking-[-0.02em] text-black transition-colors group-hover:text-primary sm:text-4xl">
                    {meta.title}
                  </h2>
                  <p className="mt-4 max-w-2xl font-main text-lg leading-relaxed text-black/60">
                    {meta.description}
                  </p>
                </div>
              </a>
            </article>
          ))}
        </div>
      </section>
    </BlogShell>
  );
};

export default BlogIndexPage;
