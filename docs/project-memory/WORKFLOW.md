# Continue and resume workflow

## Starting or resuming

1. Read project AGENTS.md, CURRENT.md and DECISIONS.md.
2. Inspect the actual files relevant to the next task. Use `rtk` for shell commands and `rg` for searches, as required by the workspace instructions.
3. Check repository state if Git exists; do not assume it does or initialize it just for this workflow.
4. Check for existing build/dev processes before starting replacements. Do not stop another session's process.
5. Compare the checkpoint with current evidence. Preserve newer changes and update stale entries.
6. Select the smallest unfinished piece that advances the user's accepted scope. Continue independent work while awaiting a genuinely missing input.
7. Consult graph.json for affected boundaries; use source as the authority for actual dependencies.

## During work

- Keep implementation and verification status separate.
- Use installed skills when their scope applies; follow TOOLS.md for capability gaps.
- Record decisions that change product behavior. Do not turn routine implementation choices into approval gates.
- Validate financial formulas, access controls and concurrency with meaningful tests.
- Keep side conversations limited to their active requests; do not resume main-thread work from inherited plans.
- Do not spawn agents unless currently authorized by the user or applicable instructions.

## Project commands

Run from the OmniScale root when application validation is authorized:

```bash
rtk npm run lint
rtk npm run typecheck
rtk npm test
rtk npm run build
rtk npm run test:e2e
```

These scripts exist in the manifests. Their existence does not mean they currently pass or that test files/configuration have been implemented. Use the actual package-manager lockfile and inspect before installing or updating dependencies.

## Updating memory

After a meaningful milestone, and before a handoff:

1. Read the latest CURRENT.md again to avoid overwriting concurrent changes.
2. Record completed behavior, changed paths, exact checks and outcomes, remaining failures, and external prerequisites.
3. Update graph node states and dependency edges; remove resolved missing-path entries.
4. Add accepted scope changes to DECISIONS.md and mark replaced choices as superseded.
5. Keep CURRENT concise and actionable; retain the latest verification evidence and next concrete step.
6. Update the diagram in README when feature boundaries change.

Never store secrets, bearer links, customer submissions, or raw private service output in memory.

## Completion criteria

- **Authored:** files exist.
- **Verified:** relevant checks succeeded against the current source; record what was and was not exercised.
- **Configured:** required service configuration is present and tested without exposing credentials.
- **Deployed:** a deployment returned success and the deployed behavior was checked as appropriate.
- **Complete:** the requested behavior and required verification are finished; no mandatory prerequisite remains.

## Handoff template

```text
Checkpoint date:
Current stage:
Latest completed behavior:
Changed files:
Checks actually run and results:
Remaining gaps / external inputs:
Next concrete action:
Active process and owner, if any:
New or superseded decisions:
```

This workflow is instruction-driven. No automatic watcher, scheduled background task, or external memory persistence has been installed.
