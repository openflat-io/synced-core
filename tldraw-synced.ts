import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { YKeyValue } from "y-utility/y-keyvalue";

import { SyncedStorageState } from "./type";

export type SyncedStorageDiff<T> = {
    toPut: T[];
    toRemove: string[];
};

/**
 * The TlDrawSyncedStorage class manages synchronized storage for drawing states
 * using Y.js and y-websocket.
 * 
 * @template T Type parameter extending from SyncedStorageState, represents the state structure.
 */
export class TlDrawSyncedStorage<T extends SyncedStorageState> {
    doc: Y.Doc;
    provider: WebsocketProvider;
    state: YKeyValue<T>;

    /**
     * Constructs an instance of TlDrawSyncedStorage.
     * 
     * @param roomId The identifier for the room, used for data segregation.
     * @param initialState The initial state to populate the storage with.
     * @param serverUrl The URL of the WebSocket server.
     */
    constructor(roomId: string, initialState: T, serverUrl: string) {
        this.doc = new Y.Doc();
        this.provider = new WebsocketProvider(serverUrl, roomId, this.doc);
        const yArray = this.doc.getArray<{ key: string; val: T }>(`synced-${roomId}`);
        this.state = new YKeyValue(yArray);

        if (this.state.yarray?.length === 0) {
            this.initializeState(initialState);
        }
    }

    /**
     * Gets the WebSocket provider associated with this storage.
     * 
     * @returns The WebsocketProvider instance.
     */
    get room(): WebsocketProvider {
        return this.provider;
    }

    /**
     * Initializes the storage with the provided initial state.
     * 
     * @param initialState The initial state to set.
     */
    initializeState(initialState: T) {
        Object.values(initialState).forEach(record => {
            if (!this.state.has(record.id)) {
                this.state.set(record.id, record);
            }
        });
    }

    /**
     * Retrieves the current state as an array.
     * 
     * @returns An array representing the current state.
     */
    getState(): any[] {
        return this.state.yarray?.toJSON();
    }

    /**
     * Deletes parts of the state based on the provided newState object.
     * 
     * @param newState The state changes to apply, specifying the keys to delete.
     */
    deleteState(newState: Partial<T>) {
        Object.values(newState).forEach(({ id }) => {
            if (!id) return;
            this.state.delete(id);
        });
    }

    /**
     * Sets the state based on the provided newState object.
     * 
     * @param newState The new state to apply.
     */
    setState(newState: Partial<T>) {
        Object.values(newState).forEach(record => {
            if (record.id) {
                this.state.set(record.id, record);
            }

            if (record.length > 0) {
                record.forEach((item: any) => {
                    this.state.set(item.id, item);
                });
            }
        });
    }

    /**
     * Registers a callback to be called when the state changes.
     * 
     * @param callback The function to be called with the changes and transaction when the state changes.
     */
    onStateChanged(callback: (diff: SyncedStorageDiff<T>, transaction: Y.Transaction) => void) {
        this.state.on(
            "change",
            (
                changes: Map<
                    string,
                    | { action: "delete"; oldValue: T }
                    | { action: "update"; oldValue: T; newValue: T }
                    | { action: "add"; newValue: T }
                >,
                transaction: Y.Transaction,
            ) => {
                if (changes?.size) {
                    const diff: SyncedStorageDiff<T> = {
                        toPut: [],
                        toRemove: [],
                    };
                    changes.forEach((change, key) => {
                        switch (change.action) {
                            case "add":
                            case "update": {
                                const record = this.state.get(key)!;
                                diff.toPut.push(record);
                                break;
                            }
                            case "delete": {
                                diff.toRemove.push(key);
                                break;
                            }
                        }
                    });
                    callback(diff, transaction);
                }
            },
        );
    }

    /**
     * Unregisters a callback from being called when the state changes.
     * 
     * @param callback The callback function to unregister.
     */
    onStateOff(callback: (diff: SyncedStorageDiff<T>, transaction: Y.Transaction) => void) {
        this.state.off(
            "change",
            (
                changes: Map<
                    string,
                    | { action: "delete"; oldValue: T }
                    | { action: "update"; oldValue: T; newValue: T }
                    | { action: "add"; newValue: T }
                >,
                transaction: Y.Transaction,
            ) => {
                if (changes?.size) {
                    const diff: SyncedStorageDiff<T> = {
                        toPut: [],
                        toRemove: [],
                    };
                    changes.forEach((change, key) => {
                        switch (change.action) {
                            case "add":
                            case "update": {
                                const record = this.state.get(key)!;
                                diff.toPut.push(record);
                                break;
                            }
                            case "delete": {
                                diff.toRemove.push(key);
                                break;
                            }
                        }
                    });
                    callback(diff, transaction);
                }
            },
        );
    }

    /**
     * Disconnects and disposes of the resources used by this TlDrawSyncedStorage instance.
     */
    dispose() {
        this.provider.disconnect();
        this.doc.destroy();
    }
}