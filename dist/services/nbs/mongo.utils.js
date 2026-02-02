"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIdValue = parseIdValue;
exports.extractDbName = extractDbName;
const mongodb_1 = require("mongodb");
function parseIdValue(idRaw, idField) {
    if (idField === '_id' && mongodb_1.ObjectId.isValid(idRaw)) {
        return new mongodb_1.ObjectId(idRaw);
    }
    if (/^\d+$/.test(idRaw)) {
        return Number(idRaw);
    }
    return idRaw;
}
function extractDbName(mongoUrl) {
    const withoutParams = mongoUrl.split('?')[0];
    const idx = withoutParams.lastIndexOf('/');
    if (idx !== -1 && idx < withoutParams.length - 1) {
        return withoutParams.slice(idx + 1);
    }
    return 'faru-mnrt';
}
//# sourceMappingURL=mongo.utils.js.map