import { jest, describe, beforeEach, expect, it } from "@jest/globals";

import { SyncedStorage } from "../synced";
import { Storage } from "../storage";
import { afterAll } from "@jest/globals";

jest.mock("y-websocket");
jest.mock("yjs", () => {
    const mapStores = new Map();

    function createMockMap() {
        const keyValueStore = new Map();
        const callbacks: Function[] = [];

        return {
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
            clear: jest.fn(() => {
                keyValueStore.clear();
                callbacks.forEach(cb =>
                    cb({
                        keysChanged: new Set(),
                        transaction: {},
                    }),
                );
            }),
            delete: jest.fn(key => {
                keyValueStore.delete(key);
                callbacks.forEach(cb =>
                    cb({
                        keysChanged: new Set([key]),
                        transaction: {},
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
    }

    return {
        Doc: jest.fn(() => ({
            getMap: jest.fn((mapName) => {
                // create map if it doesn't exist
                if (!mapStores.has(mapName)) {
                    mapStores.set(mapName, createMockMap());
                }
                return mapStores.get(mapName);
            }),
            destroy: jest.fn()
        }))
    };
});


interface ClassRoomState {
    ban: Boolean;
    raiseHandUsers: any[];
    mute?: Boolean;
}

interface DeviceState {
    camera?: Boolean;
    microphone?: Boolean;
}

describe("SyncedStorage", () => {
    let syncedStorage: SyncedStorage;
    const roomId = "testRoom";
    const initialState: ClassRoomState = {
        ban: false,
        raiseHandUsers: [],
    };
    const serverUrl = "ws://localhost:1234";

    let classRoomStore: Storage<ClassRoomState>;

    beforeEach(() => {
        jest.clearAllMocks();
        syncedStorage = new SyncedStorage(roomId, serverUrl);
    });

    afterAll(() => {
        syncedStorage.dispose();
    })

    it("should initialize correctly", () => {
        expect(syncedStorage).toBeDefined();
    });

    it("should initialize state correctly", () => {
        classRoomStore = syncedStorage.connectStorage("classroom", initialState);
        expect(classRoomStore.state).toEqual(initialState);
    });

    it("should update and get state correctly", () => {
        classRoomStore.setState({
            raiseHandUsers: [
                "user1",
                "user2"
            ],
        })

        console.log(classRoomStore.state)
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

        // delete state by key that doesn't exist
        classRoomStore.deleteState("ban");
        expect(classRoomStore.state).not.toMatchObject(changedState);

        // delete state by state that doesn't exist
        classRoomStore.deleteState(newState);
        expect(classRoomStore.state).not.toMatchObject(newState);
    });

    it("should reset state correctly", () => {
        const changedState = {
            ban: true,
        };

        classRoomStore.setState({ ...changedState });
        expect(classRoomStore.state).toMatchObject(changedState);

        classRoomStore.resetState();
        expect(classRoomStore.state).toEqual(initialState);
    });

    it("should handle state changes", () => {
        const callback = jest.fn();
        const disposer = classRoomStore.on("stateChanged", callback);

        classRoomStore.setState({
            raiseHandUsers: ["user1", "user2"],
        });

        expect(callback).toHaveBeenCalled();
        expect(typeof disposer).toBe('function')

        // run disposer
        disposer()
    });

    it("should connect to existing storage correctly", () => {
        const initialState: DeviceState = {
            camera: false,
            microphone: false,
        };
        const device = syncedStorage.connectStorage("device", initialState);
        expect(device.state).toEqual(initialState);
    })

    it("should dispose correctly", () => {
        syncedStorage.dispose();
        expect(syncedStorage).toBeDefined();
    })
});
