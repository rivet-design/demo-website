# Clay Proxy Cloudflare Worker

Simple Cloudflare Worker to proxy requests to Clay webhook, solving CORS issues.

## Deploy

```bash
cd worker
npx wrangler@latest deploy
```

This will give you a URL like: `https://rivet-clay-proxy.your-account.workers.dev`

## Configure

Add the worker URL to your `.env.local`:

```
VITE_CLAY_PROXY_URL=https://rivet-clay-proxy.your-account.workers.dev
```

That's it! Your landing page will now call the worker instead of Clay directly.
