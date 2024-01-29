import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { YKeyValue } from "y-utility/y-keyvalue";

import { SyncedStorageState } from "./type";

export type SyncedStorageDiff<T> = {
    toPut: T[];
    toRemove: string[];
};

export class TlDrawSyncedStorage<T extends SyncedStorageState> {
    doc: Y.Doc;
    provider: WebsocketProvider;
    state: YKeyValue<T>;

    constructor(roomId: string, initialState: T, serverUrl: string) {
        this.doc = new Y.Doc();
        this.provider = new WebsocketProvider(serverUrl, roomId, this.doc);
        const yArray = this.doc.getArray<{ key: string; val: T }>(`synced-${roomId}`);
        this.state = new YKeyValue(yArray);

        if (this.state.yarray?.length === 0) {
            this.initializeState(initialState);
        }
    }

    get room(): WebsocketProvider {
        return this.provider;
    }

    initializeState(initialState: T) {
        Object.values(initialState).forEach(record => {
            if (!this.state.has(record.id)) {
                this.state.set(record.id, record);
            }
        });
    }

    getState(): any[] {
        return this.state.yarray?.toJSON();
    }

    deleteState(newState: Partial<T>) {
        Object.values(newState).forEach(({ id }) => {
            if (!id) return;
            this.state.delete(id);
        });
    }

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

    dispose() {
        this.provider.disconnect();
        this.doc.destroy();
    }
}