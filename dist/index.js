"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var synced_store_exports = {};
__export(synced_store_exports, {
  Events: () => Events,
  Storage: () => Storage,
  SyncedStorage: () => SyncedStorage,
  TlDrawSyncedStorage: () => TlDrawSyncedStorage
});
module.exports = __toCommonJS(synced_store_exports);

// synced.ts
var Y = __toESM(require("yjs"));
var import_y_websocket = require("y-websocket");

// storage.ts
var Events = /* @__PURE__ */ ((Events2) => {
  Events2["STATE_CHANGED"] = "stateChanged";
  return Events2;
})(Events || {});
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
    this.provider = new import_y_websocket.WebsocketProvider(serverUrl, this.roomId, this.doc);
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
var Y2 = __toESM(require("yjs"));
var import_y_websocket2 = require("y-websocket");
var import_y_keyvalue = require("y-utility/y-keyvalue");
var TlDrawSyncedStorage = class {
  constructor(roomId, initialState, serverUrl) {
    var _a;
    this.doc = new Y2.Doc();
    this.provider = new import_y_websocket2.WebsocketProvider(serverUrl, roomId, this.doc);
    const yArray = this.doc.getArray(`synced-${roomId}`);
    this.state = new import_y_keyvalue.YKeyValue(yArray);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Events,
  Storage,
  SyncedStorage,
  TlDrawSyncedStorage
});
//# sourceMappingURL=index.js.map