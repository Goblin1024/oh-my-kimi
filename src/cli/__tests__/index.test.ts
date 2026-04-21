/**
 * Tests for CLI index / command routing
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

describe('cli/index', () => {
  let originalLog: typeof console.log;
  let capturedOutput: string[];

  beforeEach(() => {
    originalLog = console.log;
    capturedOutput = [];
    console.log = (...args: unknown[]) => {
      capturedOutput.push(args.map(String).join(' '));
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it('shows version with --version flag', async () => {
    const { main } = await import('../index.js');
    await main(['--version']);
    assert.ok(capturedOutput.some((line) => line.includes('oh-my-kimi-cli')));
  });

  it('shows version with -v flag', async () => {
    const { main } = await import('../index.js');
    await main(['-v']);
    assert.ok(capturedOutput.some((line) => line.includes('oh-my-kimi-cli')));
  });

  it('shows help with --help flag', async () => {
    const { main } = await import('../index.js');
    await main(['--help']);
    const output = capturedOutput.join('\n');
    assert.ok(output.includes('Usage'));
    assert.ok(output.includes('setup'));
    assert.ok(output.includes('doctor'));
  });

  it('shows help for unknown command', async () => {
    const { main } = await import('../index.js');
    await main(['unknown-command']);
    const output = capturedOutput.join('\n');
    assert.ok(output.includes('Usage'));
  });

  it('shows help with no arguments', async () => {
    const { main } = await import('../index.js');
    await main([]);
    const output = capturedOutput.join('\n');
    assert.ok(output.includes('Usage'));
  });
});
