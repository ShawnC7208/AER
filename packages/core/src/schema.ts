import { z } from "zod";
import type { AER } from "./types.js";

const actionKindSchema = z.enum(["read", "search", "mutate", "report", "meta", "other"]);
const claimFlagSchema = z.enum([
  "single-source",
  "absence-of-evidence",
  "judgment-from-prior",
  "unsourced",
]);

export const runSchema = z.object({
  id: z.string(),
  source: z.enum(["claude-code", "langchain", "openai-agents", "generic"]),
  goal: z.string(),
  goalSource: z.enum(["verbatim", "llm"]),
  mode: z.enum(["interactive", "autonomous", "scheduled"]),
  trigger: z.string().optional(),
  model: z.string().optional(),
  startedAt: z.string(),
  endedAt: z.string(),
  outcome: z.enum(["completed", "failed", "partial", "abandoned"]),
  outcomeReason: z.string().optional(),
  recordCount: z.number().int().nonnegative(),
});

export const phaseSchema = z.object({
  id: z.string(),
  index: z.number().int().nonnegative(),
  name: z.string(),
  nameSource: z.enum(["generic", "llm"]),
  why: z.string().optional(),
  startedAt: z.string(),
  endedAt: z.string(),
  durationMs: z.number().int().nonnegative(),
  actionIds: z.array(z.string()),
  recordRange: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]),
});

export const actionSchema = z.object({
  id: z.string(),
  recordIndex: z.number().int().nonnegative(),
  ts: z.string(),
  kind: actionKindSchema,
  toolName: z.string(),
  mutates: z.boolean(),
  target: z.string().optional(),
  inputSummary: z.string(),
  outputSummary: z.string().optional(),
  phaseId: z.string(),
  errored: z.boolean(),
});

export const mutationSchema = z.object({
  id: z.string(),
  actionId: z.string(),
  kind: z.enum(["write", "edit", "delete", "bash-mutating", "external"]),
  target: z.string(),
  beforeHash: z.string().optional(),
  afterHash: z.string().optional(),
  beforeBytes: z.number().int().nonnegative().optional(),
  afterBytes: z.number().int().nonnegative().optional(),
  diff: z.string().optional(),
  diffStats: z.object({ added: z.number().int(), removed: z.number().int() }).optional(),
  gateFired: z.boolean(),
  gateRef: z.string().optional(),
  semanticLabel: z.string().optional(),
});

export const fileTouchedSchema = z.object({
  path: z.string(),
  status: z.enum(["new", "modified", "deleted"]),
  linesAdded: z.number().int().nonnegative(),
  linesRemoved: z.number().int().nonnegative(),
  mutationIds: z.array(z.string()),
  finalHash: z.string().optional(),
  finalBytes: z.number().int().nonnegative().optional(),
});

export const verificationCheckSchema = z.object({
  id: z.string(),
  kind: z.enum(["test", "typecheck", "lint", "build", "format", "other"]),
  command: z.string(),
  outcome: z.enum(["passed", "failed", "recovered"]),
  detail: z.string().optional(),
  attempts: z.array(z.object({ actionId: z.string(), outcome: z.enum(["passed", "failed"]) })),
  finalActionId: z.string(),
});

export const claimSchema = z.object({
  id: z.string(),
  text: z.string(),
  evidence: z.array(z.string()),
  flags: z.array(claimFlagSchema),
  source: z.literal("llm"),
});

export const gateSchema = z.object({
  id: z.string(),
  kind: z.enum(["permission", "approval", "budget", "policy"]),
  promptedAt: z.string(),
  decidedAt: z.string().optional(),
  decidedBy: z.string().optional(),
  outcome: z.enum(["approved", "denied", "timeout", "auto"]),
  context: z.string(),
});

export const artifactSchema = z.object({
  id: z.string(),
  kind: z.enum(["file", "report", "output"]),
  ref: z.string(),
  hash: z.string().optional(),
  bytes: z.number().int().nonnegative().optional(),
  producedByActionId: z.string(),
});

export const costsSchema = z.object({
  durationMs: z.number().int().nonnegative(),
  toolCalls: z.number().int().nonnegative(),
  toolCallBreakdown: z.record(z.number().int().nonnegative()),
  mutations: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
  retries: z.number().int().nonnegative(),
  searchBudget: z
    .object({
      used: z.number().int().nonnegative(),
      limit: z.number().int().nonnegative().optional(),
    })
    .optional(),
  tokens: z
    .object({ input: z.number().int().nonnegative(), output: z.number().int().nonnegative() })
    .optional(),
});

export const rawRefSchema = z.object({
  format: z.literal("jsonl"),
  path: z.string().optional(),
  recordCount: z.number().int().nonnegative(),
  sha256: z.string(),
});

export const aerSchema = z
  .object({
    version: z.literal("1.0"),
    run: runSchema,
    phases: z.array(phaseSchema),
    actions: z.array(actionSchema),
    mutations: z.array(mutationSchema),
    filesTouched: z.array(fileTouchedSchema),
    verification: z.array(verificationCheckSchema),
    claims: z.array(claimSchema),
    gates: z.array(gateSchema),
    artifacts: z.array(artifactSchema),
    costs: costsSchema,
    raw: rawRefSchema,
  })
  .superRefine((data, ctx) => {
    const phaseIds = new Set(data.phases.map((p) => p.id));
    for (const [i, action] of data.actions.entries()) {
      if (!phaseIds.has(action.phaseId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["actions", i, "phaseId"],
          message: `phaseId '${action.phaseId}' does not reference any phase`,
        });
      }
    }
  });

export function parseAER(input: unknown): AER {
  return aerSchema.parse(input) as AER;
}
