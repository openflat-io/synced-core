import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { SyncedStorageState } from "./type";
export declare class SyncedStorage<T extends SyncedStorageState> {
    doc: Y.Doc;
    provider: WebsocketProvider;
    state: Y.Map<T>;
    private stateChangeListeners;
    constructor(roomId: string, initialState: T, serverUrl: string);
    get room(): WebsocketProvider;
    initializeState(initialState: T): void;
    getState(): T;
    setState(newState: Partial<T>): void;
    onStateChanged(callback: (diff: Partial<T>, transaction: Y.Transaction) => void): void;
    offStateChanged(callback: (diff: Partial<T>, transaction: Y.Transaction) => void): void;
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
    dispose(): void;
    private handleStateChange;
}
