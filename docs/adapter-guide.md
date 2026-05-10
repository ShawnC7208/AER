# Adapter Guide

Adapters convert source-specific logs into the shared AER v1 shape.

Rules:

- Preserve unknown source records.
- Classify unknown tools as `other`.
- Default unknown tools to non-mutating.
- Never branch on inferred run type.
- Populate sections with available data and leave unavailable sections empty.

For local testing, run:

```sh
pnpm aer convert examples/daily-research.jsonl -o examples/daily-research.aer.json
pnpm --filter @aer/adapter-claude-code test
```
