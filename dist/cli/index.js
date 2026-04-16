#!/usr/bin/env node
/**
 * oh-my-kimi CLI
 * Workflow orchestration layer for Kimi Code CLI
 */
import { setup } from './setup.js';
import { doctor } from './doctor.js';
export async function main(args) {
    const command = args[0];
    switch (command) {
        case 'setup':
            await setup();
            break;
        case 'doctor':
            await doctor();
            break;
        case '--version':
        case '-v':
            console.log('oh-my-kimi v0.1.0');
            break;
        case '--help':
        case '-h':
        default:
            showHelp();
            break;
    }
}
function showHelp() {
    console.log(`
oh-my-kimi (OMK) - Workflow orchestration for Kimi Code CLI

Usage:
  omk <command>

Commands:
  setup      Install OMK skills and configure Kimi hooks
  doctor     Check OMK installation and configuration
  --version  Show version
  --help     Show this help

Workflow Keywords (use in Kimi CLI):
  $deep-interview  Clarify requirements through Socratic questioning
  $ralplan         Create and approve architecture plans
  $ralph           Persistence loop to completion
  $team N          Launch N parallel subagents
  $cancel          Stop active workflow

Examples:
  omk setup                    # Install OMK
  omk doctor                   # Check installation
  
  # In Kimi CLI:
  $deep-interview "I need a feature"
  $ralplan "implement authentication"
  $ralph "build the approved system"
  $team 3 "refactor codebase"
`);
}
// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main(process.argv.slice(2));
}
//# sourceMappingURL=index.js.map