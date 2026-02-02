import { NbsConfig, NbsRunRange, NbsRunResult } from './nbs/types';
declare class NbsService {
    private config;
    private dbState;
    private scheduleTimer;
    private scheduleInterval;
    setConfig(newConfig?: NbsConfig): void;
    startScheduler(): Promise<void>;
    runSync(range?: NbsRunRange): Promise<NbsRunResult>;
    listSnapshots(filters: {
        source?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<any[]>;
    getSeedCollections(): {
        indicatorGroups: string;
        indicators: string;
        adminAreas: string;
        disaggregations: string;
        institutions: string;
        disaggregationsIndicators: string;
        indicatorValues: string;
    };
    aggregateIndicatorData(params: {
        period: string;
        requestTime: string;
        indicatorId: string;
    }): Promise<{
        datavalues: Array<{
            area: number;
            area_name: string;
            indicator: string;
            sub_group: string;
            data_value: number;
            time_value: string;
            source: string;
            time_period: string;
        }>;
    }>;
    listCollectionItems(collectionKey: string, options?: {
        limit?: number;
        skip?: number;
    }): Promise<any[]>;
    getCollectionItem(collectionKey: string, idRaw: string): Promise<any | null>;
    createCollectionItem(collectionKey: string, payload: any): Promise<any>;
    updateCollectionItem(collectionKey: string, idRaw: string, payload: any): Promise<number>;
    deleteCollectionItem(collectionKey: string, idRaw: string): Promise<number>;
    private clearSchedule;
}
export declare const nbsService: NbsService;
export {};
