#!/usr/bin/env node
/**
 * oh-my-kimi CLI
 * Workflow orchestration layer for Kimi Code CLI
 */

export async function main(args: string[]): Promise<void> {
  const command = args[0];

  if (command === 'setup') {
    const { setup } = await import('./setup.js');
    await setup();
  } else if (command === 'doctor') {
    const { doctor } = await import('./doctor.js');
    await doctor();
  } else if (command === 'mcp') {
    const serverType = args[1];
    if (serverType === 'state') {
      const { runStateServer } = await import('../mcp/state-server.js');
      await runStateServer();
    } else if (serverType === 'memory') {
      const { runMemoryServer } = await import('../mcp/memory-server.js');
      await runMemoryServer();
    } else {
      console.error(`Unknown MCP server type: ${serverType}`);
      console.error(`Usage: omk mcp <state|memory>`);
      process.exit(1);
    }
  } else if (command === 'hud') {
    const { startHUD } = await import('../hud/index.js');
    await startHUD();
  } else if (command === 'explore') {
    const { explore } = await import('./explore.js');
    await explore(args.slice(1));
  } else if (command === 'team') {
    const { teamCommand } = await import('./team.js');
    await teamCommand(args.slice(1));
  } else if (command === '--version' || command === '-v') {
    console.log('oh-my-kimi v0.5.0');
  } else {
    showHelp();
  }
}

function showHelp(): void {
  console.log(`
oh-my-kimi (OMK) - Workflow orchestration for Kimi Code CLI

Usage:
  omk <command>

Commands:
  setup         Install OMK skills and configure Kimi hooks
  doctor        Check if OMK is correctly installed and configured
  mcp <type>    Start an MCP server (types: state, memory)
  hud           Start the Heads-Up Display (Live Dashboard)
  explore       Search the codebase (omk explore <query> [--regex])
  team          Manage multi-agent parallel execution
  --version, -v Show version
  --help, -h    Show this help

Workflow Keywords (use in Kimi CLI):
  $deep-interview  Clarify requirements through Socratic questioning
  $ralplan         Create and approve architecture plans
  $ralph           Persistence loop to completion
  $team N          Launch N parallel subagents
  $cancel          Stop active workflow

Examples:
  omk setup                    # Install OMK
  omk hud                      # Start the live dashboard
  omk explore "auth"           # Search codebase for "auth"
  omk team 3:executor "task"   # Start 3 parallel agents
  
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
