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
- `integrity`

The deterministic converter currently emits:

- `phases` inferred from action transitions such as setup, local context, research,
  implementation, verification, and wrap-up signals.
- `verification` is populated from recognized Bash test, typecheck, lint, build,
  and format commands.
- `actions[].recordHash` is `sha256` of the original source JSONL line that
  produced the action.
- `raw.sha256` is `sha256` of the complete source JSONL file.
- `integrity.aerSha256` is `sha256` of the canonical AER payload with the
  `integrity` block removed.
- `claims` is empty until optional LLM enrichment lands in Phase 6.
- `gates` is empty until richer approval extraction lands later.
