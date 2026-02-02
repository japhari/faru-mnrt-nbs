import { NbsConfigResolved, NbsDbState } from './types';
export declare function seedFromResponse(state: NbsDbState, config: NbsConfigResolved, sourceName: string, data: any, startDate: string, endDate: string): Promise<void>;
