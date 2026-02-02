"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const url_1 = require("url");
const nbs_service_1 = require("../services/nbs.service");
const http_utils_js_1 = require("./http.utils.js");
function isUnknownCollectionError(err) {
    return err?.message === 'Unknown collection';
}
exports.routes = {
    'POST /nbs/sync': async (req, res, _params, body) => {
        const urlObj = new url_1.URL(req.url || '', 'http://localhost');
        const queryStartDate = urlObj.searchParams.get('startDate') ?? undefined;
        const queryEndDate = urlObj.searchParams.get('endDate') ?? undefined;
        const querySource = urlObj.searchParams.get('source') ?? undefined;
        const startDate = body?.startDate ?? queryStartDate;
        const endDate = body?.endDate ?? queryEndDate;
        const source = body?.source ?? querySource;
        const result = await nbs_service_1.nbsService.runSync({ startDate, endDate, source });
        return (0, http_utils_js_1.json)(res, 200, { success: true, ...result });
    },
    'GET /nbs/snapshots': async (req, res) => {
        const urlObj = new url_1.URL(req.url || '', 'http://localhost');
        const source = urlObj.searchParams.get('source') || undefined;
        const startDate = urlObj.searchParams.get('startDate') || undefined;
        const endDate = urlObj.searchParams.get('endDate') || undefined;
        const limit = urlObj.searchParams.get('limit')
            ? Number(urlObj.searchParams.get('limit'))
            : undefined;
        const items = await nbs_service_1.nbsService.listSnapshots({ source, startDate, endDate, limit });
        return (0, http_utils_js_1.json)(res, 200, { success: true, items });
    },
    'GET /nbs-data': async (req, res) => {
        const urlObj = new url_1.URL(req.url || '', 'http://localhost');
        const period = urlObj.searchParams.get('period') || '';
        const requestTime = urlObj.searchParams.get('requestTime') || '';
        const indicatorId = urlObj.searchParams.get('indicatorId') || '';
        try {
            const data = await nbs_service_1.nbsService.aggregateIndicatorData({
                period,
                requestTime,
                indicatorId,
            });
            return (0, http_utils_js_1.json)(res, 200, data);
        }
        catch (err) {
            return (0, http_utils_js_1.json)(res, 400, { success: false, message: err?.message || 'Invalid request' });
        }
    },
    'GET /api/v1/:collection': async (req, res, params) => {
        const urlObj = new url_1.URL(req.url || '', 'http://localhost');
        const limit = urlObj.searchParams.get('limit')
            ? Number(urlObj.searchParams.get('limit'))
            : 50;
        const skip = urlObj.searchParams.get('skip')
            ? Number(urlObj.searchParams.get('skip'))
            : 0;
        try {
            const items = await nbs_service_1.nbsService.listCollectionItems(params.collection, { limit, skip });
            return (0, http_utils_js_1.json)(res, 200, { success: true, items });
        }
        catch (err) {
            if (isUnknownCollectionError(err)) {
                return (0, http_utils_js_1.json)(res, 404, { success: false, message: 'Unknown collection' });
            }
            throw err;
        }
    },
    'GET /api/v1/:collection/:id': async (_req, res, params) => {
        try {
            const item = await nbs_service_1.nbsService.getCollectionItem(params.collection, params.id);
            if (!item)
                return (0, http_utils_js_1.json)(res, 404, { success: false, message: 'Not found' });
            return (0, http_utils_js_1.json)(res, 200, { success: true, item });
        }
        catch (err) {
            if (isUnknownCollectionError(err)) {
                return (0, http_utils_js_1.json)(res, 404, { success: false, message: 'Unknown collection' });
            }
            throw err;
        }
    },
    'POST /api/v1/:collection': async (_req, res, params, body) => {
        try {
            const id = await nbs_service_1.nbsService.createCollectionItem(params.collection, body);
            return (0, http_utils_js_1.json)(res, 201, { success: true, id });
        }
        catch (err) {
            if (isUnknownCollectionError(err)) {
                return (0, http_utils_js_1.json)(res, 404, { success: false, message: 'Unknown collection' });
            }
            throw err;
        }
    },
    'PATCH /api/v1/:collection/:id': async (_req, res, params, body) => {
        try {
            const matched = await nbs_service_1.nbsService.updateCollectionItem(params.collection, params.id, body);
            return (0, http_utils_js_1.json)(res, 200, { success: true, matched });
        }
        catch (err) {
            if (isUnknownCollectionError(err)) {
                return (0, http_utils_js_1.json)(res, 404, { success: false, message: 'Unknown collection' });
            }
            throw err;
        }
    },
    'DELETE /api/v1/:collection/:id': async (_req, res, params) => {
        try {
            const deleted = await nbs_service_1.nbsService.deleteCollectionItem(params.collection, params.id);
            return (0, http_utils_js_1.json)(res, 200, { success: true, deleted });
        }
        catch (err) {
            if (isUnknownCollectionError(err)) {
                return (0, http_utils_js_1.json)(res, 404, { success: false, message: 'Unknown collection' });
            }
            throw err;
        }
    },
};
//# sourceMappingURL=nbs.routes.js.map