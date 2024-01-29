import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
export class SyncedStorage {
    constructor(roomId, initialState, serverUrl) {
        this.stateChangeListeners = [];
        this.doc = new Y.Doc();
        this.provider = new WebsocketProvider(serverUrl, roomId, this.doc);
        this.state = this.doc.getMap(`synced-${roomId}`);
        this.state.observe((event) => {
            this.handleStateChange(event);
        });
        if (this.state.size === 0) {
            this.initializeState(initialState);
        }
    }
    get room() {
        return this.provider;
    }
    initializeState(initialState) {
        Object.entries(initialState).forEach(([key, value]) => {
            if (!this.state.has(key)) {
                this.state.set(key, value);
            }
        });
    }
    getState() {
        const stateObj = {};
        this.state.forEach((value, key) => {
            if (value !== undefined) {
                stateObj[key] = value;
            }
        });
        return stateObj;
    }
    setState(newState) {
        Object.entries(newState).forEach(([key, value]) => {
            if (key) {
                this.state.set(key, value);
            }
        });
    }
    onStateChanged(callback) {
        this.stateChangeListeners.push(callback);
    }
    offStateChanged(callback) {
        this.stateChangeListeners = this.stateChangeListeners.filter(listener => listener !== callback);
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
    deleteState(given) {
        if (typeof given === "string") {
            if (!this.state.has(given)) {
                return;
            }
            this.state.delete(given);
        }
        else {
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
    handleStateChange(event) {
        const diff = {};
        event.keysChanged.forEach(key => {
            const value = this.state.get(key);
            if (value !== undefined) {
                diff[key] = value;
            }
        });
        this.stateChangeListeners.forEach(listener => {
            listener(diff, event.transaction);
        });
    }
}
