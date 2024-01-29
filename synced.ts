import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

import { SyncedStorageState } from "./type";

export class SyncedStorage<T extends SyncedStorageState> {
    doc: Y.Doc;
    provider: WebsocketProvider;
    state: Y.Map<T>;

    private stateChangeListeners: Array<(diff: Partial<T>, transaction: Y.Transaction) => void> =
        [];

    constructor(roomId: string, initialState: T, serverUrl: string) {
        this.doc = new Y.Doc();
        this.provider = new WebsocketProvider(serverUrl, roomId, this.doc);
        this.state = this.doc.getMap(`synced-${roomId}`);

        this.state.observe((event: Y.YMapEvent<T>) => {
            this.handleStateChange(event);
        });

        if (this.state.size === 0) {
            this.initializeState(initialState);
        }
    }

    get room(): WebsocketProvider {
        return this.provider;
    }

    initializeState(initialState: T) {
        Object.entries(initialState).forEach(([key, value]) => {
            if (!this.state.has(key)) {
                this.state.set(key, value);
            }
        });
    }

    getState(): T {
        const stateObj: Partial<T> = {};
        this.state.forEach((value, key) => {
            if (value !== undefined) {
                stateObj[key as keyof T] = value as T[keyof T];
            }
        });
        return stateObj as T;
    }

    setState(newState: Partial<T>) {
        Object.entries(newState).forEach(([key, value]) => {
            if (key) {
                this.state.set(key, value);
            }
        });
    }

    onStateChanged(callback: (diff: Partial<T>, transaction: Y.Transaction) => void) {
        this.stateChangeListeners.push(callback);
    }

    offStateChanged(callback: (diff: Partial<T>, transaction: Y.Transaction) => void) {
        this.stateChangeListeners = this.stateChangeListeners.filter(
            listener => listener !== callback,
        );
    }

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
    deleteState(given: keyof T | Partial<T>) {
        if (typeof given === "string") {
            if (!this.state.has(given)) {
                return;
            }
            this.state.delete(given as string);
        } else {
            Object.keys(given).forEach(key => {
                if (!this.state.has(key)) {
                    return;
                }
                this.state.delete(key);
            });
        }
    }

    dispose() {
        this.provider.disconnect();
        this.doc.destroy();
    }

    private handleStateChange(event: Y.YMapEvent<T>) {
        const diff: Partial<T> = {};

        event.keysChanged.forEach(key => {
            const value = this.state.get(key);
            if (value !== undefined) {
                diff[key as keyof T] = value as T[keyof T];
            }
        });

        this.stateChangeListeners.forEach(listener => {
            listener(diff, event.transaction);
        });
    }
}
