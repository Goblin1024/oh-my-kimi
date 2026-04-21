/**
 * Slot Manager
 *
 * Reads Kimi CLI config to determine max concurrent tasks,
 * then enforces slot limits for team worker spawning.
 */
/**
 * Parse max_running_tasks from Kimi config.toml.
 * Falls back to DEFAULT_MAX_TASKS if file missing or key not found.
 */
export declare function getMaxRunningTasks(configPath?: string): number;
/**
 * Manages a pool of execution slots.
 */
export declare class SlotManager {
    private maxSlots;
    private usedSlots;
    constructor(maxSlots?: number);
    /** Current number of available slots */
    available(): number;
    /** Total slot capacity */
    capacity(): number;
    /** Currently used slots */
    used(): number;
    /** Try to acquire a slot. Returns true on success. */
    acquire(): boolean;
    /** Release a previously acquired slot. */
    release(): void;
    /** Check if any slots are free without acquiring */
    hasAvailability(): boolean;
    /** Reset to zero used slots */
    reset(): void;
}
//# sourceMappingURL=slot-manager.d.ts.map