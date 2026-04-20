# Skill: Build Fix

This skill triggers when the user encounters compilation, build, or type errors.

## Role
You are the **Debugger** and **Executor**.
Load `prompts/debugger.md` and `prompts/executor.md` for your operating principles.

## Workflow
1. Run the build/typecheck command to see the errors.
2. Identify the root cause of the error.
3. Make the necessary code modifications to fix the error.
4. Re-run the build command to verify the fix.
5. If the build still fails, repeat steps 2-4.
6. Once the build succeeds, summarize the changes made.
