import type { MDXComponents } from 'mdx/types';
import {
  Callout,
  ImageGrid,
  PullQuote,
  RectangleImage,
  SplitImageText,
  SquareImage,
  Steps,
} from './components/RichText';

export const mdxComponents: MDXComponents = {
  Callout,
  ImageGrid,
  PullQuote,
  RectangleImage,
  SplitImageText,
  SquareImage,
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
