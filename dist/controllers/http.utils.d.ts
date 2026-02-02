import { IncomingMessage, ServerResponse } from 'http';
export declare function json(res: ServerResponse, status: number, data: any): void;
export declare function readBody(req: IncomingMessage): Promise<any>;
