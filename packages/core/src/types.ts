export interface AER {
  version: "1.0";
  run: Run;
  phases: Phase[];
  actions: Action[];
  mutations: Mutation[];
  filesTouched: FileTouched[];
  verification: VerificationCheck[];
  claims: Claim[];
  gates: Gate[];
  artifacts: Artifact[];
  costs: Costs;
  raw: RawRef;
}

export interface Run {
  id: string;
  source: "claude-code" | "langchain" | "openai-agents" | "generic";
  goal: string;
  goalSource: "verbatim" | "llm";
  mode: "interactive" | "autonomous" | "scheduled";
  trigger?: string;
  model?: string;
  startedAt: string;
  endedAt: string;
  outcome: "completed" | "failed" | "partial" | "abandoned";
  outcomeReason?: string;
  recordCount: number;
}

export interface Phase {
  id: string;
  index: number;
  name: string;
  nameSource: "generic" | "llm";
  why?: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  actionIds: string[];
  recordRange: [number, number];
}

export interface Action {
  id: string;
  recordIndex: number;
  ts: string;
  kind: ActionKind;
  toolName: string;
  mutates: boolean;
  target?: string;
  inputSummary: string;
  outputSummary?: string;
  phaseId: string;
  errored: boolean;
}

export type ActionKind = "read" | "search" | "mutate" | "report" | "meta" | "other";

export interface Mutation {
  id: string;
  actionId: string;
  kind: "write" | "edit" | "delete" | "bash-mutating" | "external";
  target: string;
  beforeHash?: string;
  afterHash?: string;
  beforeBytes?: number;
  afterBytes?: number;
  diff?: string;
  diffStats?: { added: number; removed: number };
  gateFired: boolean;
  gateRef?: string;
  semanticLabel?: string;
}

export interface FileTouched {
  path: string;
  status: "new" | "modified" | "deleted";
  linesAdded: number;
  linesRemoved: number;
  mutationIds: string[];
  finalHash?: string;
  finalBytes?: number;
}

export interface VerificationCheck {
  id: string;
  kind: "test" | "typecheck" | "lint" | "build" | "format" | "other";
  command: string;
  outcome: "passed" | "failed" | "recovered";
  detail?: string;
  attempts: { actionId: string; outcome: "passed" | "failed" }[];
  finalActionId: string;
}

export interface Claim {
  id: string;
  text: string;
  evidence: string[];
  flags: ClaimFlag[];
  source: "llm";
}

export type ClaimFlag =
  | "single-source"
  | "absence-of-evidence"
  | "judgment-from-prior"
  | "unsourced";

export interface Gate {
  id: string;
  kind: "permission" | "approval" | "budget" | "policy";
  promptedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  outcome: "approved" | "denied" | "timeout" | "auto";
  context: string;
}

export interface Artifact {
  id: string;
  kind: "file" | "report" | "output";
  ref: string;
  hash?: string;
  bytes?: number;
  producedByActionId: string;
}

export interface Costs {
  durationMs: number;
  toolCalls: number;
  toolCallBreakdown: Record<string, number>;
  mutations: number;
  errors: number;
  retries: number;
  searchBudget?: { used: number; limit?: number };
  tokens?: { input: number; output: number };
}

export interface RawRef {
  format: "jsonl";
  path?: string;
  recordCount: number;
  sha256: string;
}
