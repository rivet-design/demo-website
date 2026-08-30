# Blog authoring

Add posts as `.mdx` files in `src/blog/posts`. Each post must export metadata:

```mdx
export const meta = {
  slug: 'example-post',
  title: 'Example post',
  description: 'A short summary used on the blog index.',
  publishedAt: '2026-08-29',
  author: 'Rivet',
  draft: false,
};
```

The filename does not control the content slug; `meta.slug` does. Missing
metadata, invalid dates, and duplicate slugs fail the build. Set `draft: true`
to keep content unavailable. The current `story-of-rivet` post is rendered at
`/about`; the old `/blog` URLs are normalized to that route.

Regular Markdown supports headings, links, lists, blockquotes, tables,
footnotes, task lists, and fenced code blocks. These richer components are
available without imports:

```mdx
<Callout title="A useful note" tone="note">
  Callout content can include **Markdown**.
</Callout>

<Figure
  src="/images/example.png"
  alt="Describe the useful information in the image"
  caption="An optional visible caption."
/>

<ImageGrid>
  <Figure src="/images/one.png" alt="Describe the first image" />
  <Figure src="/images/two.png" alt="Describe the second image" />
</ImageGrid>

<PullQuote>A short statement worth emphasizing.</PullQuote>

<Steps>
  1. Write the post. 2. Add media and alt text. 3. Run `npm run build`.
</Steps>
```

Add or change shared rich-text components in `components/RichText.tsx`, then
register them in `mdx-components.tsx`. Avoid one-off layout classes inside a
post so typography stays consistent across the blog.
