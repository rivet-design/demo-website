import type { MDXComponents } from 'mdx/types';
import {
  Callout,
  Figure,
  ImageGrid,
  PullQuote,
  Steps,
} from './components/RichText';

export const mdxComponents: MDXComponents = {
  Callout,
  Figure,
  ImageGrid,
  PullQuote,
  Steps,
  a: ({ href = '', ...props }) => {
    const external = /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...props}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      />
    );
  },
};
