import axios from 'axios';
import https from 'https';
import * as winston from 'winston';
import { DEFAULT_CONFIG, resolveConfig } from './nbs/config';
import { getNextRun, resolveRange } from './nbs/date.utils';
import {
  createCollectionItem,
  deleteCollectionItem,
  ensureCollections,
  getCollectionItem,
  listCollectionItems,
  updateCollectionItem,
} from './nbs/collections';
import { seedFromResponse } from './nbs/seeding';
import { aggregateIndicatorData } from './nbs/aggregate';
import { NbsConfig, NbsConfigResolved, NbsDbState, NbsRunRange, NbsRunResult } from './nbs/types';

class NbsService {
  private config: NbsConfigResolved = DEFAULT_CONFIG;
  private dbState: NbsDbState = {
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
  private scheduleTimer: NodeJS.Timeout | null = null;
  private scheduleInterval: NodeJS.Timeout | null = null;

  setConfig(newConfig?: NbsConfig): void {
    this.config = resolveConfig(newConfig);
  }

  async startScheduler(): Promise<void> {
    if (!this.config.enabled) {
      winston.info('NBS scheduler disabled');
      return;
    }

    if (this.config.schedule.runOnStartup) {
      this.runSync().catch((err) => {
        winston.error(`NBS initial sync failed: ${err?.message || err}`);
      });
    }

    const nextRun = getNextRun(this.config.schedule.dailyAt);
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

  async runSync(range: NbsRunRange = {}): Promise<NbsRunResult> {
    const { startDate, endDate } = resolveRange(range);
    const config = this.config;
    if (!config.sources.length) {
      winston.warn('NBS sync skipped: no sources configured');
      return { startDate, endDate, results: [] };
    }

    const sourceFilter = range.source?.trim();
    const sources = sourceFilter
      ? config.sources.filter(
          (source) => source.name.toLowerCase() === sourceFilter.toLowerCase()
        )
      : config.sources;
    if (sourceFilter && sources.length === 0) {
      winston.warn(`NBS sync skipped: unknown source "${sourceFilter}"`);
      return { startDate, endDate, results: [] };
    }

    const results: NbsRunResult['results'] = [];
    const { collection, stateCollection } = await ensureCollections(this.dbState, config);
    await collection.createIndex(
      { source: 1, startDate: 1, endDate: 1 },
      { unique: true }
    );

    for (const source of sources) {
      if (source.enabled === false) continue;
      const headers: Record<string, string> = {};
      const headerName = source.apiKeyHeader || 'api-key';
      headers[headerName] = source.apiKey;

      try {
        const response = await axios.get(source.url, {
          headers,
          params: {
            [config.request.startDateParam]: startDate,
            [config.request.endDateParam]: endDate,
            ...(source.params || {}),
          },
          httpsAgent: source.tlsAllowInsecure
            ? new https.Agent({ rejectUnauthorized: false })
            : undefined,
          timeout: 60_000,
        });

        await collection.updateOne(
          { source: source.name, startDate, endDate },
          {
            $set: {
              source: source.name,
              url: source.url,
              startDate,
              endDate,
              fetchedAt: new Date(),
              status: response.status,
              data: response.data,
            },
          },
          { upsert: true }
        );

        if (config.seeding.enabled) {
          await seedFromResponse(this.dbState, this.config, source.name, response.data, startDate, endDate);
        }

        results.push({
          source: source.name,
          url: source.url,
          stored: true,
          status: response.status,
        });
      } catch (err: any) {
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

    await stateCollection.updateOne(
      { _id: 'default' as any },
      { $set: { lastEndDate: endDate, updatedAt: new Date() } },
      { upsert: true }
    );

    return { startDate, endDate, results };
  }

  async listSnapshots(filters: {
    source?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<any[]> {
    const { collection } = await ensureCollections(this.dbState, this.config);
    const query: Record<string, any> = {};
    if (filters.source) query.source = filters.source;
    if (filters.startDate) query.startDate = filters.startDate;
    if (filters.endDate) query.endDate = filters.endDate;
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

  async aggregateIndicatorData(params: {
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
  }> {
    return aggregateIndicatorData(this.dbState, this.config, params);
  }

  async listCollectionItems(
    collectionKey: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<any[]> {
    return listCollectionItems(this.dbState, this.config, collectionKey, options);
  }

  async getCollectionItem(collectionKey: string, idRaw: string): Promise<any | null> {
    return getCollectionItem(this.dbState, this.config, collectionKey, idRaw);
  }

  async createCollectionItem(collectionKey: string, payload: any): Promise<any> {
    return createCollectionItem(this.dbState, this.config, collectionKey, payload);
  }

  async updateCollectionItem(
    collectionKey: string,
    idRaw: string,
    payload: any
  ): Promise<number> {
    return updateCollectionItem(this.dbState, this.config, collectionKey, idRaw, payload);
  }

  async deleteCollectionItem(collectionKey: string, idRaw: string): Promise<number> {
    return deleteCollectionItem(this.dbState, this.config, collectionKey, idRaw);
  }

  private clearSchedule(): void {
    if (this.scheduleTimer) clearTimeout(this.scheduleTimer);
    if (this.scheduleInterval) clearInterval(this.scheduleInterval);
    this.scheduleTimer = null;
    this.scheduleInterval = null;
  }
}

export const nbsService = new NbsService();
