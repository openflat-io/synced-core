import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { YKeyValue } from 'y-utility/y-keyvalue';

type SyncedStorageState = {
    [key: string]: any;
};

declare enum Events {
    STATE_CHANGED = "stateChanged"
}
/**
 * The Storage class manages and synchronizes state within a Y.Doc.
 *
 * @template T Type parameter extending from SyncedStorageState.
 */
declare class Storage<T extends SyncedStorageState> {
    private doc;
    private roomId;
    private storageId;
    private initialState;
    private _state;
    private listeners;
    /**
     * Initializes a new instance of the Storage class with a Y.Doc instance, a room identifier,
     * and an initial state.
     *
     * @param doc - The Y.Doc instance for state synchronization.
     * @param roomId - The identifier for the room, used in state syncing.
     * @param storageId - The identifier for the storage, used in state syncing.
     * @param initialState - The initial state of the storage.
     */
    constructor(doc: Y.Doc, roomId: string, storageId: string, initialState: T);
    /**
     * Gets the current state.
     */
    get state(): T;
    /**
     * Initializes the state with the given initial state.
     *
     * @param initialState - The initial state to be set.
     */
    initializeState(initialState: T): void;
    /**
     * Retrieves the current state.
     *
     * @returns The current state as an instance of T.
     */
    getState(): T;
    /**
     * Sets the state based on the provided new state.
     *
     * @param newState - A partial state object representing the new state.
     */
    setState(newState: Partial<T>): void;
    /**
     * Resets the state to the initial state.
     */
    resetState(): void;
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
    deleteState(given: keyof T | Partial<T>): void;
    /**
     * Adds a listener for an event.
     *
     * @param event The event name to listen for.
     * @param listener The function to be called when the event is emitted.
     * @returns A function to remove the listener.
     */
    on(event: string, listener: Function): () => void;
    /**
     * Removes a listener for an event.
     *
     * @param event The event name.
     * @param listener The listener function to remove.
     */
    off(event: string, listener: Function): void;
    /**
     * Emits an event with the given arguments.
     *
     * @param event The event name to emit.
     * @param args Arguments to be passed to the event listeners.
     */
    private emit;
    /**
     * Handles state changes and emits a stateChanged event.
     *
     * @param event The YMapEvent object.
     */
    private handleStateChange;
}

/**
 * The SyncedStorage class manages the creation and synchronization of multiple storage instances
 * over a WebSocket connection using Y.js and y-websocket.
 */
declare class SyncedStorage {
    private roomId;
    private doc;
    private provider;
    private storage;
    /**
     * Creates an instance of SyncedStorage.
     *
     * @param roomId The identifier for the room, used to segregate data within the server.
     * @param serverUrl The URL of the WebSocket server.
     */
    constructor(roomId: string, serverUrl: string);
    /**
     * Connects to or retrieves a named storage instance.
     *
     * @template T The type of the synced storage state.
     * @param storageId Unique identifier for the storage instance.
     * @param initialState The initial state to be used for this storage if it's being created.
     * @returns An instance of Storage.
     */
    connectStorage<T extends SyncedStorageState>(storageId: string, initialState: T): Storage<T>;
    /**
     * Disconnects and disposes of the resources used by this SyncedStorage instance.
     */
    dispose(): void;
}

type SyncedStorageDiff<T> = {
    toPut: T[];
    toRemove: string[];
};
/**
 * The TlDrawSyncedStorage class manages synchronized storage for drawing states
 * using Y.js and y-websocket.
 *
 * @template T Type parameter extending from SyncedStorageState, represents the state structure.
 */
declare class TlDrawSyncedStorage<T extends SyncedStorageState> {
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
    constructor(roomId: string, initialState: T, serverUrl: string);
    /**
     * Gets the WebSocket provider associated with this storage.
     *
     * @returns The WebsocketProvider instance.
     */
    get room(): WebsocketProvider;
    /**
     * Initializes the storage with the provided initial state.
     *
     * @param initialState The initial state to set.
     */
    initializeState(initialState: T): void;
    /**
     * Retrieves the current state as an array.
     *
     * @returns An array representing the current state.
     */
    getState(): any[];
    /**
     * Deletes parts of the state based on the provided newState object.
     *
     * @param newState The state changes to apply, specifying the keys to delete.
     */
    deleteState(newState: Partial<T>): void;
    /**
     * Sets the state based on the provided newState object.
     *
     * @param newState The new state to apply.
     */
    setState(newState: Partial<T>): void;
    /**
     * Registers a callback to be called when the state changes.
     *
     * @param callback The function to be called with the changes and transaction when the state changes.
     */
    onStateChanged(callback: (diff: SyncedStorageDiff<T>, transaction: Y.Transaction) => void): void;
    /**
     * Unregisters a callback from being called when the state changes.
     *
     * @param callback The callback function to unregister.
     */
    onStateOff(callback: (diff: SyncedStorageDiff<T>, transaction: Y.Transaction) => void): void;
    /**
     * Disconnects and disposes of the resources used by this TlDrawSyncedStorage instance.
     */
    dispose(): void;
}

export { Events, Storage, SyncedStorage, type SyncedStorageDiff, TlDrawSyncedStorage };
