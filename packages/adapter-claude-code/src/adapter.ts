import { type AER, type Action, type ActionKind, sha256 } from "@aer/core";
import { classifyTool, isMutating } from "./classify.js";
import { rollupFilesTouched } from "./files-touched.js";
import { type ToolActionContext, extractMutations } from "./mutations.js";
import { arrayValue, objectValue, parseJsonl, stringValue } from "./parse.js";
import { buildPhases } from "./phases.js";
import { summarizeContent, summarizeToolInput, targetForTool, trim } from "./summarize.js";
import { buildVerification } from "./verification.js";

export interface ConvertOptions {
  withDisk?: boolean;
  rawPath?: string;
  readFile?: (path: string) => string | undefined;
}

interface ActionBuildResult {
  actions: Action[];
  toolActions: ToolActionContext[];
}

export function convert(jsonl: string, opts: ConvertOptions = {}): AER {
  const records = parseJsonl(jsonl);
  const { actions, toolActions } = buildActions(records);
  const startedAt = firstTimestamp(records);
  const endedAt = lastTimestamp(records);
  const phases = buildPhases(actions, startedAt, endedAt);
  const verification = buildVerification(actions);
  const mutationResult = extractMutations(toolActions, records, opts);
  const filesTouched = rollupFilesTouched(mutationResult.mutations);
  const toolCallBreakdown = toolActions.reduce<Record<string, number>>((acc, toolAction) => {
    acc[toolAction.name] = (acc[toolAction.name] ?? 0) + 1;
    return acc;
  }, {});
  const tokenTotals = collectTokens(records);

  const run: AER["run"] = {
    id: records.find((record) => record.sessionId)?.sessionId ?? "unknown",
    source: "claude-code",
    goal: extractGoal(records),
    goalSource: "verbatim",
    mode: inferMode(records),
    startedAt,
    endedAt,
    outcome: inferOutcome(records),
    recordCount: records.length,
  };
  const trigger = extractTrigger(records);
  const model = extractModel(records);
  if (trigger) run.trigger = trigger;
  if (model) run.model = model;

  const costs: AER["costs"] = {
    durationMs: durationMs(startedAt, endedAt),
    toolCalls: toolActions.length,
    toolCallBreakdown,
    mutations: mutationResult.mutations.length,
    errors: countErrors(records),
    retries: 0,
  };
  if (toolCallBreakdown.WebSearch) costs.searchBudget = { used: toolCallBreakdown.WebSearch };
  if (tokenTotals.input || tokenTotals.output) costs.tokens = tokenTotals;

  const raw: AER["raw"] = {
    format: "jsonl",
    recordCount: records.length,
    sha256: sha256(jsonl),
  };
  if (opts.rawPath) raw.path = opts.rawPath;

  return {
    version: "1.0",
    run,
    phases,
    actions,
    mutations: mutationResult.mutations,
    filesTouched,
    verification,
    claims: [],
    gates: [],
    artifacts: buildArtifacts(mutationResult.mutations),
    costs,
    raw,
  };
}

function buildActions(records: ReturnType<typeof parseJsonl>): ActionBuildResult {
  const actions: Action[] = [];
  const toolActions: ToolActionContext[] = [];

  for (const record of records) {
    const message = objectValue(record.raw.message);
    const content = message?.content;
    let emitted = false;

    if (record.type === "assistant" && Array.isArray(content)) {
      for (const item of content) {
        const block = objectValue(item);
        if (!block) continue;

        if (block.type === "tool_use") {
          const name = stringValue(block.name) ?? "unknown";
          const input = block.input;
          const kind = classifyTool(name);
          const mutates = isMutating(name, input);
          const actionInput = {
            actions,
            recordIndex: record.index,
            ts: timestamp(record),
            kind: mutates ? "mutate" : kind,
            toolName: name,
            mutates,
            inputSummary: summarizeToolInput(name, input),
            errored: false,
          };
          const target = targetForTool(name, input);
          const action = actionFrom(target ? { ...actionInput, target } : actionInput);
          actions.push(action);
          toolActions.push({
            action,
            record,
            toolUseId: stringValue(block.id) ?? action.id,
            name,
            input,
          });
          emitted = true;
        }

        if (block.type === "text") {
          actions.push(
            actionFrom({
              actions,
              recordIndex: record.index,
              ts: timestamp(record),
              kind: "report",
              toolName: "assistant_text",
              mutates: false,
              inputSummary: trim(stringValue(block.text) ?? "assistant text"),
              errored: recordErrored(record),
            }),
          );
          emitted = true;
        }
      }
    }

    if (record.type === "user" && Array.isArray(content)) {
      for (const item of content) {
        const block = objectValue(item);
        if (!block || block.type !== "tool_result") continue;
        actions.push(
          actionFrom({
            actions,
            recordIndex: record.index,
            ts: timestamp(record),
            kind: "other",
            toolName: "tool_result",
            mutates: false,
            inputSummary: summarizeContent(block.content),
            errored: block.is_error === true || recordErrored(record),
          }),
        );
        emitted = true;
      }
    }

    if (!emitted) {
      actions.push(actionForRecord(record, actions.length + 1));
    }
  }

  attachToolResults(actions, records, toolActions);

  return { actions, toolActions };
}

function actionForRecord(record: ReturnType<typeof parseJsonl>[number], ordinal: number): Action {
  const kind: ActionKind =
    record.type === "attachment" || record.type === "queue-operation" || record.type === "ai-title"
      ? "meta"
      : "other";

  const action: Action = {
    id: `a${ordinal}`,
    recordIndex: record.index,
    ts: timestamp(record),
    kind,
    toolName: record.type,
    mutates: false,
    inputSummary: summarizeRecord(record.raw),
    phaseId: "p1",
    errored: recordErrored(record),
  };
  const target = record.type === "ai-title" ? stringValue(record.raw.aiTitle) : undefined;
  if (target) action.target = target;
  return action;
}

function actionFrom(input: {
  actions: Action[];
  recordIndex: number;
  ts: string;
  kind: ActionKind;
  toolName: string;
  mutates: boolean;
  target?: string;
  inputSummary: string;
  errored: boolean;
}): Action {
  const action: Action = {
    id: `a${input.actions.length + 1}`,
    recordIndex: input.recordIndex,
    ts: input.ts,
    kind: input.kind,
    toolName: input.toolName,
    mutates: input.mutates,
    inputSummary: input.inputSummary,
    phaseId: "p1",
    errored: input.errored,
  };
  if (input.target) action.target = input.target;
  return action;
}

function attachToolResults(
  actions: Action[],
  records: ReturnType<typeof parseJsonl>,
  toolActions: ToolActionContext[],
): void {
  const byToolUseId = new Map(toolActions.map((toolAction) => [toolAction.toolUseId, toolAction]));
  for (const record of records) {
    const message = objectValue(record.raw.message);
    for (const item of arrayValue(message?.content)) {
      const block = objectValue(item);
      if (!block || block.type !== "tool_result") continue;
      const toolUseId = stringValue(block.tool_use_id);
      if (!toolUseId) continue;
      const toolAction = byToolUseId.get(toolUseId);
      if (!toolAction) continue;
      toolAction.action.outputSummary = summarizeContent(block.content);
      toolAction.action.errored = toolAction.action.errored || block.is_error === true;
    }
  }
}

function recordErrored(record: ReturnType<typeof parseJsonl>[number]): boolean {
  return record.raw.isApiErrorMessage === true || typeof record.raw.error === "string";
}

function summarizeRecord(raw: Record<string, unknown>): string {
  if (typeof raw.content === "string") return trim(raw.content);
  if (typeof raw.aiTitle === "string") return trim(raw.aiTitle);
  if (raw.attachment) {
    const attachment = objectValue(raw.attachment);
    return trim(`attachment ${stringValue(attachment?.type) ?? "unknown"}`);
  }
  if (raw.message) return summarizeContent(objectValue(raw.message)?.content);
  return trim(JSON.stringify(raw));
}

function extractGoal(records: ReturnType<typeof parseJsonl>): string {
  const user = records.find((record) => record.type === "user");
  const message = objectValue(user?.raw.message);
  const content = message?.content;
  if (typeof content === "string") return trim(stripScheduledTask(content), 1000);
  return trim(summarizeContent(content), 1000);
}

function extractTrigger(records: ReturnType<typeof parseJsonl>): string | undefined {
  const goal = extractGoal(records);
  const match = /<scheduled-task name="([^"]+)"/.exec(
    records.find((record) => typeof record.raw.content === "string")?.raw.content as string,
  );
  if (match?.[1]) return `scheduled-task:${match[1]}`;
  if (goal.includes("<scheduled-task")) return "scheduled-task";
  return undefined;
}

function stripScheduledTask(content: string): string {
  const body =
    content.match(/<scheduled-task[^>]*>\s*([\s\S]*?)<\/scheduled-task>/)?.[1] ?? content;
  return body
    .replace(/This is an automated run[\s\S]*?correct output\.\s*/m, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferMode(records: ReturnType<typeof parseJsonl>): AER["run"]["mode"] {
  const hasScheduled = records.some((record) =>
    JSON.stringify(record.raw).includes("<scheduled-task"),
  );
  if (hasScheduled) return "scheduled";
  const permissionMode = records
    .map((record) => stringValue(record.raw.permissionMode))
    .find(Boolean);
  return permissionMode === "default" ? "interactive" : "interactive";
}

function inferOutcome(records: ReturnType<typeof parseJsonl>): AER["run"]["outcome"] {
  if (records.some((record) => record.raw.isApiErrorMessage === true || record.raw.error)) {
    return "failed";
  }
  if (countErrors(records) > 0) return "partial";
  return records.some((record) => record.type === "assistant") ? "completed" : "abandoned";
}

function extractModel(records: ReturnType<typeof parseJsonl>): string | undefined {
  for (const record of records) {
    const message = objectValue(record.raw.message);
    const model = stringValue(message?.model);
    if (model) return model;
  }
  return undefined;
}

function firstTimestamp(records: ReturnType<typeof parseJsonl>): string {
  return records.find((record) => record.timestamp)?.timestamp ?? new Date(0).toISOString();
}

function lastTimestamp(records: ReturnType<typeof parseJsonl>): string {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const ts = records[index]?.timestamp;
    if (ts) return ts;
  }
  return firstTimestamp(records);
}

function timestamp(record: ReturnType<typeof parseJsonl>[number]): string {
  return record.timestamp ?? new Date(0).toISOString();
}

function durationMs(startedAt: string, endedAt: string): number {
  return Math.max(0, Date.parse(endedAt) - Date.parse(startedAt));
}

function countErrors(records: ReturnType<typeof parseJsonl>): number {
  return records.reduce((count, record) => {
    const toolUseResult = objectValue(record.raw.toolUseResult);
    const explicitError = toolUseResult?.is_error === true || toolUseResult?.interrupted === true;
    const apiError = record.raw.isApiErrorMessage === true || typeof record.raw.error === "string";
    const contentErrors = arrayValue(objectValue(record.raw.message)?.content).filter(
      (item) => objectValue(item)?.is_error === true,
    ).length;
    return count + (explicitError ? 1 : 0) + (apiError ? 1 : 0) + contentErrors;
  }, 0);
}

function collectTokens(records: ReturnType<typeof parseJsonl>): { input: number; output: number } {
  return records.reduce(
    (totals, record) => {
      const usage = objectValue(objectValue(record.raw.message)?.usage);
      return {
        input:
          totals.input +
          numberValue(usage?.input_tokens) +
          numberValue(usage?.cache_creation_input_tokens) +
          numberValue(usage?.cache_read_input_tokens),
        output: totals.output + numberValue(usage?.output_tokens),
      };
    },
    { input: 0, output: 0 },
  );
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function buildArtifacts(mutations: AER["mutations"]): AER["artifacts"] {
  return mutations
    .filter((mutation) => mutation.kind === "write" && mutation.afterHash)
    .map((mutation, index) => {
      const artifact: AER["artifacts"][number] = {
        id: `art${index + 1}`,
        kind: "file",
        ref: mutation.target,
        producedByActionId: mutation.actionId,
      };
      if (mutation.afterHash) artifact.hash = mutation.afterHash;
      if (mutation.afterBytes !== undefined) artifact.bytes = mutation.afterBytes;
      return artifact;
    });
}
