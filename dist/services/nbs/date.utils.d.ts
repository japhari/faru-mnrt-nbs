import { NbsRunRange } from './types';
export declare function formatDate(date: Date): string;
export declare function resolveRange(range: NbsRunRange): {
    startDate: string;
    endDate: string;
};
export declare function getNextRun(dailyAt?: string): Date;
export declare function extractYear(dateStr: string): string;
