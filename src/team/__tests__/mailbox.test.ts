/**
 * Tests for Mailbox
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  appendMessage,
  readMessages,
  readUndeliveredFor,
  markDelivered,
  rewriteMailbox,
  getMailboxPath,
  sendTextMessage,
} from '../mailbox.js';
import { appendFileSync } from 'fs';
import type { MailboxMessage } from '../mailbox.js';

describe('team/mailbox', () => {
  let testDir: string;
  let mailboxPath: string;

  beforeEach(() => {
    testDir = join(
      tmpdir(),
      `omk-mailbox-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(testDir, { recursive: true });
    mailboxPath = join(testDir, 'test.jsonl');
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  function makeMessage(id: string, to: string, delivered = false): MailboxMessage {
    return {
      id,
      from: 'leader',
      to,
      type: 'task_assignment',
      payload: { test: true },
      timestamp: new Date().toISOString(),
      delivered,
    };
  }

  describe('appendMessage / readMessages', () => {
    it('appends and reads messages', () => {
      appendMessage(mailboxPath, makeMessage('m1', 'w1'));
      appendMessage(mailboxPath, makeMessage('m2', 'w2'));

      const messages = readMessages(mailboxPath);
      assert.equal(messages.length, 2);
      assert.equal(messages[0].id, 'm1');
      assert.equal(messages[1].id, 'm2');
    });

    it('returns empty for non-existent mailbox', () => {
      const messages = readMessages(join(testDir, 'missing.jsonl'));
      assert.equal(messages.length, 0);
    });

    it('ignores corrupt lines', () => {
      appendMessage(mailboxPath, makeMessage('m1', 'w1'));
      appendFileSync(mailboxPath, 'not valid json\n', 'utf-8');
      appendMessage(mailboxPath, makeMessage('m2', 'w2'));

      const messages = readMessages(mailboxPath);
      assert.equal(messages.length, 2);
    });
  });

  describe('readUndeliveredFor', () => {
    it('filters by recipient and delivery status', () => {
      appendMessage(mailboxPath, makeMessage('m1', 'w1', false));
      appendMessage(mailboxPath, makeMessage('m2', 'w1', true));
      appendMessage(mailboxPath, makeMessage('m3', 'w2', false));

      const undelivered = readUndeliveredFor(mailboxPath, 'w1');
      assert.equal(undelivered.length, 1);
      assert.equal(undelivered[0].id, 'm1');
    });
  });

  describe('markDelivered', () => {
    it('marks a message as delivered', () => {
      appendMessage(mailboxPath, makeMessage('m1', 'w1', false));
      const ok = markDelivered(mailboxPath, 'm1');
      assert.equal(ok, true);

      const messages = readMessages(mailboxPath);
      assert.equal(messages[0].delivered, true);
    });

    it('returns false for unknown message', () => {
      const ok = markDelivered(mailboxPath, 'unknown');
      assert.equal(ok, false);
    });
  });

  describe('rewriteMailbox', () => {
    it('replaces all messages', () => {
      appendMessage(mailboxPath, makeMessage('m1', 'w1'));
      rewriteMailbox(mailboxPath, [makeMessage('m2', 'w2')]);

      const messages = readMessages(mailboxPath);
      assert.equal(messages.length, 1);
      assert.equal(messages[0].id, 'm2');
    });
  });

  describe('getMailboxPath', () => {
    it('returns correct path structure', () => {
      const path = getMailboxPath('alpha', 'worker-1', '/tmp/proj');
      assert.ok(path.includes('.omk'));
      assert.ok(path.includes('team'));
      assert.ok(path.includes('alpha'));
      assert.ok(path.includes('mailbox'));
      assert.ok(path.includes('worker-1.jsonl'));
    });
  });

  describe('sendTextMessage', () => {
    it('sends a simple text message', () => {
      sendTextMessage(mailboxPath, 'leader', 'w1', 'do the thing');
      const messages = readMessages(mailboxPath);
      assert.equal(messages.length, 1);
      assert.equal(messages[0].type, 'task_assignment');
      assert.equal((messages[0].payload as any).body, 'do the thing');
    });
  });
});
