import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseAER } from "@aer/core";
import { describe, expect, it } from "vitest";
import { classifyTool, convert, isMutating, rollupFilesTouched } from "../src/index.js";

const fixtureDir = join(import.meta.dirname, "..", "fixtures");

describe("@aer/adapter-claude-code", () => {
  it("converts the real daily research fixture", () => {
    const jsonl = readFileSync(join(fixtureDir, "daily-research.jsonl"), "utf8");
    const aer = parseAER(convert(jsonl, { rawPath: "daily-research.jsonl" }));

    expect(aer.version).toBe("1.0");
    expect(aer.run.id).toBe("0e6b3764-b28d-4fab-b513-d01d2cb00bed");
    expect(aer.run.mode).toBe("scheduled");
    expect(aer.raw.recordCount).toBe(67);
    expect(aer.mutations).toHaveLength(2);
    expect(aer.filesTouched).toHaveLength(2);
    expect(aer.verification).toHaveLength(0);
    expect(aer.claims).toHaveLength(0);
    expect(aer.costs.toolCallBreakdown.Write).toBe(1);
    expect(aer.costs.toolCallBreakdown.Edit).toBe(1);
  });

  it("converts a synthetic coding fixture", () => {
    const jsonl = readFileSync(join(fixtureDir, "coding-small.jsonl"), "utf8");
    const aer = parseAER(convert(jsonl));

    expect(aer.mutations).toHaveLength(2);
    expect(aer.filesTouched.map((file) => file.path)).toEqual(["src/slug.ts", "src/index.ts"]);
    expect(aer.verification).toHaveLength(0);
  });

  it("preserves unknown tools as non-mutating other actions", () => {
    const jsonl = readFileSync(join(fixtureDir, "unknown-tool.jsonl"), "utf8");
    const aer = parseAER(convert(jsonl));
    const action = aer.actions.find((item) => item.toolName === "FutureTool");

    expect(action?.kind).toBe("other");
    expect(action?.mutates).toBe(false);
  });

  it("marks API error sessions as failed without inventing tool calls", () => {
    const jsonl = readFileSync(join(fixtureDir, "rate-limit.jsonl"), "utf8");
    const aer = parseAER(convert(jsonl));

    expect(aer.run.outcome).toBe("failed");
    expect(aer.costs.errors).toBe(1);
    expect(aer.costs.toolCalls).toBe(0);
    expect(aer.costs.toolCallBreakdown).toEqual({});
  });

  it("classifies tools conservatively", () => {
    expect(classifyTool("Read")).toBe("read");
    expect(classifyTool("WebSearch")).toBe("search");
    expect(classifyTool("FutureTool")).toBe("other");
    expect(isMutating("Write", {})).toBe(true);
    expect(isMutating("Bash", { command: "ls src" })).toBe(false);
    expect(isMutating("Bash", { command: "mkdir dist" })).toBe(true);
  });

  it("rolls files up deterministically", () => {
    const files = rollupFilesTouched([
      {
        id: "m1",
        actionId: "a1",
        kind: "write",
        target: "a.ts",
        afterHash: "h1",
        afterBytes: 10,
        diffStats: { added: 2, removed: 0 },
        gateFired: false,
      },
      {
        id: "m2",
        actionId: "a2",
        kind: "edit",
        target: "a.ts",
        beforeHash: "h1",
        afterHash: "h2",
        afterBytes: 20,
        diffStats: { added: 1, removed: 1 },
        gateFired: false,
      },
    ]);

    expect(files).toEqual([
      {
        path: "a.ts",
        status: "new",
        linesAdded: 3,
        linesRemoved: 1,
        mutationIds: ["m1", "m2"],
        finalHash: "h2",
        finalBytes: 20,
      },
    ]);
  });
});
