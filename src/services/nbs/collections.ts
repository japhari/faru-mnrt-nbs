import * as winston from 'winston';
import { Collection, MongoClient } from 'mongodb';
import { NbsConfigResolved, NbsDbState, CollectionInfo, SeedCollections } from './types';
import { extractDbName, parseIdValue } from './mongo.utils';

export async function ensureCollections(
  state: NbsDbState,
  config: NbsConfigResolved
): Promise<{
  collection: Collection<Record<string, any>>;
  stateCollection: Collection<Record<string, any>>;
}> {
  if (state.snapshots && state.state) {
    return { collection: state.snapshots, stateCollection: state.state };
  }

  const mongoUrl = config.storage.mongoUrl;
  const dbName = config.storage.dbName || extractDbName(mongoUrl);
  if (!state.client) {
    state.client = new MongoClient(mongoUrl);
    await state.client.connect();
  }
  state.db = state.client.db(dbName);
  state.snapshots = state.db.collection(config.storage.collection);
  state.state = state.db.collection(config.storage.stateCollection);
  return { collection: state.snapshots, stateCollection: state.state };
}

export async function ensureSeedCollections(
  state: NbsDbState,
  config: NbsConfigResolved
): Promise<SeedCollections> {
  if (
    state.indicatorGroups &&
    state.indicators &&
    state.adminAreas &&
    state.disaggregations &&
    state.institutions &&
    state.disaggregationsIndicators &&
    state.indicatorValues
  ) {
    return {
      indicatorGroups: state.indicatorGroups,
      indicators: state.indicators,
      adminAreas: state.adminAreas,
      disaggregations: state.disaggregations,
      institutions: state.institutions,
      disaggregationsIndicators: state.disaggregationsIndicators,
      indicatorValues: state.indicatorValues,
    };
  }

  if (!state.db) {
    await ensureCollections(state, config);
  }

  const collections = config.seeding.collections;
  state.indicatorGroups = state.db!.collection(collections.indicatorGroups);
  state.indicators = state.db!.collection(collections.indicators);
  state.adminAreas = state.db!.collection(collections.adminAreas);
  state.disaggregations = state.db!.collection(collections.disaggregations);
  state.institutions = state.db!.collection(collections.institutions);
  state.disaggregationsIndicators = state.db!.collection(collections.disaggregationsIndicators);
  state.indicatorValues = state.db!.collection(collections.indicatorValues);

  try {
    await state.indicatorValues.createIndex(
      {
        mnrt_indicator_id: 1,
        disaggregation_id: 1,
        institution_id: 1,
        year: 1,
        quarter: 1,
      },
      {
        unique: true,
        partialFilterExpression: {
          mnrt_indicator_id: { $exists: true },
          disaggregation_id: { $exists: true },
          institution_id: { $exists: true },
          year: { $exists: true },
        },
      }
    );
  } catch (err: any) {
    winston.warn(`Failed to build indicator values index: ${err?.message || err}`);
  }

  return {
    indicatorGroups: state.indicatorGroups,
    indicators: state.indicators,
    adminAreas: state.adminAreas,
    disaggregations: state.disaggregations,
    institutions: state.institutions,
    disaggregationsIndicators: state.disaggregationsIndicators,
    indicatorValues: state.indicatorValues,
  };
}

export async function getCollection(
  state: NbsDbState,
  config: NbsConfigResolved,
  name: string
): Promise<Collection<Record<string, any>>> {
  if (!state.db) {
    await ensureCollections(state, config);
  }
  return state.db!.collection(name);
}

export function getCollectionInfo(
  config: NbsConfigResolved,
  collectionKey: string
): CollectionInfo | null {
  const collections = config.seeding.collections;
  const map: Record<string, CollectionInfo> = {
    'indicator-groups': { name: collections.indicatorGroups, idField: 'id' },
    disaggregations: { name: collections.disaggregations, idField: 'id' },
    'mnrt-indicators': { name: collections.indicators, idField: 'indicator_id' },
    'indicator-admin-areas': { name: collections.adminAreas, idField: 'id' },
    institutions: { name: collections.institutions, idField: 'id' },
    'indicator-values': { name: collections.indicatorValues, idField: '_id' },
  };
  return map[collectionKey] ?? null;
}

export async function listCollectionItems(
  state: NbsDbState,
  config: NbsConfigResolved,
  collectionKey: string,
  options: { limit?: number; skip?: number } = {}
): Promise<any[]> {
  const info = getCollectionInfo(config, collectionKey);
  if (!info) throw new Error('Unknown collection');
  const collection = await getCollection(state, config, info.name);
  const limit = options.limit ?? 50;
  const skip = options.skip ?? 0;
  return collection.find({}).skip(skip).limit(limit).toArray();
}

export async function getCollectionItem(
  state: NbsDbState,
  config: NbsConfigResolved,
  collectionKey: string,
  idRaw: string
): Promise<any | null> {
  const info = getCollectionInfo(config, collectionKey);
  if (!info) throw new Error('Unknown collection');
  const collection = await getCollection(state, config, info.name);
  const id = parseIdValue(idRaw, info.idField);
  return collection.findOne({ [info.idField]: id });
}

export async function createCollectionItem(
  state: NbsDbState,
  config: NbsConfigResolved,
  collectionKey: string,
  payload: any
): Promise<any> {
  const info = getCollectionInfo(config, collectionKey);
  if (!info) throw new Error('Unknown collection');
  const collection = await getCollection(state, config, info.name);
  const result = await collection.insertOne(payload && typeof payload === 'object' ? payload : {});
  return result.insertedId;
}

export async function updateCollectionItem(
  state: NbsDbState,
  config: NbsConfigResolved,
  collectionKey: string,
  idRaw: string,
  payload: any
): Promise<number> {
  const info = getCollectionInfo(config, collectionKey);
  if (!info) throw new Error('Unknown collection');
  const collection = await getCollection(state, config, info.name);
  const id = parseIdValue(idRaw, info.idField);
  const result = await collection.updateOne(
    { [info.idField]: id },
    { $set: payload && typeof payload === 'object' ? payload : {} },
    { upsert: false }
  );
  return result.matchedCount;
}

export async function deleteCollectionItem(
  state: NbsDbState,
  config: NbsConfigResolved,
  collectionKey: string,
  idRaw: string
): Promise<number> {
  const info = getCollectionInfo(config, collectionKey);
  if (!info) throw new Error('Unknown collection');
  const collection = await getCollection(state, config, info.name);
  const id = parseIdValue(idRaw, info.idField);
  const result = await collection.deleteOne({ [info.idField]: id });
  return result.deletedCount;
}
