# AER

> Status: Phase 2 implemented. The deterministic Claude Code JSONL converter,
> CLI viewer, and offline static demo can render local AER records.

AER turns raw agent logs into auditable, skimmable Agent Execution Records. The first
adapter targets Claude Code JSONL sessions and produces deterministic AER JSON with
tool actions, mutation detection, file rollups, hashes, and diffs.

The deterministic core and static viewer have no network or LLM dependency. Optional
enrichment comes later.

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
- `@aer/cli` — `aer convert` and `aer view` commands.
- `@aer/viewer` — deterministic, self-contained HTML renderer and browser demo bundle.
- `@aer/enrich` — placeholder for the Phase 6 optional LLM enrichment package.

## Quick Start

```sh
pnpm install
pnpm aer convert examples/daily-research.jsonl -o examples/daily-research.aer.json
pnpm aer view examples/daily-research.jsonl -o examples/daily-research.aer.html
```

The checked-in JSONL examples are sanitized fixtures. Keep public fixtures free of
real usernames, home directories, private repository paths, tokens, and secrets.

Convert one of your local Claude Code sessions:

```sh
pnpm aer convert ~/.claude/projects/<project-dir>/<session-id>.jsonl -o examples/my-run.aer.json
pnpm aer view ~/.claude/projects/<project-dir>/<session-id>.jsonl -o examples/my-run.aer.html
```

`pnpm aer` builds the CLI and then runs the compiled command from the repo root, so
relative input and output paths are resolved from the project root.

## CLI

```sh
pnpm aer convert <input.jsonl> [-o output.aer.json] [--with-disk]
pnpm aer view <input.jsonl|input.aer.json> [-o output.html] [--open]
```

Options:

- `-o, --output` writes the AER JSON to a file. Parent folders are created if needed.
- `--with-disk` allows the adapter to read files from disk when the trace lacks prior
  file content for mutation diffs. Relative file paths are resolved from the source
  record's `cwd` when it is available.
- `aer view` renders a self-contained static HTML file. JSONL inputs are converted
  first; `.aer.json` inputs are parsed and rendered directly.
- `--open` opens the rendered HTML in the system browser.

Generated files matching `examples/*.aer.json`, `examples/*.aer.html`, and
`examples/dist/` are ignored by git. The GitHub Pages workflow rebuilds the browser
bundle from source before publishing `examples/`.

## Current Output

AER v1 currently emits:

- `run`
- deterministic `phases` inferred from setup, local context, implementation,
  verification-like actions, git activity, and wrap-up signals
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
crashing the converter. The static viewer renders only sections with data, groups
long action runs behind progressive disclosure, highlights mutations, and includes a
raw action timeline for deeper inspection.

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
pnpm --filter @aer/viewer build:web
```

## Roadmap

- Phase 2: static HTML viewer and drag/drop demo. Implemented.
- Phase 3: CLI polish, multi-input, watch mode.
- Phase 4: heuristic phase detection and verification rollup.
- Phase 5: integrity verification.
- Phase 6: optional LLM enrichment.
