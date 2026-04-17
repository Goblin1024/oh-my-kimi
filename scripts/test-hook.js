#!/usr/bin/env node
/**
 * Test hook handler with sample input
 * Usage: node scripts/test-hook.js
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';

const OMK_SKILLS_DIR = join(homedir(), '.kimi', 'skills', 'omk');
const HANDLER_PATH = join(OMK_SKILLS_DIR, 'handler.js');

// Test cases
const testCases = [
  {
    name: 'UserPromptSubmit with $deep-interview',
    input: {
      hook_event_name: 'UserPromptSubmit',
      prompt: '$deep-interview "I need a feature"',
      cwd: process.cwd(),
      session_id: 'test-session-123',
    },
  },
  {
    name: 'UserPromptSubmit with $ralph',
    input: {
      hook_event_name: 'UserPromptSubmit',
      prompt: '$ralph "fix the bug"',
      cwd: process.cwd(),
      session_id: 'test-session-123',
    },
  },
  {
    name: 'UserPromptSubmit with $cancel',
    input: {
      hook_event_name: 'UserPromptSubmit',
      prompt: '$cancel',
      cwd: process.cwd(),
      session_id: 'test-session-123',
    },
  },
  {
    name: 'SessionStart',
    input: {
      hook_event_name: 'SessionStart',
      source: 'startup',
      cwd: process.cwd(),
      session_id: 'test-session-123',
    },
  },
  {
    name: 'Stop',
    input: {
      hook_event_name: 'Stop',
      cwd: process.cwd(),
      session_id: 'test-session-123',
    },
  },
];

console.log('OMK Hook Handler Test\n');
console.log('='.repeat(60));
console.log(`Handler path: ${HANDLER_PATH}\n`);

// Check if handler exists
import { existsSync } from 'fs';
if (!existsSync(HANDLER_PATH)) {
  console.error('❌ Hook handler not found!');
  console.error('   Run "omk setup" first.');
  process.exit(1);
}

async function runTest(testCase) {
  console.log(`\nTest: ${testCase.name}`);
  console.log('-'.repeat(60));
  console.log('Input:', JSON.stringify(testCase.input, null, 2));
  console.log('');

  return new Promise((resolve) => {
    const child = spawn('node', [HANDLER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      console.log('Output:');

      if (stderr) {
        console.log('  stderr:', stderr.trim());
      }

      if (stdout) {
        try {
          const output = JSON.parse(stdout.trim());
          console.log('  stdout (parsed):', JSON.stringify(output, null, 2));

          // Validate output structure
          if (output.hookSpecificOutput) {
            console.log('  ✓ Valid output structure');
            if (output.hookSpecificOutput.skill) {
              console.log(`  ✓ Detected skill: ${output.hookSpecificOutput.skill}`);
            }
            if (output.hookSpecificOutput.activated) {
              console.log(`  ✓ Skill activated: ${output.hookSpecificOutput.activated}`);
            }
          } else {
            console.log('  ℹ No hookSpecificOutput (may be expected for non-matching input)');
          }
        } catch (_e) {
          console.log('  stdout (raw):', stdout.trim());
          console.log('  ✗ Failed to parse JSON output');
        }
      } else {
        console.log('  (no output)');
      }

      console.log(`  Exit code: ${code}`);
      resolve();
    });

    // Send input
    child.stdin.write(JSON.stringify(testCase.input));
    child.stdin.end();
  });
}

async function main() {
  for (const testCase of testCases) {
    await runTest(testCase);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ All tests completed!');
  console.log('\nCheck the output above to verify:');
  console.log('  1. JSON output is valid');
  console.log('  2. Skills are correctly detected');
  console.log('  3. State files are created in .omk/state/');
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
