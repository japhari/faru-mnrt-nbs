"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
exports.resolveRange = resolveRange;
exports.getNextRun = getNextRun;
exports.extractYear = extractYear;
function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
function resolveRange(range) {
    if (range.startDate && range.endDate) {
        return { startDate: range.startDate, endDate: range.endDate };
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = formatDate(yesterday);
    return { startDate: date, endDate: date };
}
function getNextRun(dailyAt) {
    const [hourStr, minStr] = (dailyAt || '01:00').split(':');
    const hour = Number(hourStr);
    const minute = Number(minStr);
    const now = new Date();
    const next = new Date(now);
    next.setHours(Number.isFinite(hour) ? hour : 1, Number.isFinite(minute) ? minute : 0, 0, 0);
    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }
    return next;
}
function extractYear(dateStr) {
    const match = String(dateStr).match(/^(\d{4})/);
    return match ? match[1] : new Date().getFullYear().toString();
}
//# sourceMappingURL=date.utils.js.map