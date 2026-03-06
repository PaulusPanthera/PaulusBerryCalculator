# Workflow notes

## Core principle

Keep the project boring in the best way:

- easy to reopen after weeks away
- easy to test locally
- easy to push
- easy to publish as static files
- easy to understand file-by-file

## Suggested branch style

For a simple solo project, keep it light:

- `main` for stable work
- optional short-lived feature branches only for risky changes

Examples:

- `feature/profit-table`
- `feature/seed-inputs`
- `fix/mobile-spacing`

## Commit style

Use small, specific commits.

Examples:

- `feat: add berry search input`
- `feat: add profit calculation helper`
- `fix: prevent empty data crash`
- `style: tighten card spacing`
- `docs: add data contract notes`
- `chore: prepare v0.2.0`

## Data contract idea

Keep raw data simple at first.

Suggested future fields:

- `name`
- `seedCost`
- `yieldMin`
- `yieldMax`
- `growthHours`
- `marketPrice`
- `npcSellPrice`
- `notes`

## Rule of thumb

When a file starts doing too many jobs, split it.
When a folder has only one unclear dump-file, organize it.
When a workflow step is repeated often, script it.
