# AER

> Status: early Phase 1. The deterministic Claude Code JSONL converter works; the
> static viewer and LLM enrichment are still placeholders.

AER turns raw agent logs into auditable, skimmable Agent Execution Records. The first
adapter targets Claude Code JSONL sessions and produces deterministic AER JSON with
tool actions, mutation detection, file rollups, hashes, and diffs.

The deterministic core has no network or LLM dependency. Optional enrichment and the
HTML viewer come later.

## Requirements

- Node.js 20+
- pnpm 9.x

Install pnpm if needed:

```sh
npm install -g pnpm@9.15.4
```

This repo uses pnpm workspaces. Published packages will be installable with npm later,
but local development should use pnpm.

## Packages

- `@aer/core` — AER v1 TypeScript types, zod schema, hashing, and unified diffs.
- `@aer/adapter-claude-code` — Claude Code JSONL to AER conversion.
- `@aer/cli` — `aer convert` command.
- `@aer/viewer` — placeholder for the Phase 2 static viewer.
- `@aer/enrich` — placeholder for the Phase 6 optional LLM enrichment package.

## Quick Start

```sh
pnpm install
pnpm aer convert examples/daily-research.jsonl -o examples/daily-research.aer.json
```

The checked-in JSONL examples are sanitized fixtures. Keep public fixtures free of
real usernames, home directories, private repository paths, tokens, and secrets.

Convert one of your local Claude Code sessions:

```sh
pnpm aer convert ~/.claude/projects/<project-dir>/<session-id>.jsonl -o examples/my-run.aer.json
```

`pnpm aer` builds the CLI and then runs the compiled command from the repo root, so
relative input and output paths are resolved from the project root.

## CLI

```sh
pnpm aer convert <input.jsonl> [-o output.aer.json] [--with-disk]
```

Options:

- `-o, --output` writes the AER JSON to a file. Parent folders are created if needed.
- `--with-disk` allows the adapter to read files from disk when the trace lacks prior
  file content for mutation diffs. Relative file paths are resolved from the source
  record's `cwd` when it is available.

Generated files matching `examples/*.aer.json` and `examples/*.aer.html` are ignored
by git.

## Current Output

Phase 1 emits:

- `run`
- a single placeholder phase named `Phase 1`
- `actions`
- `mutations`
- `filesTouched`
- `artifacts`
- `costs`
- `raw`

Phase 1 intentionally leaves these empty:

- `verification` — deterministic verification rollup lands in Phase 4.
- `claims` — LLM-derived claims land in Phase 6.
- `gates` — richer permission/approval extraction lands later.

Unknown record and tool shapes are preserved as neutral `other` actions instead of
crashing the converter.

## Development

```sh
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

Useful direct package commands:

```sh
pnpm --filter @aer/core test
pnpm --filter @aer/adapter-claude-code test
pnpm --filter @aer/cli build
```

## Roadmap

- Phase 2: static HTML viewer and drag/drop demo.
- Phase 3: CLI polish, multi-input, watch mode.
- Phase 4: heuristic phase detection and verification rollup.
- Phase 5: integrity verification.
- Phase 6: optional LLM enrichment.
