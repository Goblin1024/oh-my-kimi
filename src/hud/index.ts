/**
 * HUD Entry Point
 *
 * Runs a continuous loop to monitor and display OMK state.
 */

import { getActiveSkill } from '../state/manager.js';
import { getTeamState } from '../team/state.js';
import { omkStateDir } from '../state/paths.js';
import { watch, existsSync, mkdirSync } from 'fs';
import {
  clearScreen,
  colors,
  drawHeader,
  drawSection,
  drawKeyValue,
  drawProgressBar,
  formatDuration,
} from './render.js';
import { loadTokenState } from '../token/persistence.js';
import { listEvidence } from '../state/evidence.js';

let isRunning = false;

function renderHUD(): void {
  clearScreen();
  drawHeader('Oh-My-Kimi (OMK) HUD');

  const state = getActiveSkill();

  drawSection('Workflow Status');
  if (!state || !state.active) {
    drawKeyValue('Status', 'IDLE', colors.dim);
    drawKeyValue('Last Skill', state?.skill || 'None');
    if (state?.phase) {
      drawKeyValue('Last Phase', state.phase);
    }
  } else {
    drawKeyValue('Status', 'ACTIVE', colors.green + colors.bold);
    drawKeyValue('Skill', state.skill, colors.yellow);
    drawKeyValue('Phase', state.phase, colors.magenta);

    if (state.activated_at) {
      const start = new Date(state.activated_at).getTime();
      const now = Date.now();
      drawKeyValue('Duration', formatDuration(now - start), colors.cyan);
    }
  }

  const teamState = getTeamState();
  if (teamState && teamState.active) {
    console.log('\n');
    drawSection('Team Status');
    drawKeyValue('Role', teamState.role, colors.yellow);
    drawKeyValue(
      'Task',
      teamState.task.substring(0, 60) + (teamState.task.length > 60 ? '...' : '')
    );

    console.log(`  ${colors.dim}Workers:${colors.reset}`);
    for (const w of teamState.workers) {
      let color = colors.yellow; // starting/running
      if (w.status === 'completed') color = colors.green;
      if (w.status === 'failed' || w.status === 'terminated') color = colors.red;

      const pidStr = w.pid ? `PID:${w.pid.toString().padEnd(6)}` : 'PID:---   ';
      console.log(
        `    [${w.id}] ${pidStr} Status: ${color}${w.status.padEnd(10)}${colors.reset} Task: ${w.task.substring(0, 40).replace(/\n/g, ' ')}...`
      );
    }
  }

  // Token Budget Panel
  if (state?.skill) {
    console.log('\n');
    drawSection('Token Budget');
    const tokenState = loadTokenState(state.skill);
    if (tokenState) {
      drawProgressBar('Budget', tokenState.used, tokenState.budget);
      drawKeyValue('Remaining', tokenState.remaining.toLocaleString(), colors.cyan);
      drawKeyValue(
        'Efficiency',
        `${tokenState.efficiency}/100`,
        tokenState.efficiency >= 70
          ? colors.green
          : tokenState.efficiency >= 40
            ? colors.yellow
            : colors.red
      );
      drawKeyValue(
        'Route',
        `${tokenState.route.reasoningEffort} / ${tokenState.route.maxTokens.toLocaleString()} tokens`
      );
    } else {
      // Fallback: show evidence count
      const evidence = listEvidence(state.skill);
      drawKeyValue('Evidence', `${evidence.length} items recorded`);
      drawKeyValue('Status', 'Run session auditor for budget details', colors.dim);
    }
  }

  console.log('\n');
  drawSection('Instructions');
  console.log(
    `  ${colors.dim}Press Ctrl+C to exit HUD. This terminal will auto-refresh.${colors.reset}`
  );
  console.log(`  ${colors.dim}OMK State is stored in .omk/state/skill-active.json${colors.reset}`);
}

export async function startHUD(): Promise<void> {
  if (!process.stdout.isTTY) {
    console.error(
      'Error: HUD requires an interactive terminal (TTY).\n' +
        'Do not pipe or redirect output when running `omk hud`.'
    );
    process.exit(1);
  }

  if (isRunning) return;
  isRunning = true;

  // Handle graceful exit
  process.on('SIGINT', () => {
    clearScreen();
    console.log(`${colors.green}HUD closed.${colors.reset}`);
    process.exit(0);
  });

  // Initial render
  renderHUD();

  // Watch state directory
  const stateDir = omkStateDir(process.cwd());
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }

  // Debounce render to avoid flickering on rapid writes
  let renderTimeout: NodeJS.Timeout | null = null;
  const scheduleRender = () => {
    if (renderTimeout) clearTimeout(renderTimeout);
    renderTimeout = setTimeout(() => {
      renderHUD();
      renderTimeout = null;
    }, 100); // 100ms debounce
  };

  try {
    watch(stateDir, (eventType, filename) => {
      if (filename && filename.endsWith('.json')) {
        scheduleRender();
      }
    });
  } catch (err) {
    console.error(`\n${colors.red}Failed to watch state directory: ${err}${colors.reset}`);
    console.log(`${colors.yellow}Falling back to polling mode...${colors.reset}`);
    setInterval(renderHUD, 2000);
  }

  // We also need a slow polling loop just to update the "Duration" timer
  setInterval(() => {
    if (!renderTimeout) {
      renderHUD();
    }
  }, 1000);

  // Keep process alive
  await new Promise(() => {});
}
