/**
 * Hook Audit Log
 *
 * Records every hook invocation with input, output, and timing for
 * post-mortem diagnostics. Rotates daily and caps file size.
 */
export interface AuditEntry {
    timestamp: string;
    event: string;
    skill?: string;
    activated?: boolean;
    inputPrompt?: string;
    outputMessage?: string;
    durationMs: number;
    success: boolean;
    error?: string;
}
/**
 * Append a single audit entry to the daily JSONL file.
 */
export declare function writeAudit(entry: AuditEntry): void;
/**
 * Read the most recent N audit entries for diagnostics.
 */
export declare function readRecentAudit(count?: number): AuditEntry[];
//# sourceMappingURL=audit.d.ts.map