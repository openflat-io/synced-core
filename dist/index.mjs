// synced.ts
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// storage.ts
var Storage = class {
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
  get state() {
    return this.getState();
  }
  initializeState(initialState) {
    Object.entries(initialState).forEach(([key, value]) => {
      if (!this._state.has(key)) {
        this._state.set(key, value);
      }
    });
  }
  getState() {
    const stateObj = {};
    this._state.forEach((value, key) => {
      if (value !== void 0) {
        stateObj[key] = value;
      }
    });
    return stateObj;
  }
  setState(newState) {
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
  on(event, listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
    return () => {
      this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
    };
  }
  off(event, listener) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
    }
  }
  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((listener) => listener(...args));
    }
  }
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
  constructor(roomId, serverUrl) {
    this.roomId = roomId;
    this.storage = /* @__PURE__ */ new Map();
    this.doc = new Y.Doc();
    this.provider = new WebsocketProvider(serverUrl, this.roomId, this.doc);
    this.provider.connect();
  }
  connectStorage(storageId, initialState) {
    let storage = this.storage.get(storageId);
    if (!storage) {
      storage = new Storage(this.doc, this.roomId, initialState);
      this.storage.set(storageId, storage);
    }
    return storage;
  }
  get room() {
    return this.provider;
  }
  dispose() {
    this.provider.disconnect();
    this.doc.destroy();
  }
};

// tldraw-synced.ts
import * as Y2 from "yjs";
import { WebsocketProvider as WebsocketProvider2 } from "y-websocket";
import { YKeyValue } from "y-utility/y-keyvalue";
var TlDrawSyncedStorage = class {
  constructor(roomId, initialState, serverUrl) {
    var _a;
    this.doc = new Y2.Doc();
    this.provider = new WebsocketProvider2(serverUrl, roomId, this.doc);
    const yArray = this.doc.getArray(`synced-${roomId}`);
    this.state = new YKeyValue(yArray);
    if (((_a = this.state.yarray) == null ? void 0 : _a.length) === 0) {
      this.initializeState(initialState);
    }
  }
  get room() {
    return this.provider;
  }
  initializeState(initialState) {
    Object.values(initialState).forEach((record) => {
      if (!this.state.has(record.id)) {
        this.state.set(record.id, record);
      }
    });
  }
  getState() {
    var _a;
    return (_a = this.state.yarray) == null ? void 0 : _a.toJSON();
  }
  deleteState(newState) {
    Object.values(newState).forEach(({ id }) => {
      if (!id)
        return;
      this.state.delete(id);
    });
  }
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
  dispose() {
    this.provider.disconnect();
    this.doc.destroy();
  }
};
export {
  SyncedStorage,
  TlDrawSyncedStorage
};
