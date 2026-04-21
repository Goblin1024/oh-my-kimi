# Memory Bridge

TypeScript bridge between OMK (Node.js) and [MemPalace](https://github.com/MemPalace/mempalace) (Python CLI).

## Overview

MemPalace is a local-first AI memory system. This module lets OMK spawn the
`mempalace` CLI (and Python API) to search, store, and retrieve context across
sessions.

## API

### Standalone Convenience Functions

```typescript
import {
  searchMemPalace,
  addToMemPalace,
  getMemPalaceStatus,
  wakeUpMemPalace,
} from './memory/index.js';

// Semantic search
const results = await searchMemPalace('GraphQL migration', {
  wing: 'project',
  room: 'docs',
  limit: 5,
});
// → SearchResult[] { wing, room, source, similarity, text }

// Store new content
await addToMemPalace('We migrated to GraphQL in March 2026.', {
  wing: 'project',
  room: 'docs',
  tags: ['graphql', 'migration'],
});

// Palace health / inventory
const status = await getMemPalaceStatus();
// → PalaceStatus { totalDrawers, wings: [{ name, rooms: [{ name, drawers }] }] }

// L0 + L1 wake-up context for a new session
const context = await wakeUpMemPalace();
// → string (identity + essential story)
```

### Bridge Factory

For advanced usage (custom project roots, batch operations, etc.), create a
configured bridge instance:

```typescript
import { createBridge } from './memory/index.js';

const bridge = await createBridge('/path/to/project');

if (bridge.available) {
  await bridge.mine('/path/to/project', { wing: 'my_app' });
  const { results } = await bridge.search('auth flow');
  const { status } = await bridge.status();
}
```

## Resilience

If `mempalace` is not installed or not in `PATH`:

- `searchMemPalace` returns `[]` with a console warning.
- `addToMemPalace` resolves silently with a console warning.
- `getMemPalaceStatus` returns `{ totalDrawers: 0, wings: [] }`.
- `wakeUpMemPalace` returns `''`.

These functions never throw solely because MemPalace is missing.

## Palace Path

The bridge caches the palace directory in `.omk/palace-path` (relative to the
project root). If no cache exists, it defaults to `.mempalace` in the project
root.

```typescript
import { getPalacePath, setPalacePath } from './memory/index.js';

setPalacePath('/absolute/path/to/palace');
const path = getPalacePath(); // → resolved absolute path
```

## Adding Drawers

MemPalace's CLI does not expose a direct `add` command. The bridge writes a
temporary Python wrapper script that calls `mempalace.palace.get_collection()`
and upserts a drawer with deterministic idempotency (same content + wing +
room = same drawer ID).

The Python executable can be overridden via the `OMK_MEMPALACE_PYTHON`
environment variable (defaults to `python`).
