import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { convert } from "@aer/adapter-claude-code";
import { describe, expect, it, vi } from "vitest";
import { runValidate } from "../src/commands/validate.js";

describe("@aer/cli validate", () => {
  it("prints success for valid AER JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-validate-valid-"));
    const input = join(dir, "input.aer.json");
    writeFileSync(input, `${JSON.stringify(convert(jsonl(), { rawPath: "input.jsonl" }))}\n`);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    runValidate(input);

    expect(stdout.mock.calls.join("")).toContain("Valid AER:");
    stdout.mockRestore();
  });

  it("exits nonzero with schema errors for invalid AER JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-validate-invalid-"));
    const input = join(dir, "input.aer.json");
    writeFileSync(input, JSON.stringify({ version: "nope" }));
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("exit:1");
    }) as never);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    expect(() => runValidate(input)).toThrow("exit:1");
    expect(stderr.mock.calls.join("")).toContain("aer: validation failed");
    expect(stderr.mock.calls.join("")).toContain("version");

    exit.mockRestore();
    stderr.mockRestore();
  });
});

function jsonl(): string {
  return [
    JSON.stringify({
      type: "user",
      timestamp: "2026-01-01T00:00:00.000Z",
      sessionId: "sample-session",
      message: { role: "user", content: "validate this" },
    }),
  ].join("\n");
}
