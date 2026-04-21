/**
 * Mailbox
 *
 * File-based JSONL mailbox with atomic append for inter-process
 * communication between team leader and workers.
 */
import { readFileSync, existsSync, appendFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
/**
 * Ensure the mailbox directory exists.
 */
function ensureDir(path) {
    mkdirSync(dirname(path), { recursive: true });
}
/**
 * Atomically append a message to a JSONL mailbox file.
 */
export function appendMessage(mailboxPath, message) {
    ensureDir(mailboxPath);
    const line = JSON.stringify(message) + '\n';
    appendFileSync(mailboxPath, line, 'utf-8');
}
/**
 * Read all messages from a mailbox file.
 */
export function readMessages(mailboxPath) {
    if (!existsSync(mailboxPath))
        return [];
    try {
        const content = readFileSync(mailboxPath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        return lines
            .map((line) => {
            try {
                return JSON.parse(line);
            }
            catch {
                return null;
            }
        })
            .filter((m) => m !== null);
    }
    catch {
        return [];
    }
}
/**
 * Read only undelivered messages for a specific recipient.
 */
export function readUndeliveredFor(mailboxPath, recipient) {
    return readMessages(mailboxPath).filter((m) => !m.delivered && m.to === recipient);
}
/**
 * Mark a specific message as delivered by rewriting the mailbox.
 * This is intentionally simple; for high throughput, use a secondary index.
 */
export function markDelivered(mailboxPath, messageId) {
    const messages = readMessages(mailboxPath);
    const target = messages.find((m) => m.id === messageId);
    if (!target)
        return false;
    target.delivered = true;
    rewriteMailbox(mailboxPath, messages);
    return true;
}
/**
 * Rewrite the entire mailbox file from an array of messages.
 */
export function rewriteMailbox(mailboxPath, messages) {
    ensureDir(mailboxPath);
    const content = messages.map((m) => JSON.stringify(m)).join('\n') + '\n';
    writeFileSync(mailboxPath, content, 'utf-8');
}
/**
 * Get the default mailbox path for a team and worker.
 */
export function getMailboxPath(teamId, workerId, cwd) {
    const base = cwd ?? process.cwd();
    return join(base, '.omk', 'team', teamId, 'mailbox', `${workerId}.jsonl`);
}
/**
 * Send a simple text message to a worker's mailbox.
 */
export function sendTextMessage(mailboxPath, from, to, body) {
    appendMessage(mailboxPath, {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        from,
        to,
        type: 'task_assignment',
        payload: { body },
        timestamp: new Date().toISOString(),
        delivered: false,
    });
}
//# sourceMappingURL=mailbox.js.map