# Skill: Team Mode

## trigger
`$team`

## handler
The `$team` keyword triggers the **OMK Team Runtime**. It allows you to split a complex task and execute it in parallel using multiple agent workers.

When you see `$team` followed by a number and an optional role (e.g. `$team 3:executor`), you MUST:
1. Immediately acknowledge the command.
2. Instruct the user to run the corresponding `omk team` CLI command.

For example, if the user says:
`$team 3:qa-tester "write test cases for the auth module"`

You should respond:
"Team mode activated. To start the parallel workers, please run the following command in your terminal:
\`omk team 3:qa-tester \"write test cases for the auth module\"\`"

## internal_state
When the user executes the `omk` command, OMK will spawn multiple child processes and assign them their portions of the task. Wait until the user reports the collected outputs from the team back to you before proceeding.
