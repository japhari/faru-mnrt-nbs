import { NbsConfig, NbsConfigResolved } from './types';

export const DEFAULT_CONFIG: NbsConfigResolved = {
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

export function resolveConfig(newConfig?: NbsConfig): NbsConfigResolved {
  return {
    enabled: newConfig?.enabled ?? DEFAULT_CONFIG.enabled,
    schedule: {
      dailyAt: newConfig?.schedule?.dailyAt ?? DEFAULT_CONFIG.schedule.dailyAt,
      runOnStartup: newConfig?.schedule?.runOnStartup ?? DEFAULT_CONFIG.schedule.runOnStartup,
    },
    request: {
      startDateParam:
        newConfig?.request?.startDateParam ?? DEFAULT_CONFIG.request.startDateParam,
      endDateParam: newConfig?.request?.endDateParam ?? DEFAULT_CONFIG.request.endDateParam,
    },
    storage: {
      mongoUrl: newConfig?.storage?.mongoUrl ?? DEFAULT_CONFIG.storage.mongoUrl,
      dbName: newConfig?.storage?.dbName ?? DEFAULT_CONFIG.storage.dbName,
      collection: newConfig?.storage?.collection ?? DEFAULT_CONFIG.storage.collection,
      stateCollection:
        newConfig?.storage?.stateCollection ?? DEFAULT_CONFIG.storage.stateCollection,
    },
    seeding: {
      enabled: newConfig?.seeding?.enabled ?? DEFAULT_CONFIG.seeding.enabled,
      collections: {
        indicatorGroups:
          newConfig?.seeding?.collections?.indicatorGroups ??
          DEFAULT_CONFIG.seeding.collections.indicatorGroups,
        indicators:
          newConfig?.seeding?.collections?.indicators ??
          DEFAULT_CONFIG.seeding.collections.indicators,
        adminAreas:
          newConfig?.seeding?.collections?.adminAreas ??
          DEFAULT_CONFIG.seeding.collections.adminAreas,
        disaggregations:
          newConfig?.seeding?.collections?.disaggregations ??
          DEFAULT_CONFIG.seeding.collections.disaggregations,
        institutions:
          newConfig?.seeding?.collections?.institutions ??
          DEFAULT_CONFIG.seeding.collections.institutions,
        disaggregationsIndicators:
          newConfig?.seeding?.collections?.disaggregationsIndicators ??
          DEFAULT_CONFIG.seeding.collections.disaggregationsIndicators,
        indicatorValues:
          newConfig?.seeding?.collections?.indicatorValues ??
          DEFAULT_CONFIG.seeding.collections.indicatorValues,
      },
      staticData: {
        indicatorGroups:
          newConfig?.seeding?.staticData?.indicatorGroups ??
          DEFAULT_CONFIG.seeding.staticData.indicatorGroups,
        adminAreas:
          newConfig?.seeding?.staticData?.adminAreas ??
          DEFAULT_CONFIG.seeding.staticData.adminAreas,
        disaggregations:
          newConfig?.seeding?.staticData?.disaggregations ??
          DEFAULT_CONFIG.seeding.staticData.disaggregations,
      },
    },
    sources: newConfig?.sources ?? DEFAULT_CONFIG.sources,
  };
}
