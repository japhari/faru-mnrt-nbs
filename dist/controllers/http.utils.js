"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.json = json;
exports.readBody = readBody;
function json(res, status, data) {
    const payload = JSON.stringify(data);
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(payload);
}
async function readBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (!chunks.length)
        return undefined;
    const raw = Buffer.concat(chunks).toString('utf8');
    try {
        return JSON.parse(raw);
    }
    catch {
        return raw;
    }
}
//# sourceMappingURL=http.utils.js.map