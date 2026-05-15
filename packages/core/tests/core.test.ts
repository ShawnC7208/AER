import { describe, expect, it } from "vitest";
import { parseAER, sha256, unifiedDiff } from "../src/index.js";

describe("@aer/core", () => {
  it("hashes deterministically", () => {
    expect(sha256("aer")).toBe(sha256(Buffer.from("aer")));
    expect(sha256("aer")).toBe("300859e050ee53855c5f12c72ff69bb0bbcd1d9415d4b4e7a076249fca6a2511");
  });

  it("returns unified diff stats", () => {
    const result = unifiedDiff("one\nold\n", "one\nnew\nadded\n");
    expect(result.stats).toEqual({ added: 2, removed: 1 });
    expect(result.diff).toContain("-old");
    expect(result.diff).toContain("+new");
  });

  it("validates a minimal AER", () => {
    expect(() =>
      parseAER({
        version: "1.0",
        run: {
          id: "r1",
          source: "claude-code",
          goal: "",
          goalSource: "verbatim",
          mode: "interactive",
          startedAt: "2026-01-01T00:00:00.000Z",
          endedAt: "2026-01-01T00:00:00.000Z",
          outcome: "completed",
          recordCount: 0,
        },
        phases: [],
        actions: [],
        mutations: [],
        filesTouched: [],
        verification: [],
        claims: [],
        gates: [],
        artifacts: [],
        costs: {
          durationMs: 0,
          toolCalls: 0,
          toolCallBreakdown: {},
          mutations: 0,
          errors: 0,
          retries: 0,
        },
        raw: { format: "jsonl", recordCount: 0, sha256: sha256("") },
      }),
    ).not.toThrow();
  });
});
