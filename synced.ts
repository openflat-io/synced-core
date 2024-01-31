import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

import { Storage } from "./storage";
import { SyncedStorageState } from "./type";

/**
 * The SyncedStorage class manages the creation and synchronization of multiple storage instances
 * over a WebSocket connection using Y.js and y-websocket.
 */
export class SyncedStorage {
    private doc: Y.Doc;
    private provider: WebsocketProvider;
    private storage: Map<string, Storage<any>> = new Map();

    /**
     * Creates an instance of SyncedStorage.
     * 
     * @param roomId The identifier for the room, used to segregate data within the server.
     * @param serverUrl The URL of the WebSocket server.
     */
    constructor(private roomId: string, serverUrl: string) {
        this.doc = new Y.Doc();
        this.provider = new WebsocketProvider(serverUrl, this.roomId, this.doc);
        this.provider.connect();
    }

    /**
     * Connects to or retrieves a named storage instance.
     * 
     * @template T The type of the synced storage state.
     * @param storageId Unique identifier for the storage instance.
     * @param initialState The initial state to be used for this storage if it's being created.
     * @returns An instance of Storage.
     */
    connectStorage<T extends SyncedStorageState>(storageId: string, initialState: T): Storage<T> {
        let storage = this.storage.get(storageId);
        if (!storage) {
            storage = new Storage<T>(this.doc, this.roomId, storageId, initialState);
            this.storage.set(storageId, storage);
        }
        return storage;
    }

    /**
     * Disconnects and disposes of the resources used by this SyncedStorage instance.
     */
    dispose() {
        this.provider.disconnect();
        this.doc.destroy();
    }
}
