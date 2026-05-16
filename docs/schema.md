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

The deterministic converter currently emits:

- `phases` inferred from action transitions such as setup, local context, research,
  implementation, verification, and wrap-up signals.
- `verification` is populated from recognized Bash test, typecheck, lint, build,
  and format commands.
- `claims` is empty until optional LLM enrichment lands in Phase 6.
- `gates` is empty until richer approval extraction lands later.
