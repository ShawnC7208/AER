import { arrayValue, objectValue, stringValue } from "./parse.js";

export function targetForTool(name: string, input: unknown): string | undefined {
  const object = objectValue(input);
  if (!object) return undefined;
  if (typeof object.file_path === "string") return object.file_path;
  if (typeof object.notebook_path === "string") return object.notebook_path;
  if (typeof object.path === "string") return object.path;
  if (typeof object.url === "string") return object.url;
  if (typeof object.query === "string") return object.query;
  if (typeof object.command === "string") return object.command;
  return undefined;
}

export function summarizeToolInput(name: string, input: unknown): string {
  const object = objectValue(input);
  if (!object) return name;

  const target = targetForTool(name, input);
  if (name === "Bash" && typeof object.command === "string") return trim(object.command);
  if (name === "WebSearch" && typeof object.query === "string")
    return `WebSearch "${trim(object.query)}"`;
  if (name === "ToolSearch" && typeof object.query === "string")
    return `ToolSearch ${trim(object.query)}`;
  if (name === "TodoWrite") return `TodoWrite ${arrayValue(object.todos).length} items`;
  if (target) return `${name} ${trim(target)}`;

  return name;
}

export function summarizeContent(content: unknown): string {
  if (typeof content === "string") return trim(content);
  if (Array.isArray(content)) {
    return trim(
      content
        .map((item) => {
          const object = objectValue(item);
          if (!object) return "";
          if (object.type === "text") return stringValue(object.text) ?? "";
          if (object.type === "tool_result") return stringValue(object.content) ?? "";
          return stringValue(object.type) ?? "";
        })
        .filter(Boolean)
        .join(" "),
    );
  }
  return "";
}

export function trim(value: string, max = 300): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > max ? `${compact.slice(0, max - 1)}…` : compact;
}
