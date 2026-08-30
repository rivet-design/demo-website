declare module '*.mdx' {
  import type { ComponentType } from 'react';
  import type { BlogPostMeta } from './blog/types';

  export const meta: BlogPostMeta;
  const MDXContent: ComponentType;
  export default MDXContent;
}
