import type { ActionKind } from "@aer/core";

const toolKinds: Record<string, ActionKind> = {
  Read: "read",
  LS: "read",
  LSP: "read",
  Grep: "search",
  Glob: "search",
  WebSearch: "search",
  WebFetch: "search",
  ToolSearch: "meta",
  TodoWrite: "meta",
  TaskOutput: "report",
  Write: "mutate",
  Edit: "mutate",
  MultiEdit: "mutate",
  NotebookEdit: "mutate",
  Bash: "other",
};

const mutatingCommandPattern =
  /(^|\s)(rm|mv|cp|mkdir|rmdir|touch|chmod|chown)\b|>\s*\S|>>\s*\S|\|\s*tee\b|(^|\s)(sed|perl)\s+(-i|--in-place)\b/;

export function classifyTool(name: string): ActionKind {
  return toolKinds[name] ?? "other";
}

export function isMutating(name: string, input: unknown): boolean {
  if (["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(name)) return true;
  if (name !== "Bash") return false;

  const command =
    input && typeof input === "object" && "command" in input
      ? String((input as { command?: unknown }).command ?? "")
      : "";

  return mutatingCommandPattern.test(command);
}
