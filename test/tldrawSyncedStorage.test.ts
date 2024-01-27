import { jest, describe, beforeEach, expect, it } from "@jest/globals";
import { SyncedStorage } from "../synced";

jest.mock("y-websocket");
jest.mock("yjs", () => {
    const mockData = new Map();

    return {
        Doc: jest.fn(() => ({
            getArray: jest.fn(name => ({
                toJSON: jest.fn(() => Array.from(mockData.get(name) || [])),
            })),
        })),
    };
});

jest.mock("y-utility/y-keyvalue", () => {
    const keyValueStore = new Map();
    let callbacks: Function[] = [];

    return {
        YKeyValue: jest.fn(() => ({
            yarray: {
                toJSON: jest.fn(() =>
                    Array.from(keyValueStore, ([key, value]) => ({ [key]: value })),
                ),
                length: 0,
            },
            has: jest.fn(key => keyValueStore.has(key)),
            set: jest.fn((key, value) => {
                keyValueStore.set(key, value);
                callbacks.forEach(cb => cb());
            }),
            delete: jest.fn(key => {
                keyValueStore.delete(key);
                callbacks.forEach(cb => cb());
            }),
            on: jest.fn((event, cb: Function) => {
                if (event === "change") {
                    callbacks.push(cb);
                }
            }),
            off: jest.fn((event, cb) => {
                if (event === "change") {
                    callbacks = callbacks.filter(callback => callback !== cb);
                }
            }),
        })),
    };
});

interface ShapeState {
    [key: string]: any;
}

describe("SyncedStorage", () => {
    let syncedStorage: SyncedStorage<ShapeState>;
    const roomId = "testRoom";
    const initialState: ShapeState = {
        "shape:xxxx": {
            id: "shape:xxxx",
            type: "rectangle",
            x: 0,
            y: 0,
        },
    };
    const serverUrl = "wss://localhost:1234";

    beforeEach(() => {
        jest.clearAllMocks();
        syncedStorage = new SyncedStorage(roomId, initialState, serverUrl);
    });

    it("should initialize correctly", () => {
        expect(syncedStorage).toBeDefined();
    });

    it("should initialize state correctly", () => {
        expect(syncedStorage.getState()).toContainEqual(initialState);
    });

    it('should update and get state correctly', () => {
        // change original state
        const changedState = {
            'shape:xxxx': {
                id: "shape:xxxx",
                type: "rectangle",
                x: 0,
                y: 555
            }
        }
        syncedStorage.setState({ ...changedState })
        expect(syncedStorage.getState()).toContainEqual(changedState)

        // add new state
        const newState = {
            'shape:yyyy': {
                id: "shape:yyyy",
                type: "rectangle",
                x: 0,
                y: 0
            }
        }

        syncedStorage.setState({ ...changedState, ...newState })
        expect(syncedStorage.getState()).toContainEqual(newState)

        // delete state
        syncedStorage.deleteState(newState)
        expect(syncedStorage.getState()).not.toContainEqual(newState)
    })

    it("should handle state changes", () => {
        const callback = jest.fn();
        syncedStorage.onStateChanged(callback);

        syncedStorage.setState({
            "shape:xxxx": {
                id: "shape:xxxx",
                type: "rectangle",
                x: 0,
                y: 999,
            },
        });

        expect(callback).toHaveBeenCalled();
    });
});