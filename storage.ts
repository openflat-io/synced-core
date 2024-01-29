import * as Y from "yjs";
import { SyncedStorageState } from "./type";

export enum Events {
    STATE_CHANGED = "stateChanged",
};

export class Storage<T extends SyncedStorageState> {
    private _state: Y.Map<T>;
    private listeners: { [event: string]: Array<Function> } = {};

    constructor(private doc: Y.Doc, private roomId: string, initialState: T) {
        this._state = this.doc.getMap(`synced-${this.roomId}`);

        this._state.observe((event: Y.YMapEvent<T>) => {
            this.handleStateChange(event);
        });

        if (this._state.size === 0) {
            this.initializeState(initialState);
        }
    }

    get state(): T {
        return this.getState();
    }

    initializeState(initialState: T) {
        Object.entries(initialState).forEach(([key, value]) => {
            if (!this._state.has(key)) {
                this._state.set(key, value);
            }
        });
    }

    getState(): T {
        const stateObj: Partial<T> = {};
        this._state.forEach((value, key) => {
            if (value !== undefined) {
                stateObj[key as keyof T] = value as T[keyof T];
            }
        });
        return stateObj as T;
    }

    setState(newState: Partial<T>) {
        Object.entries(newState).forEach(([key, value]) => {
            if (key) {
                this._state.set(key, value);
            }
        });
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
            if (!this._state.has(given)) {
                return;
            }
            this._state.delete(given as string);
        } else {
            Object.keys(given).forEach(key => {
                if (!this._state.has(key)) {
                    return;
                }
                this._state.delete(key);
            });
        }
    }

    on(event: string, listener: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);

        return () => {
            this.listeners[event] = this.listeners[event].filter(l => l !== listener);
        };
    }

    off(event: string, listener: Function) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(l => l !== listener);
        }
    }

    private emit(event: string, ...args: any[]) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(...args));
        }
    }

    private handleStateChange(event: Y.YMapEvent<T>) {
        const diff: Partial<T> = {};

        event.keysChanged.forEach(key => {
            const value = this._state.get(key);
            if (value !== undefined) {
                diff[key as keyof T] = value as T[keyof T];
            }
        });

        this.emit(Events.STATE_CHANGED, diff);
    }
}
