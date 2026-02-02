import { IncomingMessage, ServerResponse } from 'http';
type RouteHandler = (req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body?: any) => Promise<void>;
export declare const routes: Record<string, RouteHandler>;
export {};
