import type {
  IncomingHttpHeaders,
  IncomingMessage,
  OutgoingHttpHeaders,
  ServerResponse,
} from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import {
  createPrototypeProxyHeaders,
  isHopByHopHeader,
  isPrototypeProxyRequest,
  resolvePrototypeHostOrigin,
} from './src/prototypeProxy';

const BAD_GATEWAY_STATUS = 502;

type NextFunction = () => void;

const createProxyTargetUrl = (
  targetOrigin: string,
  rawUrl: string | undefined,
): URL => {
  const requestUrl = new URL(rawUrl ?? '/', targetOrigin);
  return new URL(`${requestUrl.pathname}${requestUrl.search}`, targetOrigin);
};

const filterResponseHeaders = (
  headers: IncomingHttpHeaders,
): OutgoingHttpHeaders => {
  const proxyHeaders: OutgoingHttpHeaders = {};
  Object.entries(headers).forEach(([name, value]) => {
    if (!isHopByHopHeader(name)) {
      proxyHeaders[name] = value;
    }
  });
  return proxyHeaders;
};

/**
 * Streams an incoming request to the prototype host and streams the response back.
 */
export const proxyPrototypeRequest = (
  req: IncomingMessage,
  res: ServerResponse,
  targetOrigin: string,
): void => {
  const targetUrl = createProxyTargetUrl(targetOrigin, req.url);
  const requestFn =
    targetUrl.protocol === 'https:' ? httpsRequest : httpRequest;

  const upstreamReq = requestFn(
    {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      method: req.method,
      path: `${targetUrl.pathname}${targetUrl.search}`,
      headers: createPrototypeProxyHeaders(req.headers, targetOrigin),
    },
    (upstreamRes) => {
      res.writeHead(
        upstreamRes.statusCode ?? BAD_GATEWAY_STATUS,
        filterResponseHeaders(upstreamRes.headers),
      );
      upstreamRes.pipe(res);
    },
  );

  upstreamReq.on('error', () => {
    if (res.headersSent) {
      res.destroy();
      return;
    }

    res.writeHead(BAD_GATEWAY_STATUS, {
      'content-type': 'text/plain; charset=utf-8',
    });
    res.end('Prototype host proxy failed');
  });

  req.pipe(upstreamReq);
};

/**
 * Creates Vite middleware for internal prototype publish and share routes.
 */
export const createPrototypeProxyMiddleware = (
  targetOrigin = resolvePrototypeHostOrigin(process.env),
) => {
  return (
    req: IncomingMessage,
    res: ServerResponse,
    next: NextFunction,
  ): void => {
    if (!isPrototypeProxyRequest(req.method, req.url)) {
      next();
      return;
    }

    proxyPrototypeRequest(req, res, targetOrigin);
  };
};
