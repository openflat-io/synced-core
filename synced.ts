import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

import { Storage } from "./storage";
import { SyncedStorageState } from "./type";

export class SyncedStorage {
    private doc: Y.Doc;
    private provider: WebsocketProvider;
    private storage: Map<string, Storage<any>> = new Map();

    constructor(private roomId: string, serverUrl: string) {
        this.doc = new Y.Doc();
        this.provider = new WebsocketProvider(serverUrl, this.roomId, this.doc);
        this.provider.connect();
    }

    connectStorage<T extends SyncedStorageState>(storageId: string, initialState: T): Storage<T> {
        let storage = this.storage.get(storageId);
        if (!storage) {
            storage = new Storage<T>(this.doc, this.roomId, initialState);
            this.storage.set(storageId, storage);
        }
        return storage;
    }

    get room(): WebsocketProvider {
        return this.provider;
    }

    dispose() {
        this.provider.disconnect();
        this.doc.destroy();
    }
}
