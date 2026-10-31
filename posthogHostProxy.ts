import type {
  IncomingMessage,
  OutgoingHttpHeaders,
  ServerResponse,
} from 'node:http';
import { request as httpsRequest } from 'node:https';
import {
  createPostHogProxyHeaders,
  getPostHogClientIp,
  isStrippedPostHogResponseHeader,
  resolvePostHogProxyTarget,
} from './src/posthogProxy';

const BAD_GATEWAY_STATUS = 502;
const UPSTREAM_TIMEOUT_MS = 30_000;

type NextFunction = () => void;

/**
 * Creates Vite middleware that streams the browser SDK's PostHog traffic
 * (capture, flags, config, replay, and SDK assets) through rivet.design.
 */
export const createPostHogProxyMiddleware = () => {
  return (
    req: IncomingMessage,
    res: ServerResponse,
    next: NextFunction,
  ): void => {
    const targetUrl = resolvePostHogProxyTarget(req.url);
    if (!targetUrl) {
      next();
      return;
    }

    const upstreamReq = httpsRequest(
      targetUrl,
      {
        method: req.method,
        headers: createPostHogProxyHeaders(
          req.headers,
          targetUrl.host,
          getPostHogClientIp(req.headers, req.socket.remoteAddress),
        ),
        timeout: UPSTREAM_TIMEOUT_MS,
      },
      (upstreamRes) => {
        const headers: OutgoingHttpHeaders = {};
        Object.entries(upstreamRes.headers).forEach(([name, value]) => {
          if (!isStrippedPostHogResponseHeader(name)) {
            headers[name] = value;
          }
        });
        res.writeHead(upstreamRes.statusCode ?? BAD_GATEWAY_STATUS, headers);
        upstreamRes.pipe(res);
      },
    );

    upstreamReq.on('timeout', () => upstreamReq.destroy());
    upstreamReq.on('error', () => {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      res.writeHead(BAD_GATEWAY_STATUS, {
        'content-type': 'text/plain; charset=utf-8',
      });
      res.end('PostHog proxy failed');
    });
    res.on('close', () => upstreamReq.destroy());

    req.pipe(upstreamReq);
  };
};
