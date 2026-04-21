/**
 * Tests for MemPalace Bridge
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import {
  getPalacePath,
  setPalacePath,
  parseSearchOutput,
  parseStatusOutput,
  clearAvailabilityCache,
  isMemPalaceAvailable,
} from '../bridge.js';

describe('memory/bridge', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `omk-memory-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    clearAvailabilityCache();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  /* ---------------------------------------------------------------------- */
  /* Palace Path                                                            */
  /* ---------------------------------------------------------------------- */

  it('defaults palace path to .mempalace in project root', () => {
    const path = getPalacePath(testDir);
    assert.equal(path, join(testDir, '.mempalace'));
  });

  it('reads cached palace path from .omk/palace-path', () => {
    const omkDir = join(testDir, '.omk');
    mkdirSync(omkDir, { recursive: true });
    writeFileSync(join(omkDir, 'palace-path'), 'custom/palace', 'utf-8');

    const path = getPalacePath(testDir);
    assert.equal(path, join(testDir, 'custom', 'palace'));
  });

  it('caches palace path via setPalacePath', () => {
    setPalacePath('my-palace', testDir);
    const path = getPalacePath(testDir);
    assert.equal(path, join(testDir, 'my-palace'));
  });

  it('stores absolute path when outside project root', () => {
    const outside = join(tmpdir(), 'external-palace');
    setPalacePath(outside, testDir);
    const path = getPalacePath(testDir);
    assert.equal(path, outside);
  });

  /* ---------------------------------------------------------------------- */
  /* Search Parser                                                          */
  /* ---------------------------------------------------------------------- */

  it('parses search output into structured results', () => {
    const stdout = `
============================================================
  Results for: "why graphql"
============================================================

  [1] my_app / src
      Source: app.ts
      Match:  0.823

      import { graphql } from 'apollo-server';

  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n
  [2] my_app / docs
      Source: readme.md
      Match:  0.741

      We switched to GraphQL for type safety.

  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n`;

    const results = parseSearchOutput(stdout);
    assert.equal(results.length, 2);
    assert.equal(results[0].wing, 'my_app');
    assert.equal(results[0].room, 'src');
    assert.equal(results[0].source, 'app.ts');
    assert.equal(results[0].similarity, 0.823);
    assert.ok(results[0].text.includes('apollo-server'));

    assert.equal(results[1].wing, 'my_app');
    assert.equal(results[1].room, 'docs');
    assert.equal(results[1].source, 'readme.md');
    assert.equal(results[1].similarity, 0.741);
  });

  it('returns empty array for empty search output', () => {
    assert.deepEqual(parseSearchOutput(''), []);
  });

  /* ---------------------------------------------------------------------- */
  /* Status Parser                                                          */
  /* ---------------------------------------------------------------------- */

  it('parses status output into structured result', () => {
    const stdout = `
=======================================================
  MemPalace Status \u2014 42 drawers
=======================================================

  WING: my_app
    ROOM: src                 30 drawers
    ROOM: tests               12 drawers

=======================================================
`;

    const status = parseStatusOutput(stdout);
    assert.ok(status);
    assert.equal(status!.totalDrawers, 42);
    assert.equal(status!.wings.length, 1);
    assert.equal(status!.wings[0].name, 'my_app');
    assert.equal(status!.wings[0].rooms.length, 2);
    assert.equal(status!.wings[0].rooms[0].name, 'src');
    assert.equal(status!.wings[0].rooms[0].drawers, 30);
    assert.equal(status!.wings[0].rooms[1].name, 'tests');
    assert.equal(status!.wings[0].rooms[1].drawers, 12);
  });

  it('returns undefined for unrecognizable status output', () => {
    assert.equal(parseStatusOutput('some random text'), undefined);
  });

  it('handles multiple wings in status output', () => {
    const stdout = `
=======================================================
  MemPalace Status \u2014 100 drawers
=======================================================

  WING: frontend
    ROOM: components          40 drawers
    ROOM: pages               10 drawers

  WING: backend
    ROOM: api                 50 drawers

=======================================================
`;

    const status = parseStatusOutput(stdout);
    assert.ok(status);
    assert.equal(status!.totalDrawers, 100);
    assert.equal(status!.wings.length, 2);
    assert.equal(status!.wings[0].name, 'frontend');
    assert.equal(status!.wings[0].rooms.length, 2);
    assert.equal(status!.wings[1].name, 'backend');
    assert.equal(status!.wings[1].rooms.length, 1);
  });

  /* ---------------------------------------------------------------------- */
  /* Availability                                                           */
  /* ---------------------------------------------------------------------- */

  it('caches availability result', async () => {
    // First call sets cache
    const a1 = await isMemPalaceAvailable();
    // Second call should return same cached value instantly
    const a2 = await isMemPalaceAvailable();
    assert.equal(a1, a2);
  });

  it('allows clearing availability cache', async () => {
    await isMemPalaceAvailable();
    // Should not throw
    clearAvailabilityCache();
  });
});
