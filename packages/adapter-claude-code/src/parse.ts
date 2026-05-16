export interface ClaudeRecord {
  index: number;
  rawLine: string;
  raw: Record<string, unknown>;
  type: string;
  timestamp?: string;
  sessionId?: string;
}

export function parseJsonl(jsonl: string): ClaudeRecord[] {
  return jsonl
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      let raw: Record<string, unknown>;
      try {
        raw = JSON.parse(line.trim()) as Record<string, unknown>;
      } catch (error) {
        throw new Error(`Invalid JSONL at line ${index + 1}: ${(error as Error).message}`);
      }

      const record: ClaudeRecord = {
        index,
        rawLine: line,
        raw,
        type: stringValue(raw.type) ?? "unknown",
      };
      const timestamp = stringValue(raw.timestamp);
      const sessionId = stringValue(raw.sessionId);
      if (timestamp) record.timestamp = timestamp;
      if (sessionId) record.sessionId = sessionId;
      return record;
    });
}

export function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
