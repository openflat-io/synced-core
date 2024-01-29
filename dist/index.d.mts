import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { YKeyValue } from 'y-utility/y-keyvalue';

type SyncedStorageState = {
    [key: string]: any;
};

declare class Storage<T extends SyncedStorageState> {
    private doc;
    private roomId;
    private _state;
    private listeners;
    constructor(doc: Y.Doc, roomId: string, initialState: T);
    get state(): T;
    initializeState(initialState: T): void;
    getState(): T;
    setState(newState: Partial<T>): void;
    /**
     * Delete the given key or given state from the synced storage
     * @param given keyof T | Partial<T>
     * @returns void
     *
     * @example1 by key
     * state: { ban: false, id: "shape:xxxx"}
     * given: "ban" => state: { id: "shape:xxxx" }
     *
     * @example2 by state
     * state = { ban: false, id: "shape:xxxx" }
     * given: { ban: true } => state: { id: "shape:xxxx" }
     */
    deleteState(given: keyof T | Partial<T>): void;
    on(event: string, listener: Function): () => void;
    off(event: string, listener: Function): void;
    private emit;
    private handleStateChange;
}

declare class SyncedStorage {
    private roomId;
    private doc;
    private provider;
    private storage;
    constructor(roomId: string, serverUrl: string);
    connectStorage<T extends SyncedStorageState>(storageId: string, initialState: T): Storage<T>;
    get room(): WebsocketProvider;
    dispose(): void;
}

type SyncedStorageDiff<T> = {
    toPut: T[];
    toRemove: string[];
};
declare class TlDrawSyncedStorage<T extends SyncedStorageState> {
    doc: Y.Doc;
    provider: WebsocketProvider;
    state: YKeyValue<T>;
    constructor(roomId: string, initialState: T, serverUrl: string);
    get room(): WebsocketProvider;
    initializeState(initialState: T): void;
    getState(): any[];
    deleteState(newState: Partial<T>): void;
    setState(newState: Partial<T>): void;
    onStateChanged(callback: (diff: SyncedStorageDiff<T>, transaction: Y.Transaction) => void): void;
    onStateOff(callback: (diff: SyncedStorageDiff<T>, transaction: Y.Transaction) => void): void;
    dispose(): void;
}

export { SyncedStorage, type SyncedStorageDiff, TlDrawSyncedStorage };
