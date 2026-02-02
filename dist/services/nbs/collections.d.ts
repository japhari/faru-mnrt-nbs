import { Collection } from 'mongodb';
import { NbsConfigResolved, NbsDbState, CollectionInfo, SeedCollections } from './types';
export declare function ensureCollections(state: NbsDbState, config: NbsConfigResolved): Promise<{
    collection: Collection<Record<string, any>>;
    stateCollection: Collection<Record<string, any>>;
}>;
export declare function ensureSeedCollections(state: NbsDbState, config: NbsConfigResolved): Promise<SeedCollections>;
export declare function getCollection(state: NbsDbState, config: NbsConfigResolved, name: string): Promise<Collection<Record<string, any>>>;
export declare function getCollectionInfo(config: NbsConfigResolved, collectionKey: string): CollectionInfo | null;
export declare function listCollectionItems(state: NbsDbState, config: NbsConfigResolved, collectionKey: string, options?: {
    limit?: number;
    skip?: number;
}): Promise<any[]>;
export declare function getCollectionItem(state: NbsDbState, config: NbsConfigResolved, collectionKey: string, idRaw: string): Promise<any | null>;
export declare function createCollectionItem(state: NbsDbState, config: NbsConfigResolved, collectionKey: string, payload: any): Promise<any>;
export declare function updateCollectionItem(state: NbsDbState, config: NbsConfigResolved, collectionKey: string, idRaw: string, payload: any): Promise<number>;
export declare function deleteCollectionItem(state: NbsDbState, config: NbsConfigResolved, collectionKey: string, idRaw: string): Promise<number>;
