import type { ComponentType } from 'react';

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  author: string;
  draft?: boolean;
};

export type BlogPostModule = {
  default: ComponentType;
  meta: BlogPostMeta;
};
