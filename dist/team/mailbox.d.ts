/**
 * Mailbox
 *
 * File-based JSONL mailbox with atomic append for inter-process
 * communication between team leader and workers.
 */
export interface MailboxMessage {
    id: string;
    from: string;
    to: string;
    type: 'review_request' | 'task_assignment' | 'ack' | 'shutdown' | 'heartbeat' | string;
    payload: unknown;
    timestamp: string;
    delivered: boolean;
}
/**
 * Atomically append a message to a JSONL mailbox file.
 */
export declare function appendMessage(mailboxPath: string, message: MailboxMessage): void;
/**
 * Read all messages from a mailbox file.
 */
export declare function readMessages(mailboxPath: string): MailboxMessage[];
/**
 * Read only undelivered messages for a specific recipient.
 */
export declare function readUndeliveredFor(mailboxPath: string, recipient: string): MailboxMessage[];
/**
 * Mark a specific message as delivered by rewriting the mailbox.
 * This is intentionally simple; for high throughput, use a secondary index.
 */
export declare function markDelivered(mailboxPath: string, messageId: string): boolean;
/**
 * Rewrite the entire mailbox file from an array of messages.
 */
export declare function rewriteMailbox(mailboxPath: string, messages: MailboxMessage[]): void;
/**
 * Get the default mailbox path for a team and worker.
 */
export declare function getMailboxPath(teamId: string, workerId: string, cwd?: string): string;
/**
 * Send a simple text message to a worker's mailbox.
 */
export declare function sendTextMessage(mailboxPath: string, from: string, to: string, body: string): void;
//# sourceMappingURL=mailbox.d.ts.map