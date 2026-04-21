/**
 * Tests for Slot Manager
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { getMaxRunningTasks, SlotManager } from '../slot-manager.js';

describe('team/slot-manager', () => {
  let configPath: string;

  beforeEach(() => {
    configPath = join(tmpdir(), `omk-config-${Date.now()}.toml`);
  });

  afterEach(() => {
    if (existsSync(configPath)) rmSync(configPath);
  });

  describe('getMaxRunningTasks', () => {
    it('returns default when file does not exist', () => {
      assert.equal(getMaxRunningTasks('/nonexistent/path'), 4);
    });

    it('parses max_running_tasks from config', () => {
      writeFileSync(configPath, '[background]\nmax_running_tasks = 8\n', 'utf-8');
      assert.equal(getMaxRunningTasks(configPath), 8);
    });

    it('returns default when key is missing', () => {
      writeFileSync(configPath, '[background]\nread_max_bytes = 30000\n', 'utf-8');
      assert.equal(getMaxRunningTasks(configPath), 4);
    });

    it('ignores invalid values', () => {
      writeFileSync(configPath, '[background]\nmax_running_tasks = -1\n', 'utf-8');
      assert.equal(getMaxRunningTasks(configPath), 4);
    });
  });

  describe('SlotManager', () => {
    it('initializes with default capacity', () => {
      const sm = new SlotManager();
      assert.equal(sm.capacity(), 4);
      assert.equal(sm.used(), 0);
      assert.equal(sm.available(), 4);
    });

    it('initializes with custom capacity', () => {
      const sm = new SlotManager(8);
      assert.equal(sm.capacity(), 8);
      assert.equal(sm.available(), 8);
    });

    it('acquires slots up to capacity', () => {
      const sm = new SlotManager(2);
      assert.ok(sm.acquire());
      assert.ok(sm.acquire());
      assert.ok(!sm.acquire());
      assert.equal(sm.used(), 2);
    });

    it('releases slots', () => {
      const sm = new SlotManager(2);
      sm.acquire();
      sm.acquire();
      sm.release();
      assert.equal(sm.used(), 1);
      assert.equal(sm.available(), 1);
    });

    it('does not go negative on release', () => {
      const sm = new SlotManager(2);
      sm.release();
      sm.release();
      assert.equal(sm.used(), 0);
    });

    it('reports availability correctly', () => {
      const sm = new SlotManager(1);
      assert.ok(sm.hasAvailability());
      sm.acquire();
      assert.ok(!sm.hasAvailability());
    });

    it('resets to zero', () => {
      const sm = new SlotManager(4);
      sm.acquire();
      sm.acquire();
      sm.reset();
      assert.equal(sm.used(), 0);
      assert.equal(sm.available(), 4);
    });
  });
});
