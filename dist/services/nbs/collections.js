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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCollections = ensureCollections;
exports.ensureSeedCollections = ensureSeedCollections;
exports.getCollection = getCollection;
exports.getCollectionInfo = getCollectionInfo;
exports.listCollectionItems = listCollectionItems;
exports.getCollectionItem = getCollectionItem;
exports.createCollectionItem = createCollectionItem;
exports.updateCollectionItem = updateCollectionItem;
exports.deleteCollectionItem = deleteCollectionItem;
const winston = __importStar(require("winston"));
const mongodb_1 = require("mongodb");
const mongo_utils_1 = require("./mongo.utils");
async function ensureCollections(state, config) {
    if (state.snapshots && state.state) {
        return { collection: state.snapshots, stateCollection: state.state };
    }
    const mongoUrl = config.storage.mongoUrl;
    const dbName = config.storage.dbName || (0, mongo_utils_1.extractDbName)(mongoUrl);
    if (!state.client) {
        state.client = new mongodb_1.MongoClient(mongoUrl);
        await state.client.connect();
    }
    state.db = state.client.db(dbName);
    state.snapshots = state.db.collection(config.storage.collection);
    state.state = state.db.collection(config.storage.stateCollection);
    return { collection: state.snapshots, stateCollection: state.state };
}
async function ensureSeedCollections(state, config) {
    if (state.indicatorGroups &&
        state.indicators &&
        state.adminAreas &&
        state.disaggregations &&
        state.institutions &&
        state.disaggregationsIndicators &&
        state.indicatorValues) {
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
    state.indicatorGroups = state.db.collection(collections.indicatorGroups);
    state.indicators = state.db.collection(collections.indicators);
    state.adminAreas = state.db.collection(collections.adminAreas);
    state.disaggregations = state.db.collection(collections.disaggregations);
    state.institutions = state.db.collection(collections.institutions);
    state.disaggregationsIndicators = state.db.collection(collections.disaggregationsIndicators);
    state.indicatorValues = state.db.collection(collections.indicatorValues);
    try {
        await state.indicatorValues.createIndex({
            mnrt_indicator_id: 1,
            disaggregation_id: 1,
            institution_id: 1,
            year: 1,
            quarter: 1,
        }, {
            unique: true,
            partialFilterExpression: {
                mnrt_indicator_id: { $exists: true },
                disaggregation_id: { $exists: true },
                institution_id: { $exists: true },
                year: { $exists: true },
            },
        });
    }
    catch (err) {
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
async function getCollection(state, config, name) {
    if (!state.db) {
        await ensureCollections(state, config);
    }
    return state.db.collection(name);
}
function getCollectionInfo(config, collectionKey) {
    const collections = config.seeding.collections;
    const map = {
        'indicator-groups': { name: collections.indicatorGroups, idField: 'id' },
        disaggregations: { name: collections.disaggregations, idField: 'id' },
        'mnrt-indicators': { name: collections.indicators, idField: 'indicator_id' },
        'indicator-admin-areas': { name: collections.adminAreas, idField: 'id' },
        institutions: { name: collections.institutions, idField: 'id' },
        'indicator-values': { name: collections.indicatorValues, idField: '_id' },
    };
    return map[collectionKey] ?? null;
}
async function listCollectionItems(state, config, collectionKey, options = {}) {
    const info = getCollectionInfo(config, collectionKey);
    if (!info)
        throw new Error('Unknown collection');
    const collection = await getCollection(state, config, info.name);
    const limit = options.limit ?? 50;
    const skip = options.skip ?? 0;
    return collection.find({}).skip(skip).limit(limit).toArray();
}
async function getCollectionItem(state, config, collectionKey, idRaw) {
    const info = getCollectionInfo(config, collectionKey);
    if (!info)
        throw new Error('Unknown collection');
    const collection = await getCollection(state, config, info.name);
    const id = (0, mongo_utils_1.parseIdValue)(idRaw, info.idField);
    return collection.findOne({ [info.idField]: id });
}
async function createCollectionItem(state, config, collectionKey, payload) {
    const info = getCollectionInfo(config, collectionKey);
    if (!info)
        throw new Error('Unknown collection');
    const collection = await getCollection(state, config, info.name);
    const result = await collection.insertOne(payload && typeof payload === 'object' ? payload : {});
    return result.insertedId;
}
async function updateCollectionItem(state, config, collectionKey, idRaw, payload) {
    const info = getCollectionInfo(config, collectionKey);
    if (!info)
        throw new Error('Unknown collection');
    const collection = await getCollection(state, config, info.name);
    const id = (0, mongo_utils_1.parseIdValue)(idRaw, info.idField);
    const result = await collection.updateOne({ [info.idField]: id }, { $set: payload && typeof payload === 'object' ? payload : {} }, { upsert: false });
    return result.matchedCount;
}
async function deleteCollectionItem(state, config, collectionKey, idRaw) {
    const info = getCollectionInfo(config, collectionKey);
    if (!info)
        throw new Error('Unknown collection');
    const collection = await getCollection(state, config, info.name);
    const id = (0, mongo_utils_1.parseIdValue)(idRaw, info.idField);
    const result = await collection.deleteOne({ [info.idField]: id });
    return result.deletedCount;
}
//# sourceMappingURL=collections.js.map