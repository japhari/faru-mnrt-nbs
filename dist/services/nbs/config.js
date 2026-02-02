"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.resolveConfig = resolveConfig;
exports.DEFAULT_CONFIG = {
    enabled: true,
    schedule: {
        dailyAt: '01:00',
        runOnStartup: true,
    },
    request: {
        startDateParam: 'startDate',
        endDateParam: 'endDate',
    },
    storage: {
        mongoUrl: 'mongodb://localhost/faru-mnrt',
        dbName: '',
        collection: 'nbs_api_snapshots',
        stateCollection: 'nbs_sync_state',
    },
    seeding: {
        enabled: true,
        collections: {
            indicatorGroups: 'nbs_indicator_groups',
            indicators: 'nbs_mnrt_indicators',
            adminAreas: 'nbs_indicator_admin_areas',
            disaggregations: 'nbs_disaggregations',
            institutions: 'nbs_institutions',
            disaggregationsIndicators: 'nbs_disaggregations_indicators',
            indicatorValues: 'nbs_indicators_data_values',
        },
        staticData: {
            indicatorGroups: [],
            adminAreas: [],
            disaggregations: [],
        },
    },
    sources: [],
};
function resolveConfig(newConfig) {
    return {
        enabled: newConfig?.enabled ?? exports.DEFAULT_CONFIG.enabled,
        schedule: {
            dailyAt: newConfig?.schedule?.dailyAt ?? exports.DEFAULT_CONFIG.schedule.dailyAt,
            runOnStartup: newConfig?.schedule?.runOnStartup ?? exports.DEFAULT_CONFIG.schedule.runOnStartup,
        },
        request: {
            startDateParam: newConfig?.request?.startDateParam ?? exports.DEFAULT_CONFIG.request.startDateParam,
            endDateParam: newConfig?.request?.endDateParam ?? exports.DEFAULT_CONFIG.request.endDateParam,
        },
        storage: {
            mongoUrl: newConfig?.storage?.mongoUrl ?? exports.DEFAULT_CONFIG.storage.mongoUrl,
            dbName: newConfig?.storage?.dbName ?? exports.DEFAULT_CONFIG.storage.dbName,
            collection: newConfig?.storage?.collection ?? exports.DEFAULT_CONFIG.storage.collection,
            stateCollection: newConfig?.storage?.stateCollection ?? exports.DEFAULT_CONFIG.storage.stateCollection,
        },
        seeding: {
            enabled: newConfig?.seeding?.enabled ?? exports.DEFAULT_CONFIG.seeding.enabled,
            collections: {
                indicatorGroups: newConfig?.seeding?.collections?.indicatorGroups ??
                    exports.DEFAULT_CONFIG.seeding.collections.indicatorGroups,
                indicators: newConfig?.seeding?.collections?.indicators ??
                    exports.DEFAULT_CONFIG.seeding.collections.indicators,
                adminAreas: newConfig?.seeding?.collections?.adminAreas ??
                    exports.DEFAULT_CONFIG.seeding.collections.adminAreas,
                disaggregations: newConfig?.seeding?.collections?.disaggregations ??
                    exports.DEFAULT_CONFIG.seeding.collections.disaggregations,
                institutions: newConfig?.seeding?.collections?.institutions ??
                    exports.DEFAULT_CONFIG.seeding.collections.institutions,
                disaggregationsIndicators: newConfig?.seeding?.collections?.disaggregationsIndicators ??
                    exports.DEFAULT_CONFIG.seeding.collections.disaggregationsIndicators,
                indicatorValues: newConfig?.seeding?.collections?.indicatorValues ??
                    exports.DEFAULT_CONFIG.seeding.collections.indicatorValues,
            },
            staticData: {
                indicatorGroups: newConfig?.seeding?.staticData?.indicatorGroups ??
                    exports.DEFAULT_CONFIG.seeding.staticData.indicatorGroups,
                adminAreas: newConfig?.seeding?.staticData?.adminAreas ??
                    exports.DEFAULT_CONFIG.seeding.staticData.adminAreas,
                disaggregations: newConfig?.seeding?.staticData?.disaggregations ??
                    exports.DEFAULT_CONFIG.seeding.staticData.disaggregations,
            },
        },
        sources: newConfig?.sources ?? exports.DEFAULT_CONFIG.sources,
    };
}
//# sourceMappingURL=config.js.map