/**
 * HUD Entry Point
 *
 * Runs a continuous loop to monitor and display OMK state.
 */
import { getActiveSkill } from '../state/manager.js';
import { clearScreen, colors, drawHeader, drawSection, drawKeyValue, formatDuration, } from './render.js';
let isRunning = false;
function renderHUD() {
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
    }
    else {
        drawKeyValue('Status', 'ACTIVE', colors.green + colors.bold);
        drawKeyValue('Skill', state.skill, colors.yellow);
        drawKeyValue('Phase', state.phase, colors.magenta);
        if (state.activated_at) {
            const start = new Date(state.activated_at).getTime();
            const now = Date.now();
            drawKeyValue('Duration', formatDuration(now - start), colors.cyan);
        }
    }
    console.log('\n');
    drawSection('Instructions');
    console.log(`  ${colors.dim}Press Ctrl+C to exit HUD. This terminal will auto-refresh.${colors.reset}`);
    console.log(`  ${colors.dim}OMK State is stored in .omk/state/skill-active.json${colors.reset}`);
}
export async function startHUD() {
    if (!process.stdout.isTTY) {
        console.error('Error: HUD requires an interactive terminal (TTY).\n' +
            'Do not pipe or redirect output when running `omk hud`.');
        process.exit(1);
    }
    if (isRunning)
        return;
    isRunning = true;
    // Handle graceful exit
    process.on('SIGINT', () => {
        clearScreen();
        console.log(`${colors.green}HUD closed.${colors.reset}`);
        process.exit(0);
    });
    // Initial render
    renderHUD();
    // Poll every 2 seconds (reduced from 1s to avoid flicker on slow terminals)
    setInterval(() => {
        renderHUD();
    }, 2000);
    // Keep process alive
    await new Promise(() => { });
}
//# sourceMappingURL=index.js.map