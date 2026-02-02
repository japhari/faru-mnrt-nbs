"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nbsService = void 0;
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const winston = __importStar(require("winston"));
const config_1 = require("./nbs/config");
const date_utils_1 = require("./nbs/date.utils");
const collections_1 = require("./nbs/collections");
const seeding_1 = require("./nbs/seeding");
const aggregate_1 = require("./nbs/aggregate");
class NbsService {
    config = config_1.DEFAULT_CONFIG;
    dbState = {
        client: null,
        db: null,
        snapshots: null,
        state: null,
        indicatorGroups: null,
        indicators: null,
        adminAreas: null,
        disaggregations: null,
        institutions: null,
        disaggregationsIndicators: null,
        indicatorValues: null,
    };
    scheduleTimer = null;
    scheduleInterval = null;
    setConfig(newConfig) {
        this.config = (0, config_1.resolveConfig)(newConfig);
    }
    async startScheduler() {
        if (!this.config.enabled) {
            winston.info('NBS scheduler disabled');
            return;
        }
        if (this.config.schedule.runOnStartup) {
            this.runSync().catch((err) => {
                winston.error(`NBS initial sync failed: ${err?.message || err}`);
            });
        }
        const nextRun = (0, date_utils_1.getNextRun)(this.config.schedule.dailyAt);
        const delayMs = nextRun.getTime() - Date.now();
        this.clearSchedule();
        this.scheduleTimer = setTimeout(() => {
            this.runSync().catch((err) => {
                winston.error(`NBS scheduled sync failed: ${err?.message || err}`);
            });
            this.scheduleInterval = setInterval(() => {
                this.runSync().catch((err) => {
                    winston.error(`NBS scheduled sync failed: ${err?.message || err}`);
                });
            }, 24 * 60 * 60 * 1000);
        }, delayMs);
    }
    async runSync(range = {}) {
        const { startDate, endDate } = (0, date_utils_1.resolveRange)(range);
        const config = this.config;
        if (!config.sources.length) {
            winston.warn('NBS sync skipped: no sources configured');
            return { startDate, endDate, results: [] };
        }
        const sourceFilter = range.source?.trim();
        const sources = sourceFilter
            ? config.sources.filter((source) => source.name.toLowerCase() === sourceFilter.toLowerCase())
            : config.sources;
        if (sourceFilter && sources.length === 0) {
            winston.warn(`NBS sync skipped: unknown source "${sourceFilter}"`);
            return { startDate, endDate, results: [] };
        }
        const results = [];
        const { collection, stateCollection } = await (0, collections_1.ensureCollections)(this.dbState, config);
        await collection.createIndex({ source: 1, startDate: 1, endDate: 1 }, { unique: true });
        for (const source of sources) {
            if (source.enabled === false)
                continue;
            const headers = {};
            const headerName = source.apiKeyHeader || 'api-key';
            headers[headerName] = source.apiKey;
            try {
                const response = await axios_1.default.get(source.url, {
                    headers,
                    params: {
                        [config.request.startDateParam]: startDate,
                        [config.request.endDateParam]: endDate,
                        ...(source.params || {}),
                    },
                    httpsAgent: source.tlsAllowInsecure
                        ? new https_1.default.Agent({ rejectUnauthorized: false })
                        : undefined,
                    timeout: 60_000,
                });
                await collection.updateOne({ source: source.name, startDate, endDate }, {
                    $set: {
                        source: source.name,
                        url: source.url,
                        startDate,
                        endDate,
                        fetchedAt: new Date(),
                        status: response.status,
                        data: response.data,
                    },
                }, { upsert: true });
                if (config.seeding.enabled) {
                    await (0, seeding_1.seedFromResponse)(this.dbState, this.config, source.name, response.data, startDate, endDate);
                }
                results.push({
                    source: source.name,
                    url: source.url,
                    stored: true,
                    status: response.status,
                });
            }
            catch (err) {
                results.push({
                    source: source.name,
                    url: source.url,
                    stored: false,
                    status: err?.response?.status ?? null,
                    error: err?.message || 'Request failed',
                });
                winston.error(`NBS fetch failed for ${source.name}: ${err?.message || err}`);
            }
        }
        await stateCollection.updateOne({ _id: 'default' }, { $set: { lastEndDate: endDate, updatedAt: new Date() } }, { upsert: true });
        return { startDate, endDate, results };
    }
    async listSnapshots(filters) {
        const { collection } = await (0, collections_1.ensureCollections)(this.dbState, this.config);
        const query = {};
        if (filters.source)
            query.source = filters.source;
        if (filters.startDate)
            query.startDate = filters.startDate;
        if (filters.endDate)
            query.endDate = filters.endDate;
        const limit = Math.min(filters.limit ?? 50, 500);
        return collection
            .find(query)
            .sort({ fetchedAt: -1 })
            .limit(limit)
            .toArray();
    }
    getSeedCollections() {
        return this.config.seeding.collections;
    }
    async aggregateIndicatorData(params) {
        return (0, aggregate_1.aggregateIndicatorData)(this.dbState, this.config, params);
    }
    async listCollectionItems(collectionKey, options = {}) {
        return (0, collections_1.listCollectionItems)(this.dbState, this.config, collectionKey, options);
    }
    async getCollectionItem(collectionKey, idRaw) {
        return (0, collections_1.getCollectionItem)(this.dbState, this.config, collectionKey, idRaw);
    }
    async createCollectionItem(collectionKey, payload) {
        return (0, collections_1.createCollectionItem)(this.dbState, this.config, collectionKey, payload);
    }
    async updateCollectionItem(collectionKey, idRaw, payload) {
        return (0, collections_1.updateCollectionItem)(this.dbState, this.config, collectionKey, idRaw, payload);
    }
    async deleteCollectionItem(collectionKey, idRaw) {
        return (0, collections_1.deleteCollectionItem)(this.dbState, this.config, collectionKey, idRaw);
    }
    clearSchedule() {
        if (this.scheduleTimer)
            clearTimeout(this.scheduleTimer);
        if (this.scheduleInterval)
            clearInterval(this.scheduleInterval);
        this.scheduleTimer = null;
        this.scheduleInterval = null;
    }
}
exports.nbsService = new NbsService();
//# sourceMappingURL=nbs.service.js.map