<h1><em><samp>synced-store</samp></em></h1>

A synced store based Y.js.

## Install

```bash
# install pkg
pnpm install synced-store
```

## Usage in `tldraw`

```tsx
import { useMemo } from "react";
import { TLRecord } from "@tldraw/tldraw";
import { TlDrawSyncedStorage } from "synced-store"

const hostUrl = "wss://demos.yjs.dev" // replace to your host url
const roomId = "exampleRoom"

const { syncedStorage, room } = useMemo(() => {
    const syncedStorage = new TlDrawSyncedStorage<TLRecord>(
        roomId,
        { id: `tl_${roomId}` } as TLRecord,
        hostUrl,
    );

    return {
        syncedStorage,
        room: syncedStorage.provider,
    };
}, [hostUrl, roomId]);
```

> If you want to host in local, you can use `y-websocket`. More detail see this [test](https://github.com/openflat-io/tldraw-store/blob/6b10dfe69503f6d0d752fba3549d1cb8e31a0c18/package.json#L12)

## License

MIT @[Openflat](https://github.com/openflat-io)