/**
 * Team CLI commands
 */

import { TeamRuntime } from '../team/runtime.js';
import { getTeamState } from '../team/state.js';

function parseCountAndRole(arg: string): { count: number; role: string } {
  // Expected format: N:role (e.g. 3:executor)
  const parts = arg.split(':');
  if (parts.length === 2) {
    const count = parseInt(parts[0], 10);
    if (!isNaN(count) && count > 0) {
      return { count, role: parts[1] };
    }
  }

  // Default fallback
  const fallbackCount = parseInt(arg, 10);
  if (!isNaN(fallbackCount) && fallbackCount > 0) {
    return { count: fallbackCount, role: 'executor' };
  }

  return { count: 2, role: 'executor' }; // sensible default
}

export async function teamCommand(args: string[]): Promise<void> {
  const subCommand = args[0];

  if (subCommand === 'status') {
    const state = getTeamState();
    if (!state) {
      console.log('No team session found.');
      return;
    }

    console.log(
      `Team Session: ${state.active ? '\x1b[32mACTIVE\x1b[0m' : '\x1b[31mINACTIVE\x1b[0m'}`
    );
    console.log(`Role: ${state.role}`);
    console.log(`Started: ${state.startedAt}`);
    if (state.finishedAt) console.log(`Finished: ${state.finishedAt}`);

    console.log('\nWorkers:');
    for (const w of state.workers) {
      let color = '\x1b[33m'; // yellow starting/running
      if (w.status === 'completed') color = '\x1b[32m'; // green
      if (w.status === 'failed' || w.status === 'terminated') color = '\x1b[31m'; // red

      console.log(
        `  [${w.id}] PID:${w.pid || '---'} Status: ${color}${w.status.padEnd(10)}\x1b[0m Task: ${w.task.substring(0, 50).replace(/\n/g, ' ')}...`
      );
    }
    return;
  }

  if (subCommand === 'shutdown') {
    const runtime = new TeamRuntime();
    await runtime.shutdownTeam();
    return;
  }

  if (subCommand === 'logs') {
    const { teamLogs } = await import('./team-logs.js');
    await teamLogs(args[1]);
    return;
  }

  // Otherwise, start a new team
  // Format: omk team 3:executor "the task string"
  if (args.length < 2) {
    console.error('Usage: omk team <N:role> "<task>"');
    console.error('   Or: omk team status');
    console.error('   Or: omk team shutdown');
    console.error('   Or: omk team logs [workerId]');
    process.exit(1);
  }

  const { count, role } = parseCountAndRole(args[0]);
  const task = args.slice(1).join(' ');

  console.log(`\x1b[36m🚀 Starting Team Session with ${count} workers (Role: ${role})\x1b[0m`);
  console.log(`Task: ${task}\n`);

  const runtime = new TeamRuntime();

  // Set mock mode if requested by env, otherwise set it explicitly to true for safety in this MVP
  if (process.env.OMK_MOCK_TEAM === undefined) {
    process.env.OMK_MOCK_TEAM = '1';
  }

  try {
    await runtime.startTeam(count, role, task);
  } catch (err: unknown) {
    console.error(`\x1b[31mError: ${err instanceof Error ? err.message : String(err)}\x1b[0m`);
    process.exit(1);
  }
}
