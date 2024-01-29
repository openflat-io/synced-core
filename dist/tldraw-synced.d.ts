import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { YKeyValue } from "y-utility/y-keyvalue";
import { SyncedStorageState } from "./type";
export type SyncedStorageDiff<T> = {
    toPut: T[];
    toRemove: string[];
};
export declare class TlDrawSyncedStorage<T extends SyncedStorageState> {
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
