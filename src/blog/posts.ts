import type { BlogPostMeta, BlogPostModule } from './types';

const modules = import.meta.glob<BlogPostModule>('./posts/*.mdx', {
  eager: true,
});

const requiredMetaFields = [
  'slug',
  'title',
  'description',
  'publishedAt',
  'author',
] as const;

const validateMeta = (meta: BlogPostMeta, sourcePath: string) => {
  for (const field of requiredMetaFields) {
    if (typeof meta?.[field] !== 'string' || meta[field].trim() === '') {
      throw new Error(
        `Blog post ${sourcePath} is missing metadata field "${field}".`,
      );
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.publishedAt)) {
    throw new Error(
      `Blog post ${sourcePath} must use YYYY-MM-DD for "publishedAt".`,
    );
  }

  return meta;
};

const entries = Object.entries(modules).map(([sourcePath, module]) => ({
  meta: validateMeta(module.meta, sourcePath),
  Content: module.default,
}));

const slugs = entries.map(({ meta }) => meta.slug);
if (new Set(slugs).size !== slugs.length) {
  throw new Error('Blog post slugs must be unique.');
}

export const getBlogPost = (slug: string) =>
  entries.find(({ meta }) => meta.slug === slug && !meta.draft);
