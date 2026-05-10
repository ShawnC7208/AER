import { existsSync, readFileSync } from "node:fs";
import { type Action, type Mutation, sha256, unifiedDiff } from "@aer/core";
import { type ClaudeRecord, objectValue } from "./parse.js";

export interface MutationResult {
  mutations: Mutation[];
  warnings: string[];
}

export interface ToolActionContext {
  action: Action;
  record: ClaudeRecord;
  toolUseId: string;
  name: string;
  input: unknown;
}

export function extractMutations(
  toolActions: ToolActionContext[],
  records: ClaudeRecord[],
  opts: { withDisk?: boolean } = {},
): MutationResult {
  const reads = collectReadContents(toolActions, records);
  const warnings: string[] = [];
  const mutations: Mutation[] = [];

  for (const toolAction of toolActions) {
    if (!toolAction.action.mutates) continue;

    const input = objectValue(toolAction.input);
    const target =
      typeof input?.file_path === "string" ? input.file_path : toolAction.action.target;
    if (!target) continue;

    const before = beforeContent(target, toolAction, reads, opts);
    const after = afterContent(toolAction, before);

    if (after === undefined && toolAction.name !== "Bash") {
      warnings.push(`Could not determine after content for ${toolAction.name} ${target}`);
      continue;
    }
    if (before === undefined) warnings.push(`Could not determine before content for ${target}`);

    const mutation: Mutation = {
      id: `m${mutations.length + 1}`,
      actionId: toolAction.action.id,
      kind: mutationKind(toolAction.name),
      target,
      gateFired: false,
    };

    if (before !== undefined) {
      mutation.beforeHash = sha256(before);
      mutation.beforeBytes = Buffer.byteLength(before);
    }
    if (after !== undefined) {
      mutation.afterHash = sha256(after);
      mutation.afterBytes = Buffer.byteLength(after);
    }
    if (before !== undefined && after !== undefined && isTextDiffable(before, after)) {
      const result = unifiedDiff(before, after);
      mutation.diff = result.diff;
      mutation.diffStats = result.stats;
    } else if (after !== undefined) {
      mutation.diffStats = { added: countLines(after), removed: before ? countLines(before) : 0 };
    }

    mutations.push(mutation);
  }

  return { mutations, warnings };
}

function collectReadContents(
  toolActions: ToolActionContext[],
  records: ClaudeRecord[],
): Map<string, { recordIndex: number; content: string }[]> {
  const byToolUseId = new Map(toolActions.map((toolAction) => [toolAction.toolUseId, toolAction]));
  const reads = new Map<string, { recordIndex: number; content: string }[]>();

  for (const record of records) {
    if (record.type !== "user") continue;
    const message = objectValue(record.raw.message);
    const contents = Array.isArray(message?.content) ? message.content : [];
    for (const item of contents) {
      const result = objectValue(item);
      if (!result || result.type !== "tool_result") continue;
      const toolUseId = typeof result.tool_use_id === "string" ? result.tool_use_id : undefined;
      if (!toolUseId) continue;
      const toolAction = byToolUseId.get(toolUseId);
      if (!toolAction || toolAction.name !== "Read" || !toolAction.action.target) continue;
      const content =
        typeof result.content === "string" ? stripLineNumbers(result.content) : undefined;
      if (content === undefined) continue;
      const values = reads.get(toolAction.action.target) ?? [];
      values.push({ recordIndex: record.index, content });
      reads.set(toolAction.action.target, values);
    }
  }

  return reads;
}

function beforeContent(
  target: string,
  toolAction: ToolActionContext,
  reads: Map<string, { recordIndex: number; content: string }[]>,
  opts: { withDisk?: boolean },
): string | undefined {
  const fromRead = reads
    .get(target)
    ?.filter((read) => read.recordIndex < toolAction.record.index)
    .at(-1)?.content;
  if (fromRead !== undefined) return fromRead;

  const toolUseResult = objectValue(toolAction.record.raw.toolUseResult);
  if (typeof toolUseResult?.originalFile === "string") return toolUseResult.originalFile;

  if (opts.withDisk && existsSync(target)) return readFileSync(target, "utf8");
  return undefined;
}

function afterContent(
  toolAction: ToolActionContext,
  before: string | undefined,
): string | undefined {
  const input = objectValue(toolAction.input);
  if (!input) return undefined;

  if (toolAction.name === "Write" && typeof input.content === "string") return input.content;
  if (toolAction.name === "Edit") {
    if (before === undefined)
      return typeof input.new_string === "string" ? input.new_string : undefined;
    if (typeof input.old_string === "string" && typeof input.new_string === "string") {
      return before.replace(input.old_string, input.new_string);
    }
  }
  if (toolAction.name === "MultiEdit" && before !== undefined && Array.isArray(input.edits)) {
    return input.edits.reduce((content: string, edit) => {
      const object = objectValue(edit);
      return typeof object?.old_string === "string" && typeof object.new_string === "string"
        ? content.replace(object.old_string, object.new_string)
        : content;
    }, before);
  }
  return undefined;
}

function mutationKind(name: string): Mutation["kind"] {
  if (name === "Write") return "write";
  if (name === "Edit" || name === "MultiEdit" || name === "NotebookEdit") return "edit";
  if (name === "Bash") return "bash-mutating";
  return "external";
}

function isTextDiffable(before: string, after: string): boolean {
  return Buffer.byteLength(before) <= 1024 * 1024 && Buffer.byteLength(after) <= 1024 * 1024;
}

function countLines(content: string): number {
  if (content.length === 0) return 0;
  return content.split(/\r?\n/).length;
}

function stripLineNumbers(content: string): string {
  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\d+\t/, ""))
    .join("\n");
}
