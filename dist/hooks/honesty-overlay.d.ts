/**
 * Honesty Overlay Injector
 *
 * Generates the Engineering Discipline Contract that is injected into every
 * active OMK workflow session. This contract forces the AI to distinguish
 * verified claims from assumptions, and requires machine-checkable evidence
 * for every significant assertion.
 */
/**
 * Returns the honesty contract markdown that is appended to agent overlays.
 */
export declare function getHonestyContract(): string;
/**
 * Returns a shorter version of the honesty contract for lightweight overlays
 * (e.g., single-step skills where the full contract would be excessive).
 */
export declare function getHonestyContractBrief(): string;
//# sourceMappingURL=honesty-overlay.d.ts.map