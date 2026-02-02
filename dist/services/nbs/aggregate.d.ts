import { NbsConfigResolved, NbsDbState } from './types';
type AggregateParams = {
    period: string;
    requestTime: string;
    indicatorId: string;
};
type AggregateResult = {
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
};
export declare function aggregateIndicatorData(state: NbsDbState, config: NbsConfigResolved, params: AggregateParams): Promise<AggregateResult>;
export {};
