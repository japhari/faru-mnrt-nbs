import { Collection, Db, MongoClient } from 'mongodb';
export type NbsSource = {
    name: string;
    url: string;
    apiKey: string;
    apiKeyHeader?: string;
    tlsAllowInsecure?: boolean;
    params?: Record<string, any>;
    enabled?: boolean;
};
export type NbsConfig = {
    enabled?: boolean;
    schedule?: {
        dailyAt?: string;
        runOnStartup?: boolean;
    };
    request?: {
        startDateParam?: string;
        endDateParam?: string;
    };
    storage?: {
        mongoUrl?: string;
        dbName?: string;
        collection?: string;
        stateCollection?: string;
    };
    seeding?: {
        enabled?: boolean;
        collections?: {
            indicatorGroups?: string;
            indicators?: string;
            adminAreas?: string;
            disaggregations?: string;
            institutions?: string;
            disaggregationsIndicators?: string;
            indicatorValues?: string;
        };
        staticData?: {
            indicatorGroups?: Array<{
                id: number | string;
                name: string;
            }>;
            adminAreas?: Array<{
                id: number | string;
                name: string;
                code: string;
            }>;
            disaggregations?: Array<{
                id: number | string;
                code: string;
                name: string;
                indicator_group_id: number | string;
            }>;
        };
    };
    sources?: NbsSource[];
};
export type NbsConfigResolved = {
    enabled: boolean;
    schedule: {
        dailyAt: string;
        runOnStartup: boolean;
    };
    request: {
        startDateParam: string;
        endDateParam: string;
    };
    storage: {
        mongoUrl: string;
        dbName: string;
        collection: string;
        stateCollection: string;
    };
    seeding: {
        enabled: boolean;
        collections: {
            indicatorGroups: string;
            indicators: string;
            adminAreas: string;
            disaggregations: string;
            institutions: string;
            disaggregationsIndicators: string;
            indicatorValues: string;
        };
        staticData: {
            indicatorGroups: Array<{
                id: number | string;
                name: string;
            }>;
            adminAreas: Array<{
                id: number | string;
                name: string;
                code: string;
            }>;
            disaggregations: Array<{
                id: number | string;
                code: string;
                name: string;
                indicator_group_id: number | string;
            }>;
        };
    };
    sources: NbsSource[];
};
export type NbsRunRange = {
    startDate?: string;
    endDate?: string;
    source?: string;
};
export type NbsRunResult = {
    startDate: string;
    endDate: string;
    results: Array<{
        source: string;
        url: string;
        stored: boolean;
        status: number | null;
        error?: string;
    }>;
};
export type CollectionInfo = {
    name: string;
    idField: string;
};
export type NbsDbState = {
    client: MongoClient | null;
    db: Db | null;
    snapshots: Collection<Record<string, any>> | null;
    state: Collection<Record<string, any>> | null;
    indicatorGroups: Collection<Record<string, any>> | null;
    indicators: Collection<Record<string, any>> | null;
    adminAreas: Collection<Record<string, any>> | null;
    disaggregations: Collection<Record<string, any>> | null;
    institutions: Collection<Record<string, any>> | null;
    disaggregationsIndicators: Collection<Record<string, any>> | null;
    indicatorValues: Collection<Record<string, any>> | null;
};
export type SeedCollections = {
    indicatorGroups: Collection<Record<string, any>>;
    indicators: Collection<Record<string, any>>;
    adminAreas: Collection<Record<string, any>>;
    disaggregations: Collection<Record<string, any>>;
    institutions: Collection<Record<string, any>>;
    disaggregationsIndicators: Collection<Record<string, any>>;
    indicatorValues: Collection<Record<string, any>>;
};
