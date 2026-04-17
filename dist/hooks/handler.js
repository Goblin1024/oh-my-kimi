/**
 * Kimi Hook Handler
 * Processes UserPromptSubmit, SessionStart, and Stop events
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
// Workflow keywords mapping
const KEYWORDS = {
    'deep-interview': /\$deep-interview/,
    ralplan: /\$ralplan/,
    ralph: /\$ralph/,
    cancel: /\$cancel/,
    team: /\$team/,
};
function detectSkill(prompt) {
    for (const [skill, pattern] of Object.entries(KEYWORDS)) {
        if (pattern.test(prompt)) {
            return skill;
        }
    }
    return null;
}
function getStateDir(cwd) {
    return join(cwd, '.omk', 'state');
}
function readState(stateDir, filename) {
    try {
        const content = readFileSync(join(stateDir, filename), 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
function writeState(stateDir, filename, state) {
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(join(stateDir, filename), JSON.stringify(state, null, 2));
}
function handleUserPromptSubmit(input) {
    const output = {
        hookSpecificOutput: {
            hookEventName: 'UserPromptSubmit',
        },
    };
    if (!input.prompt) {
        return output;
    }
    const skill = detectSkill(input.prompt);
    if (!skill) {
        return output;
    }
    // Handle cancel
    if (skill === 'cancel') {
        const stateDir = getStateDir(input.cwd);
        const currentState = readState(stateDir, 'skill-active.json');
        if (currentState?.active) {
            writeState(stateDir, 'skill-active.json', {
                ...currentState,
                active: false,
                phase: 'cancelled',
                cancelled_at: new Date().toISOString(),
            });
            output.hookSpecificOutput = {
                hookEventName: 'UserPromptSubmit',
                skill: 'cancel',
                activated: true,
                message: `Cancelled ${currentState.skill} workflow`,
            };
        }
        return output;
    }
    // Activate new skill
    const stateDir = getStateDir(input.cwd);
    const state = {
        skill,
        active: true,
        phase: 'starting',
        activated_at: new Date().toISOString(),
        session_id: input.session_id,
    };
    writeState(stateDir, 'skill-active.json', state);
    writeState(stateDir, `${skill}-state.json`, state);
    output.hookSpecificOutput = {
        hookEventName: 'UserPromptSubmit',
        skill,
        activated: true,
        message: `OMK: ${skill} workflow activated`,
    };
    return output;
}
function handleSessionStart(input) {
    const stateDir = getStateDir(input.cwd);
    // Check for active workflow
    const activeState = readState(stateDir, 'skill-active.json');
    if (activeState?.active) {
        return {
            hookSpecificOutput: {
                hookEventName: 'SessionStart',
                skill: activeState.skill,
                activated: true,
                message: `Resuming ${activeState.skill} workflow (phase: ${activeState.phase})`,
            },
        };
    }
    return {
        hookSpecificOutput: {
            hookEventName: 'SessionStart',
            message: 'No active workflow',
        },
    };
}
function handleStop(input) {
    const stateDir = getStateDir(input.cwd);
    const activeState = readState(stateDir, 'skill-active.json');
    // If workflow is active, block stop until complete
    if (activeState?.active) {
        // Update phase if needed
        if (activeState.phase !== 'completing') {
            writeState(stateDir, 'skill-active.json', {
                ...activeState,
                phase: 'completing',
            });
        }
        return {
            hookSpecificOutput: {
                hookEventName: 'Stop',
                skill: activeState.skill,
                activated: true,
                message: `${activeState.skill} is active. Complete or use $cancel to stop.`,
            },
        };
    }
    return {
        hookSpecificOutput: {
            hookEventName: 'Stop',
            message: 'No active workflow',
        },
    };
}
// Main entry point
function main() {
    try {
        const input = JSON.parse(readFileSync(0, 'utf-8'));
        let output = {};
        switch (input.hook_event_name) {
            case 'UserPromptSubmit':
                output = handleUserPromptSubmit(input);
                break;
            case 'SessionStart':
                output = handleSessionStart(input);
                break;
            case 'Stop':
                output = handleStop(input);
                break;
            default:
                output = {
                    hookSpecificOutput: {
                        hookEventName: input.hook_event_name,
                    },
                };
        }
        console.log(JSON.stringify(output));
    }
    catch (error) {
        console.error('OMK Hook Error:', error);
        // Return empty output on error (fail-open)
        console.log(JSON.stringify({}));
    }
}
main();
//# sourceMappingURL=handler.js.map