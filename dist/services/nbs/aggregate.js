"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateIndicatorData = aggregateIndicatorData;
const collections_1 = require("./collections");
async function aggregateIndicatorData(state, config, params) {
    const period = normalizePeriod(params.period);
    const { year, quarter, timeValue } = parseRequestTime(period, params.requestTime);
    const { indicatorMatch, indicatorLabel } = parseIndicatorId(params.indicatorId);
    const { indicatorValues, adminAreas, disaggregations } = await (0, collections_1.ensureSeedCollections)(state, config);
    const match = { year };
    if (period === 'Quarterly') {
        match.quarter = quarter;
    }
    if (indicatorMatch.length) {
        match.$or = indicatorMatch;
    }
    const totals = await indicatorValues
        .aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total: {
                    $sum: {
                        $convert: { input: '$value', to: 'double', onError: 0, onNull: 0 },
                    },
                },
            },
        },
    ])
        .toArray();
    const totalValue = totals[0]?.total ?? 0;
    const areaId = 1;
    const areaDoc = await adminAreas.findOne({ id: { $in: [areaId, String(areaId)] } });
    const areaName = areaDoc?.name || 'Tanzania Mainland';
    const subGroupDoc = await disaggregations.findOne({ code: 'DA001' });
    const subGroup = subGroupDoc?.name || 'Total';
    return {
        datavalues: [
            {
                area: areaId,
                area_name: areaName,
                indicator: indicatorLabel,
                sub_group: subGroup,
                data_value: totalValue,
                time_value: timeValue,
                source: 'MNRT Portal',
                time_period: period,
            },
        ],
    };
}
function normalizePeriod(periodRaw) {
    const value = String(periodRaw || '').trim().toLowerCase();
    if (value === 'yearly')
        return 'Yearly';
    if (value === 'quarterly')
        return 'Quarterly';
    throw new Error('Invalid period. Use Yearly or Quarterly.');
}
function parseRequestTime(period, requestTimeRaw) {
    const requestTime = String(requestTimeRaw || '').trim();
    if (period === 'Yearly') {
        if (!/^\d{4}$/.test(requestTime)) {
            throw new Error('Invalid requestTime for Yearly. Use YYYY.');
        }
        return { year: Number(requestTime), quarter: null, timeValue: requestTime };
    }
    const match = requestTime.match(/^(\d{4})Q([1-4])$/i);
    if (!match) {
        throw new Error('Invalid requestTime for Quarterly. Use YYYYQ1-YYYYQ4.');
    }
    const year = Number(match[1]);
    const quarter = Number(match[2]);
    return { year, quarter, timeValue: `${match[1]}Q${quarter}` };
}
function parseIndicatorId(indicatorIdRaw) {
    const raw = String(indicatorIdRaw || '').trim();
    if (!raw) {
        throw new Error('indicatorId is required.');
    }
    const digitMatch = raw.match(/(\d+)/);
    const numeric = digitMatch ? Number(digitMatch[1]) : null;
    const matchers = [];
    if (numeric != null && Number.isFinite(numeric)) {
        matchers.push({ indicator_id: numeric }, { mnrt_indicator_id: numeric });
    }
    else {
        matchers.push({ indicator_id: raw }, { mnrt_indicator_id: raw });
    }
    return { indicatorMatch: matchers, indicatorLabel: raw };
}
//# sourceMappingURL=aggregate.js.map