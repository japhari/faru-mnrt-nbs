"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedFromResponse = seedFromResponse;
const collections_1 = require("./collections");
const date_utils_1 = require("./date.utils");
async function seedFromResponse(state, config, sourceName, data, startDate, endDate) {
    const datavalues = Array.isArray(data?.datavalues)
        ? data.datavalues
        : Array.isArray(data?.data?.datavalues)
            ? data.data.datavalues
            : Array.isArray(data?.data)
                ? data.data
                : null;
    if (!datavalues || datavalues.length === 0) {
        return;
    }
    const { indicatorGroups, indicators, adminAreas, disaggregations, institutions, disaggregationsIndicators, indicatorValues, } = await (0, collections_1.ensureSeedCollections)(state, config);
    const fallbackYear = (0, date_utils_1.extractYear)(startDate);
    const baseInstitutionId = data?.institution_id ?? data?.institutionId ?? null;
    for (const value of datavalues) {
        await ensureStaticSeeds(config, indicatorGroups, adminAreas, disaggregations);
        const indicatorIdRaw = value?.indicator != null
            ? value.indicator
            : value?.mnrt_indicator_id != null
                ? value.mnrt_indicator_id
                : null;
        const indicatorId = normalizeNumeric(indicatorIdRaw);
        const disaggregationCode = String(value?.disaggregation_id ?? value?.sub_group ?? 'UNKNOWN').trim();
        const disaggregationDoc = await resolveDisaggregation(config, disaggregations, indicatorGroups, disaggregationCode);
        const institutionIdRaw = value?.institution_id ?? baseInstitutionId ?? null;
        const institutionId = normalizeNumeric(institutionIdRaw);
        if (indicatorId == null || institutionId == null) {
            continue;
        }
        const timeValue = String(value?.time_value ?? fallbackYear).trim();
        const timePeriod = String(value?.time_period ?? 'Yearly').trim() || 'Yearly';
        const year = Number((0, date_utils_1.extractYear)(timeValue || fallbackYear));
        const quarter = value?.quarter ?? deriveQuarterFromDate(endDate);
        const dataValue = value?.data_value ?? value?.value ?? null;
        await indicators.updateOne({ indicator_id: indicatorId }, {
            $setOnInsert: { created_at: new Date() },
            $set: {
                indicator_id: indicatorId,
                indicator: indicatorId,
                name: indicatorId,
                source: value?.source || sourceName,
                updated_at: new Date(),
            },
        }, { upsert: true });
        if (institutionId != null) {
            await institutions.updateOne({ id: institutionId }, {
                $setOnInsert: { created_at: new Date() },
                $set: { id: institutionId, name: String(institutionId), updated_at: new Date() },
            }, { upsert: true });
        }
        await disaggregationsIndicators.updateOne({ indicator_id: indicatorId, disaggregation_id: disaggregationDoc.id }, {
            $setOnInsert: { created_at: new Date() },
            $set: { updated_at: new Date() },
        }, { upsert: true });
        await indicatorValues.updateOne({
            mnrt_indicator_id: indicatorId,
            disaggregation_id: disaggregationDoc.id,
            institution_id: institutionId,
            year,
            quarter,
        }, {
            $setOnInsert: { created_at: new Date() },
            $set: {
                mnrt_indicator_id: indicatorId,
                disaggregation_id: disaggregationDoc.id,
                disaggregation_code: disaggregationDoc.code,
                institution_id: institutionId,
                year,
                quarter,
                value: dataValue,
                indicator_id: indicatorId,
                area: institutionId,
                time_value: String(year),
                time_period: timePeriod,
                source: value?.source || sourceName,
                startDate,
                endDate,
                updated_at: new Date(),
            },
        }, { upsert: true });
    }
}
function normalizeNumeric(value) {
    if (value == null)
        return null;
    if (typeof value === 'number')
        return value;
    const str = String(value).trim();
    if (!str)
        return null;
    const asNumber = Number(str);
    return Number.isNaN(asNumber) ? str : asNumber;
}
async function ensureStaticSeeds(config, indicatorGroups, adminAreas, disaggregations) {
    const staticGroups = config.seeding.staticData.indicatorGroups;
    const staticAdminAreas = config.seeding.staticData.adminAreas;
    const staticDisaggregations = config.seeding.staticData.disaggregations;
    for (const group of staticGroups) {
        await indicatorGroups.updateOne({ id: group.id }, {
            $setOnInsert: { created_at: new Date() },
            $set: { id: group.id, name: group.name, updated_at: new Date() },
        }, { upsert: true });
    }
    for (const area of staticAdminAreas) {
        const normalizedId = normalizeNumeric(area.id);
        const idCandidates = [normalizedId, normalizedId != null ? String(normalizedId) : null].filter((value) => value != null);
        await adminAreas.updateOne({ $or: idCandidates.map((id) => ({ id })) }, {
            $setOnInsert: { created_at: new Date() },
            $set: {
                id: normalizedId,
                name: area.name,
                code: area.code,
                updated_at: new Date(),
            },
        }, { upsert: true });
    }
    for (const disagg of staticDisaggregations) {
        await disaggregations.updateOne({ code: disagg.code }, {
            $setOnInsert: { created_at: new Date() },
            $set: {
                id: disagg.id,
                code: disagg.code,
                name: disagg.name,
                indicator_group_id: disagg.indicator_group_id,
                updated_at: new Date(),
            },
        }, { upsert: true });
    }
}
async function resolveDisaggregation(config, disaggregations, indicatorGroups, code) {
    const existing = await disaggregations.findOne({ code });
    if (existing) {
        return {
            id: existing.id ?? existing.code,
            code,
            indicator_group_id: existing.indicator_group_id ?? null,
        };
    }
    const staticDisagg = config.seeding.staticData.disaggregations.find((item) => item.code === code);
    const newId = staticDisagg?.id ?? code;
    const groupId = staticDisagg?.indicator_group_id ?? null;
    if (groupId != null) {
        await indicatorGroups.updateOne({ id: groupId }, { $setOnInsert: { created_at: new Date() }, $set: { id: groupId, updated_at: new Date() } }, { upsert: true });
    }
    await disaggregations.updateOne({ code }, {
        $setOnInsert: { created_at: new Date() },
        $set: {
            id: newId,
            code,
            name: staticDisagg?.name ?? code,
            indicator_group_id: groupId,
            updated_at: new Date(),
        },
    }, { upsert: true });
    return { id: newId, code, indicator_group_id: groupId };
}
function deriveQuarterFromDate(dateStr) {
    const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match)
        return null;
    const month = Number(match[2]);
    if (!Number.isFinite(month) || month < 1 || month > 12)
        return null;
    return Math.ceil(month / 3);
}
//# sourceMappingURL=seeding.js.map