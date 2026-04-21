/**
 * Kimi Hook Handler
 * Processes UserPromptSubmit, SessionStart, and Stop events
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { createDefaultRegistry } from './keyword-registry.js';
import { injectOverlay } from './agents-overlay.js';
import { getHonestyContract } from './honesty-overlay.js';
import { validateFlags, checkGates } from '../skills/validator.js';
import { logger } from '../utils/logger.js';
import { writeAudit } from '../utils/audit.js';
import { setActiveSkill, setSkillState, cancelWorkflow, writeState } from '../state/manager.js';
const keywordRegistry = createDefaultRegistry();
function detectSkill(prompt) {
    const match = keywordRegistry.detect(prompt);
    return match ? match.skill : null;
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
        const cancelled = cancelWorkflow('Cancelled via $cancel', input.cwd);
        if (cancelled) {
            output.hookSpecificOutput = {
                hookEventName: 'UserPromptSubmit',
                skill: 'cancel',
                activated: true,
                message: `Cancelled ${cancelled.skill} workflow`,
            };
            logger.info('handler', `Cancelled ${cancelled.skill} workflow via $cancel`);
        }
        return output;
    }
    // Activate new skill — run code-enforced validation first
    const flagResult = validateFlags(skill, input.prompt, input.cwd);
    if (!flagResult.valid) {
        output.hookSpecificOutput = {
            hookEventName: 'UserPromptSubmit',
            skill,
            activated: false,
            message: `OMK: ${flagResult.message}`,
        };
        return output;
    }
    const gateResults = checkGates(skill, input.prompt, input.cwd);
    const blockedGate = gateResults.find((g) => !g.passed && g.blocking);
    if (blockedGate) {
        output.hookSpecificOutput = {
            hookEventName: 'UserPromptSubmit',
            skill,
            activated: false,
            message: `OMK Gate check failed for $${skill}: ${blockedGate.description}. Please provide more specific context.`,
        };
        logger.warn('handler', `Gate block for $${skill}`, {
            gate: blockedGate.gate,
            prompt: input.prompt,
        });
        return output;
    }
    const state = {
        skill,
        active: true,
        phase: 'starting',
        activated_at: new Date().toISOString(),
        session_id: input.session_id,
    };
    setActiveSkill(state, input.cwd);
    setSkillState(skill, state, input.cwd);
    output.hookSpecificOutput = {
        hookEventName: 'UserPromptSubmit',
        skill,
        activated: true,
        message: `OMK: ${skill} workflow activated`,
    };
    logger.info('handler', `Activated workflow $${skill}`, { session_id: input.session_id });
    return output;
}
function handleSessionStart(input) {
    const stateDir = getStateDir(input.cwd);
    // Check for active workflow
    const activeState = readState(stateDir, 'skill-active.json');
    if (activeState?.active) {
        const overlayContext = injectOverlay(activeState.skill);
        const honestyContract = getHonestyContract();
        return {
            hookSpecificOutput: {
                hookEventName: 'SessionStart',
                skill: activeState.skill,
                activated: true,
                message: `Resuming ${activeState.skill} workflow (phase: ${activeState.phase})\n${overlayContext}\n${honestyContract}`,
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
        // Update phase if needed — bypass evidence validation for Stop hook
        if (activeState.phase !== 'completing') {
            const updatedState = {
                ...activeState,
                phase: 'completing',
            };
            writeState(join(stateDir, 'skill-active.json'), updatedState);
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
    const start = Date.now();
    let success = true;
    let output = {};
    let skillName;
    let activated;
    let errorMsg;
    try {
        const input = JSON.parse(readFileSync(0, 'utf-8'));
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
        const hso = output.hookSpecificOutput;
        if (hso) {
            skillName = hso.skill;
            activated = hso.activated;
        }
        // Return output on success to Kimi
        const outStr = JSON.stringify(output);
        logger.debug('handler', `Output: ${outStr}`);
        console.log(outStr);
    }
    catch (error) {
        success = false;
        errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('handler', 'OMK Hook Error', {
            error: error instanceof Error ? error.stack : errorMsg,
        });
        // Return empty output on error (fail-open)
        console.error(`[OMK Hook Error] ${errorMsg}`);
        console.log(JSON.stringify({}));
    }
    // Write audit entry (best-effort, must not crash)
    try {
        const hso = output.hookSpecificOutput;
        writeAudit({
            timestamp: new Date().toISOString(),
            event: hso?.hookEventName ?? 'unknown',
            skill: skillName,
            activated,
            outputMessage: hso?.message,
            durationMs: Date.now() - start,
            success,
            error: errorMsg,
        });
    }
    catch {
        // Audit failures are non-blocking
    }
}
main();
//# sourceMappingURL=handler.js.map