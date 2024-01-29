import { jest, describe, beforeEach, expect, it } from "@jest/globals";
import { SyncedStorage } from "../synced";

jest.mock("y-websocket");
jest.mock("yjs", () => {
    const keyValueStore = new Map();
    const callbacks: Function[] = [];

    const mockMap = {
        observe: jest.fn((callback: Function) => {
            callbacks.push(callback);
        }),
        has: jest.fn(key => keyValueStore.has(key)),
        get: jest.fn(key => keyValueStore.get(key)),
        set: jest.fn((key, value) => {
            keyValueStore.set(key, value);
            callbacks.forEach(cb =>
                cb({
                    keysChanged: new Set([key]),
                    transaction: {},
                }),
            );
        }),
        delete: jest.fn(key => {
            keyValueStore.delete(key);
            callbacks.forEach(cb =>
                cb({
                    keysChanged: new Set([key]),
                    transaction: {
                        // Add any relevant transaction mock details here
                    },
                    // Add any other details needed to mimic the Y.YMapEvent
                }),
            );
        }),
        forEach: jest.fn((callback: Function) => {
            keyValueStore.forEach((value, key) => {
                callback(value, key);
            });
        }),
        size: keyValueStore.size,
    };

    return {
        Doc: jest.fn(() => ({
            getMap: jest.fn(() => mockMap),
            // Add any other methods you are using from Y.Doc
        })),
        // Mock any other Yjs classes or functions you are using
    };
});

interface ClassRoomState {
    ban: Boolean;
    raiseHand: any[];
    mute?: Boolean;
}

describe("SyncedStorage", () => {
    let syncedStorage: SyncedStorage<ClassRoomState>;
    const roomId = "testRoom";
    const initialState: ClassRoomState = {
        ban: false,
        raiseHand: [],
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
        expect(syncedStorage.getState()).toEqual(initialState);
    });

    it("should update and get state correctly", () => {
        // change original state
        const changedState = {
            ban: true,
        };

        syncedStorage.setState({ ...changedState });
        expect(syncedStorage.getState()).toMatchObject(changedState);

        // add new state
        const newState = {
            mute: true,
        };

        syncedStorage.setState({ ...newState });
        expect(syncedStorage.getState()).toMatchObject(newState);

        // delete state by state
        syncedStorage.deleteState(newState);
        expect(syncedStorage.getState()).not.toMatchObject(newState);

        // delete state by key
        syncedStorage.deleteState("ban");
        expect(syncedStorage.getState()).not.toMatchObject(changedState);
    });

    it("should handle state changes", () => {
        const callback = jest.fn();
        syncedStorage.onStateChanged(callback);

        syncedStorage.setState({
            raiseHand: ["user1", "user2"],
        });

        expect(callback).toHaveBeenCalled();
    });
});
