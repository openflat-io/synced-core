import * as Y from "yjs";
import { SyncedStorageState } from "./type";

export enum Events {
    STATE_CHANGED = "stateChanged",
};

/**
 * The Storage class manages and synchronizes state within a Y.Doc.
 * 
 * @template T Type parameter extending from SyncedStorageState.
 */
export class Storage<T extends SyncedStorageState> {
    private _state: Y.Map<T>;
    private listeners: { [event: string]: Array<Function> } = {};

    /**
     * Initializes a new instance of the Storage class with a Y.Doc instance, a room identifier, 
     * and an initial state.
     *
     * @param doc - The Y.Doc instance for state synchronization.
     * @param roomId - The identifier for the room, used in state syncing.
     * @param storageId - The identifier for the storage, used in state syncing.
     * @param initialState - The initial state of the storage.
     */
    constructor(private doc: Y.Doc, private roomId: string, private storageId: string, private initialState: T) {
        this._state = this.doc.getMap(`synced-${this.roomId}-${this.storageId}`);

        this._state.observe((event: Y.YMapEvent<T>) => {
            this.handleStateChange(event);
        });

        if (this._state.size === 0) {
            this.initializeState(this.initialState);
        }
    }

    /**
     * Gets the current state.
     */
    get state(): T {
        return this.getState();
    }

    /**
     * Initializes the state with the given initial state.
     *
     * @param initialState - The initial state to be set.
     */
    initializeState(initialState: T) {
        Object.entries(initialState).forEach(([key, value]) => {
            if (!this._state.has(key)) {
                this._state.set(key, value);
            }
        });
    }

    /**
     * Retrieves the current state.
     * 
     * @returns The current state as an instance of T.
     */
    getState(): T {
        const stateObj: Partial<T> = {};
        this._state.forEach((value, key) => {
            if (value !== undefined) {
                stateObj[key as keyof T] = value as T[keyof T];
            }
        });
        return stateObj as T;
    }

    /**
     * Sets the state based on the provided new state.
     *
     * @param newState - A partial state object representing the new state.
     */
    setState(newState: Partial<T>) {
        Object.entries(newState).forEach(([key, value]) => {
            if (key) {
                this._state.set(key, value);
            }
        });
    }

    /**
     * Resets the state to the initial state.
     */
    resetState() {
        this._state.clear();
        this.initializeState(this.initialState as T);
    }

    /**
     * Deletes a given key or state from the synced storage.
     * 
     * @param given The key (as a keyof T) or state (as Partial<T>) to delete.
     * 
     * @example1 By key:
     * // state: { ban: false, id: "shape:xxxx" }
     * // given: "ban" => state: { id: "shape:xxxx" }
     * 
     * @example2 By state:
     * // state: { ban: false, id: "shape:xxxx" }
     * // given: { ban: true } => state: { id: "shape:xxxx" }
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
    /**
     * Adds a listener for an event.
     * 
     * @param event The event name to listen for.
     * @param listener The function to be called when the event is emitted.
     * @returns A function to remove the listener.
     */
    on(event: string, listener: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);

        return () => {
            this.listeners[event] = this.listeners[event].filter(l => l !== listener);
        };
    }

    /**
     * Removes a listener for an event.
     * 
     * @param event The event name.
     * @param listener The listener function to remove.
     */
    off(event: string, listener: Function) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(l => l !== listener);
        }
    }

    /**
     * Emits an event with the given arguments.
     * 
     * @param event The event name to emit.
     * @param args Arguments to be passed to the event listeners.
     */
    private emit(event: string, ...args: any[]) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(...args));
        }
    }

    /**
     * Handles state changes and emits a stateChanged event.
     * 
     * @param event The YMapEvent object.
     */
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
