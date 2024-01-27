import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { YKeyValue } from "y-utility/y-keyvalue";
export class SyncedStorage {
    constructor(roomId, initialState, serverUrl) {
        var _a;
        this.doc = new Y.Doc();
        this.provider = new WebsocketProvider(serverUrl, roomId, this.doc);
        const yArray = this.doc.getArray(`synced-${roomId}`);
        this.state = new YKeyValue(yArray);
        if (((_a = this.state.yarray) === null || _a === void 0 ? void 0 : _a.length) === 0) {
            this.initializeState(initialState);
        }
    }
    get room() {
        return this.provider;
    }
    initializeState(initialState) {
        Object.values(initialState).forEach(record => {
            if (!this.state.has(record.id)) {
                this.state.set(record.id, record);
            }
        });
    }
    getState() {
        var _a;
        return (_a = this.state.yarray) === null || _a === void 0 ? void 0 : _a.toJSON();
    }
    deleteState(newState) {
        Object.values(newState).forEach(({ id }) => {
            if (!id)
                return;
            this.state.delete(id);
        });
    }
    setState(newState) {
        Object.values(newState).forEach(record => {
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
        this.state.on("change", (changes, transaction) => {
            if (changes === null || changes === void 0 ? void 0 : changes.size) {
                const diff = {
                    toPut: [],
                    toRemove: [],
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
        });
    }
    onStateOff(callback) {
        this.state.off("change", (changes, transaction) => {
            if (changes === null || changes === void 0 ? void 0 : changes.size) {
                const diff = {
                    toPut: [],
                    toRemove: [],
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
        });
    }
    dispose() {
        this.provider.disconnect();
        this.doc.destroy();
    }
}
