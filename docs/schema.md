# AER v1 Schema

AER v1 is defined in `packages/core/src/types.ts` and validated by
`packages/core/src/schema.ts`.

The top-level fields are:

- `version`
- `run`
- `phases`
- `actions`
- `mutations`
- `filesTouched`
- `verification`
- `claims`
- `gates`
- `artifacts`
- `costs`
- `raw`

Phase 1 emits deterministic records only. `claims` stays empty until optional LLM
enrichment lands in a later phase.
