"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRequest = handleRequest;
const nbs_routes_js_1 = require("./nbs.routes.js");
const http_utils_js_1 = require("./http.utils.js");
async function handleRequest(req, res) {
    const method = (req.method || 'GET').toUpperCase();
    const url = req.url || '/';
    const [pathOnly] = url.split('?');
    const routeKeys = Object.keys(nbs_routes_js_1.routes);
    for (const key of routeKeys) {
        const [m, pattern] = key.split(' ');
        if (m !== method)
            continue;
        const partsPattern = pattern.split('/').filter(Boolean);
        const partsUrl = pathOnly.split('/').filter(Boolean);
        if (partsPattern.length !== partsUrl.length)
            continue;
        const params = {};
        let matched = true;
        for (let i = 0; i < partsPattern.length; i++) {
            const p = partsPattern[i];
            const u = partsUrl[i];
            if (p.startsWith(':')) {
                params[p.slice(1)] = decodeURIComponent(u);
            }
            else if (p !== u) {
                matched = false;
                break;
            }
        }
        if (!matched)
            continue;
        const body = method === 'POST' || method === 'PUT' || method === 'PATCH'
            ? await (0, http_utils_js_1.readBody)(req)
            : undefined;
        try {
            await nbs_routes_js_1.routes[key](req, res, params, body);
        }
        catch (err) {
            (0, http_utils_js_1.json)(res, 500, { success: false, message: err?.message || 'Internal server error' });
        }
        return;
    }
    (0, http_utils_js_1.json)(res, 404, { success: false, message: 'Not Found' });
}
//# sourceMappingURL=router.js.map