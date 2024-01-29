import { jest, describe, beforeEach, expect, it } from "@jest/globals";

import { SyncedStorage } from "../synced";
import { Storage } from "../storage";

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
                    transaction: {}
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
            getMap: jest.fn(() => mockMap)
        }))
    };
});

interface ClassRoomState {
    ban: Boolean;
    raiseHand: any[];
    mute?: Boolean;
}

describe("SyncedStorage", () => {
    let syncedStorage: SyncedStorage;
    const roomId = "testRoom";
    const initialState: ClassRoomState = {
        ban: false,
        raiseHand: [],
    };
    const serverUrl = "ws://localhost:1234";

    let classRoomStore: Storage<ClassRoomState>;

    beforeEach(() => {
        jest.clearAllMocks();
        syncedStorage = new SyncedStorage(roomId, serverUrl);
    });


    it("should initialize correctly", () => {
        expect(syncedStorage).toBeDefined();
    });

    it("should initialize state correctly", () => {
        classRoomStore = syncedStorage.connectStorage("classroom", initialState);
        expect(classRoomStore.state).toEqual(initialState);
    });

    it("should update and get state correctly", () => {
        // change original state
        const changedState = {
            ban: true,
        };

        classRoomStore.setState({ ...changedState });
        expect(classRoomStore.state).toMatchObject(changedState);

        // add new state
        const newState = {
            mute: true,
        };

        classRoomStore.setState({ ...newState });
        expect(classRoomStore.state).toMatchObject(newState);

        // delete state by state
        classRoomStore.deleteState(newState);
        expect(classRoomStore.state).not.toMatchObject(newState);

        // delete state by key
        classRoomStore.deleteState("ban");
        expect(classRoomStore.state).not.toMatchObject(changedState);
    });

    it("should handle state changes", () => {
        const callback = jest.fn();
        const disposer = classRoomStore.on("stateChanged", callback);

        classRoomStore.setState({
            raiseHand: ["user1", "user2"],
        });

        expect(callback).toHaveBeenCalled();
        expect(typeof disposer).toBe('function')
    });
});
