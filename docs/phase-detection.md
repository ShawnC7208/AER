# Phase Detection and Verification

AER phase detection is deterministic and local. It does not use an LLM, does not
infer run type, and does not call the network.

## Phase Boundaries

The Claude Code adapter starts a new phase when a stable signal appears:

- the dominant action category changes, such as local context to synthesize
- a verification command follows implementation work
- mutation actions form an implementation cluster
- an assistant text report action appears
- at least 30 seconds pass between consecutive actions

Phase names are generic and deterministic:

- `Setup`
- `Local context`
- `Research`
- `Synthesize`
- `Verify`
- `Report`

The optional `why` field records the deterministic boundary reason, such as a
tool-kind transition or time gap.

## Verification Rollup

Verification checks are derived from recognized `Bash` commands. Unknown commands
stay in `actions[]` and do not produce verification rows.

Recognized checks include:

- `test`: `pnpm test`, `npm test`, `yarn test`, `jest`, `vitest`, `pytest`,
  `cargo test`, `go test`, `mocha`, `rspec`
- `typecheck`: `tsc`, `pnpm typecheck`, `npm run typecheck`, `mypy`, `pyright`,
  `pyre`
- `lint`: `pnpm lint`, `eslint`, `biome check`, `biome lint`, `ruff`, `pylint`,
  `clippy`, `golangci-lint`
- `build`: `pnpm build`, `npm run build`, `yarn build`, `cargo build`, `tsc -b`,
  `make`, `bazel build`
- `format`: `prettier`, `biome format`, `black`, `gofmt`, `rustfmt`

Same-kind verification invocations with the same normalized command are grouped
into one check until a report action appears, even when edits happen between
attempts. If the final attempt passes after an earlier failure, the check outcome
is `recovered`. False negatives are preferred over false positives: commands that
are not clearly verification-related are left alone.
