<h1><em><samp>synced-store</samp></em></h1>

A synced store based Y.js. More information see: [API](https://openflat-io.github.io/synced-core/)

## Install

```bash
pnpm install synced-store
```

## Usage

```ts
import { SyncedStorage, Storage } from "synced-store";

type ClassroomStorageState = {
    ban: boolean;
    raiseHandUsers: string[];
    shareScreen: boolean;
};

const roomUUID = "exampleRoom";

// replace to your own websocket server
const hostUrl = "ws://localhost:1234";

const syncedStorage = new SyncedStorage(roomUUID, hostUrl);
const classroomStorage: Storage<ClassroomStorageState> =
    syncedStorage.connectStorage<ClassroomStorageState>("classroom", {
        ban: false,
        raiseHandUsers: [],
        shareScreen: false,
    });

console.log(classroomStorage.state); // { ban: false, raiseHand: [] }

classroomStorage.setState({
    raiseHandUsers: ["user1", "user2"],
});

console.log(classroomStorage.state); // { ban: false, raiseHandUsers: [ 'user1', 'user2' ] }

// you can call disposer to remove listener or add it to your disposer manager
const disposer = classroomStorage.on("stateChanged", (diff: Partial<ClassroomStorageState>) => {
    console.log(diff); // the updated value
});

classroomStorage.resetState();

console.log(classroomStorage.state); // { ban: false, raiseHand: [] }
```

> If you want to host in local, you can use `y-websocket`. More detail see this [test](https://github.com/openflat-io/tldraw-store/blob/6b10dfe69503f6d0d752fba3549d1cb8e31a0c18/package.json#L12)

## Usage in `tldraw`

```tsx
import { useMemo } from "react";
import { TLRecord } from "@tldraw/tldraw";
import { TlDrawSyncedStorage } from "synced-store"

const roomUUID = "exampleRoom"
const hostUrl = "ws://localhost:1234" // replace to your host url

const { syncedStorage, room } = useMemo(() => {
    const syncedStorage = new TlDrawSyncedStorage<TLRecord>(
        roomUUID,
        { id: `tl_${roomUUID}` } as TLRecord,
        hostUrl,
    );

    return {
        syncedStorage,
        room: syncedStorage.provider,
    };
}, [hostUrl, roomUUID]);
```

## License

MIT @[Openflat](https://github.com/openflat-io)