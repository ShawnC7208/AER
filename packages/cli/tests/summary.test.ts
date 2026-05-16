import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { convert } from "@aer/adapter-claude-code";
import { describe, expect, it, vi } from "vitest";
import { runSummary } from "../src/commands/summary.js";

describe("@aer/cli summary", () => {
  it("prints a deterministic summary from JSONL", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-summary-jsonl-"));
    const input = join(dir, "input.jsonl");
    writeFileSync(input, jsonl());
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    runSummary(input);

    const output = stdout.mock.calls.join("");
    expect(output).toContain("AER Summary: summarize this");
    expect(output).toContain("Run: sample-session");
    expect(output).toContain("Tool calls: 0");
    expect(output).toContain("Verification: 0");
    stdout.mockRestore();
  });

  it("prints a deterministic summary from AER JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-summary-json-"));
    const input = join(dir, "input.aer.json");
    writeFileSync(input, `${JSON.stringify(convert(jsonl(), { rawPath: "input.jsonl" }))}\n`);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    runSummary(input);

    expect(stdout.mock.calls.join("")).toContain("Files touched: 0");
    stdout.mockRestore();
  });
});

function jsonl(): string {
  return [
    JSON.stringify({
      type: "user",
      timestamp: "2026-01-01T00:00:00.000Z",
      sessionId: "sample-session",
      message: { role: "user", content: "summarize this" },
    }),
  ].join("\n");
}
