import { IncomingMessage, ServerResponse } from 'http';
import { routes } from './nbs.routes.js';
import { json, readBody } from './http.utils.js';

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const method = (req.method || 'GET').toUpperCase();
  const url = req.url || '/';
  const [pathOnly] = url.split('?');

  const routeKeys = Object.keys(routes);
  for (const key of routeKeys) {
    const [m, pattern] = key.split(' ');
    if (m !== method) continue;
    const partsPattern = pattern.split('/').filter(Boolean);
    const partsUrl = pathOnly.split('/').filter(Boolean);
    if (partsPattern.length !== partsUrl.length) continue;

    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < partsPattern.length; i++) {
      const p = partsPattern[i];
      const u = partsUrl[i];
      if (p.startsWith(':')) {
        params[p.slice(1)] = decodeURIComponent(u);
      } else if (p !== u) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;

    const body =
      method === 'POST' || method === 'PUT' || method === 'PATCH'
        ? await readBody(req)
        : undefined;
    try {
      await routes[key](req, res, params, body);
    } catch (err: any) {
      json(res, 500, { success: false, message: err?.message || 'Internal server error' });
    }
    return;
  }

  json(res, 404, { success: false, message: 'Not Found' });
}
