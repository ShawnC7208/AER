import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runConvert } from "../src/commands/convert.js";

describe("@aer/cli convert", () => {
  it("writes an AER JSON file", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-cli-"));
    const input = join(dir, "input.jsonl");
    const output = join(dir, "output.aer.json");
    const jsonl = [
      JSON.stringify({
        type: "user",
        timestamp: "2026-01-01T00:00:00.000Z",
        sessionId: "s1",
        message: { role: "user", content: "hello" },
      }),
    ].join("\n");
    writeFileSync(input, jsonl);

    runConvert(input, { output });

    expect(JSON.parse(readFileSync(output, "utf8")).version).toBe("1.0");
  });

  it("converts a directory of JSONL files into deterministic output names", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-cli-dir-"));
    const nested = join(dir, "nested");
    const output = join(dir, "out");
    mkdirSync(nested);
    writeFileSync(join(dir, "root.jsonl"), jsonl("root-session"));
    writeFileSync(join(nested, "child.jsonl"), jsonl("child-session"));

    runConvert(dir, { output });

    expect(JSON.parse(readFileSync(join(output, "root.aer.json"), "utf8")).run.id).toBe(
      "root-session",
    );
    expect(JSON.parse(readFileSync(join(output, "nested__child.aer.json"), "utf8")).run.id).toBe(
      "child-session",
    );
    expect(JSON.parse(readFileSync(join(output, "root.aer.json"), "utf8")).raw.path).toBe(
      "root.jsonl",
    );
    expect(JSON.parse(readFileSync(join(output, "nested__child.aer.json"), "utf8")).raw.path).toBe(
      "nested/child.jsonl",
    );
  });
});

function jsonl(sessionId: string): string {
  return [
    JSON.stringify({
      type: "user",
      timestamp: "2026-01-01T00:00:00.000Z",
      sessionId,
      message: { role: "user", content: "hello" },
    }),
  ].join("\n");
}
