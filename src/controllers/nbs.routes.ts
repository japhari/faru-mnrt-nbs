import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { nbsService } from '../services/nbs.service';
import { json } from './http.utils.js';

type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
  body?: any
) => Promise<void>;

function isUnknownCollectionError(err: any): boolean {
  return err?.message === 'Unknown collection';
}

export const routes: Record<string, RouteHandler> = {
  'POST /nbs/sync': async (req, res, _params, body) => {
    const urlObj = new URL(req.url || '', 'http://localhost');
    const queryStartDate = urlObj.searchParams.get('startDate') ?? undefined;
    const queryEndDate = urlObj.searchParams.get('endDate') ?? undefined;
    const querySource = urlObj.searchParams.get('source') ?? undefined;
    const startDate = body?.startDate ?? queryStartDate;
    const endDate = body?.endDate ?? queryEndDate;
    const source = body?.source ?? querySource;
    const result = await nbsService.runSync({ startDate, endDate, source });
    return json(res, 200, { success: true, ...result });
  },

  'GET /nbs/snapshots': async (req, res) => {
    const urlObj = new URL(req.url || '', 'http://localhost');
    const source = urlObj.searchParams.get('source') || undefined;
    const startDate = urlObj.searchParams.get('startDate') || undefined;
    const endDate = urlObj.searchParams.get('endDate') || undefined;
    const limit = urlObj.searchParams.get('limit')
      ? Number(urlObj.searchParams.get('limit'))
      : undefined;
    const items = await nbsService.listSnapshots({ source, startDate, endDate, limit });
    return json(res, 200, { success: true, items });
  },

  'GET /nbs-data': async (req, res) => {
    const urlObj = new URL(req.url || '', 'http://localhost');
    const period = urlObj.searchParams.get('period') || '';
    const requestTime = urlObj.searchParams.get('requestTime') || '';
    const indicatorId = urlObj.searchParams.get('indicatorId') || '';
    try {
      const data = await nbsService.aggregateIndicatorData({
        period,
        requestTime,
        indicatorId,
      });
      return json(res, 200, data);
    } catch (err: any) {
      return json(res, 400, { success: false, message: err?.message || 'Invalid request' });
    }
  },

  'GET /api/v1/:collection': async (req, res, params) => {
    const urlObj = new URL(req.url || '', 'http://localhost');
    const limit = urlObj.searchParams.get('limit')
      ? Number(urlObj.searchParams.get('limit'))
      : 50;
    const skip = urlObj.searchParams.get('skip')
      ? Number(urlObj.searchParams.get('skip'))
      : 0;
    try {
      const items = await nbsService.listCollectionItems(params.collection, { limit, skip });
      return json(res, 200, { success: true, items });
    } catch (err) {
      if (isUnknownCollectionError(err)) {
        return json(res, 404, { success: false, message: 'Unknown collection' });
      }
      throw err;
    }
  },

  'GET /api/v1/:collection/:id': async (_req, res, params) => {
    try {
      const item = await nbsService.getCollectionItem(params.collection, params.id);
      if (!item) return json(res, 404, { success: false, message: 'Not found' });
      return json(res, 200, { success: true, item });
    } catch (err) {
      if (isUnknownCollectionError(err)) {
        return json(res, 404, { success: false, message: 'Unknown collection' });
      }
      throw err;
    }
  },

  'POST /api/v1/:collection': async (_req, res, params, body) => {
    try {
      const id = await nbsService.createCollectionItem(params.collection, body);
      return json(res, 201, { success: true, id });
    } catch (err) {
      if (isUnknownCollectionError(err)) {
        return json(res, 404, { success: false, message: 'Unknown collection' });
      }
      throw err;
    }
  },

  'PATCH /api/v1/:collection/:id': async (_req, res, params, body) => {
    try {
      const matched = await nbsService.updateCollectionItem(params.collection, params.id, body);
      return json(res, 200, { success: true, matched });
    } catch (err) {
      if (isUnknownCollectionError(err)) {
        return json(res, 404, { success: false, message: 'Unknown collection' });
      }
      throw err;
    }
  },

  'DELETE /api/v1/:collection/:id': async (_req, res, params) => {
    try {
      const deleted = await nbsService.deleteCollectionItem(params.collection, params.id);
      return json(res, 200, { success: true, deleted });
    } catch (err) {
      if (isUnknownCollectionError(err)) {
        return json(res, 404, { success: false, message: 'Unknown collection' });
      }
      throw err;
    }
  },
};
