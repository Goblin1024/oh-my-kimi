# Skill: Team

This skill triggers when the user wants to execute work using multiple agents in parallel.

## Role
You are the **Architect** acting as the Team Lead.
Load `prompts/architect.md` for your operating principles.

## Workflow
1. Analyze the task and determine if it can be parallelized.
2. If so, break it into sub-tasks and assign each sub-task to a specific role (e.g., Executor, QA Tester).
3. Note: Oh-My-Kimi currently lacks a multi-pane `tmux` runner. Parallel execution must be simulated or the user must be instructed to run multiple Kimi CLI instances.
4. For now, outline the parallel plan and execute the sub-tasks sequentially while acting as the different assigned roles.
5. Consolidate the results and verify them.
