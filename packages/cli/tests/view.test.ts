import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { convert } from "@aer/adapter-claude-code";
import { describe, expect, it, vi } from "vitest";
import { runView } from "../src/commands/view.js";

describe("@aer/cli view", () => {
  it("renders HTML from Claude Code JSONL", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-view-jsonl-"));
    const input = join(dir, "input.jsonl");
    const output = join(dir, "output.html");
    writeFileSync(input, jsonl());

    runView(input, { output });

    const html = readFileSync(output, "utf8");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("AER Viewer");
    expect(html).toContain('id="aer-data"');
  });

  it("renders HTML from AER JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-view-json-"));
    const input = join(dir, "input.aer.json");
    const output = join(dir, "output.html");
    writeFileSync(input, `${JSON.stringify(convert(jsonl(), { rawPath: "input.jsonl" }))}\n`);

    runView(input, { output });

    expect(readFileSync(output, "utf8")).toContain("sample-session");
  });

  it("exits with a clear error for invalid input", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-view-invalid-"));
    const input = join(dir, "broken.aer.json");
    writeFileSync(input, "{nope");
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("exit:1");
    }) as never);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    expect(() => runView(input)).toThrow("exit:1");
    expect(stderr.mock.calls.join("")).toContain("aer: render failed:");

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
      message: { role: "user", content: "render this" },
    }),
  ].join("\n");
}
