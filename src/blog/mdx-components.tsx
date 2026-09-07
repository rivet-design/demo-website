import type { MDXComponents } from 'mdx/types';
import {
  Accent,
  Chapter,
  Closing,
  Mark,
  Masthead,
  PullQuote,
  ToolRow,
  WideFigure,
} from './components/RichText';

export const mdxComponents: MDXComponents = {
  Accent,
  Chapter,
  Closing,
  Mark,
  Masthead,
  PullQuote,
  ToolRow,
  WideFigure,
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
