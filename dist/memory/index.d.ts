/**
 * Memory Module — Public API
 *
 * Re-exports the MemPalace bridge and related utilities for OMK integration.
 */
export { createBridge, isMemPalaceAvailable, clearAvailabilityCache, getPalacePath, setPalacePath, parseSearchOutput, parseStatusOutput, parseWakeUpOutput, searchMemPalace, addToMemPalace, getMemPalaceStatus, wakeUpMemPalace, } from './bridge.js';
export type { MemPalaceBridge, CommandResult, SearchResult, StatusResult, PalaceStatus, InitOptions, MineOptions, SearchOptions, WakeUpOptions, StatusOptions, } from './bridge.js';
//# sourceMappingURL=index.d.ts.map