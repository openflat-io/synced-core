import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { YKeyValue } from 'y-utility/y-keyvalue';

// synced.ts

// storage.ts
var Events = /* @__PURE__ */ ((Events2) => {
  Events2["STATE_CHANGED"] = "stateChanged";
  return Events2;
})(Events || {});
var Storage = class {
  /**
   * Initializes a new instance of the Storage class with a Y.Doc instance, a room identifier, 
   * and an initial state.
   *
   * @param doc - The Y.Doc instance for state synchronization.
   * @param roomId - The identifier for the room, used in state syncing.
   * @param initialState - The initial state of the storage.
   */
  constructor(doc, roomId, initialState) {
    this.doc = doc;
    this.roomId = roomId;
    this.listeners = {};
    this._state = this.doc.getMap(`synced-${this.roomId}`);
    this._state.observe((event) => {
      this.handleStateChange(event);
    });
    if (this._state.size === 0) {
      this.initializeState(initialState);
    }
  }
  /**
   * Gets the current state.
   */
  get state() {
    return this.getState();
  }
  /**
   * Initializes the state with the given initial state.
   *
   * @param initialState - The initial state to be set.
   */
  initializeState(initialState) {
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
  getState() {
    const stateObj = {};
    this._state.forEach((value, key) => {
      if (value !== void 0) {
        stateObj[key] = value;
      }
    });
    return stateObj;
  }
  /**
   * Sets the state based on the provided new state.
   *
   * @param newState - A partial state object representing the new state.
   */
  setState(newState) {
    Object.entries(newState).forEach(([key, value]) => {
      if (key) {
        this._state.set(key, value);
      }
    });
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
  deleteState(given) {
    if (typeof given === "string") {
      if (!this._state.has(given)) {
        return;
      }
      this._state.delete(given);
    } else {
      Object.keys(given).forEach((key) => {
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
  on(event, listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
    return () => {
      this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
    };
  }
  /**
   * Removes a listener for an event.
   * 
   * @param event The event name.
   * @param listener The listener function to remove.
   */
  off(event, listener) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
    }
  }
  /**
   * Emits an event with the given arguments.
   * 
   * @param event The event name to emit.
   * @param args Arguments to be passed to the event listeners.
   */
  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((listener) => listener(...args));
    }
  }
  /**
   * Handles state changes and emits a stateChanged event.
   * 
   * @param event The YMapEvent object.
   */
  handleStateChange(event) {
    const diff = {};
    event.keysChanged.forEach((key) => {
      const value = this._state.get(key);
      if (value !== void 0) {
        diff[key] = value;
      }
    });
    this.emit("stateChanged" /* STATE_CHANGED */, diff);
  }
};

// synced.ts
var SyncedStorage = class {
  /**
   * Creates an instance of SyncedStorage.
   * 
   * @param roomId The identifier for the room, used to segregate data within the server.
   * @param serverUrl The URL of the WebSocket server.
   */
  constructor(roomId, serverUrl) {
    this.roomId = roomId;
    this.storage = /* @__PURE__ */ new Map();
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
  connectStorage(storageId, initialState) {
    let storage = this.storage.get(storageId);
    if (!storage) {
      storage = new Storage(this.doc, this.roomId, initialState);
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
};
var TlDrawSyncedStorage = class {
  /**
   * Constructs an instance of TlDrawSyncedStorage.
   * 
   * @param roomId The identifier for the room, used for data segregation.
   * @param initialState The initial state to populate the storage with.
   * @param serverUrl The URL of the WebSocket server.
   */
  constructor(roomId, initialState, serverUrl) {
    var _a;
    this.doc = new Y.Doc();
    this.provider = new WebsocketProvider(serverUrl, roomId, this.doc);
    const yArray = this.doc.getArray(`synced-${roomId}`);
    this.state = new YKeyValue(yArray);
    if (((_a = this.state.yarray) == null ? void 0 : _a.length) === 0) {
      this.initializeState(initialState);
    }
  }
  /**
   * Gets the WebSocket provider associated with this storage.
   * 
   * @returns The WebsocketProvider instance.
   */
  get room() {
    return this.provider;
  }
  /**
   * Initializes the storage with the provided initial state.
   * 
   * @param initialState The initial state to set.
   */
  initializeState(initialState) {
    Object.values(initialState).forEach((record) => {
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
  getState() {
    var _a;
    return (_a = this.state.yarray) == null ? void 0 : _a.toJSON();
  }
  /**
   * Deletes parts of the state based on the provided newState object.
   * 
   * @param newState The state changes to apply, specifying the keys to delete.
   */
  deleteState(newState) {
    Object.values(newState).forEach(({ id }) => {
      if (!id)
        return;
      this.state.delete(id);
    });
  }
  /**
   * Sets the state based on the provided newState object.
   * 
   * @param newState The new state to apply.
   */
  setState(newState) {
    Object.values(newState).forEach((record) => {
      if (record.id) {
        this.state.set(record.id, record);
      }
      if (record.length > 0) {
        record.forEach((item) => {
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
  onStateChanged(callback) {
    this.state.on(
      "change",
      (changes, transaction) => {
        if (changes == null ? void 0 : changes.size) {
          const diff = {
            toPut: [],
            toRemove: []
          };
          changes.forEach((change, key) => {
            switch (change.action) {
              case "add":
              case "update": {
                const record = this.state.get(key);
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
      }
    );
  }
  /**
   * Unregisters a callback from being called when the state changes.
   * 
   * @param callback The callback function to unregister.
   */
  onStateOff(callback) {
    this.state.off(
      "change",
      (changes, transaction) => {
        if (changes == null ? void 0 : changes.size) {
          const diff = {
            toPut: [],
            toRemove: []
          };
          changes.forEach((change, key) => {
            switch (change.action) {
              case "add":
              case "update": {
                const record = this.state.get(key);
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
      }
    );
  }
  /**
   * Disconnects and disposes of the resources used by this TlDrawSyncedStorage instance.
   */
  dispose() {
    this.provider.disconnect();
    this.doc.destroy();
  }
};

export { Events, Storage, SyncedStorage, TlDrawSyncedStorage };
