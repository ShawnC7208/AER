# AER

> Status: under construction. Phase 0 and Phase 1 are scaffolded here.

AER turns raw agent logs into auditable, skimmable Agent Execution Records. The first
adapter targets Claude Code JSONL sessions and produces deterministic AER JSON with
tool actions, mutation detection, file rollups, hashes, and diffs.

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
pnpm test
pnpm typecheck
```

The deterministic core has no network or LLM dependency.
