import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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
    expect(aer.actions.at(-1)?.errored).toBe(true);
  });

  it("records edits without full file content but omits snippet hashes and diffs", () => {
    const jsonl = [
      {
        type: "user",
        timestamp: "2026-01-01T00:00:00.000Z",
        sessionId: "edit-no-before",
        message: { role: "user", content: "edit file" },
      },
      {
        type: "assistant",
        timestamp: "2026-01-01T00:00:01.000Z",
        sessionId: "edit-no-before",
        message: {
          role: "assistant",
          model: "claude-test",
          content: [
            {
              type: "tool_use",
              id: "toolu_edit",
              name: "Edit",
              input: {
                file_path: "src/index.ts",
                old_string: "old",
                new_string: "new",
              },
            },
          ],
        },
      },
      {
        type: "user",
        timestamp: "2026-01-01T00:00:02.000Z",
        sessionId: "edit-no-before",
        message: {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "toolu_edit",
              content: "updated",
              is_error: false,
            },
          ],
        },
      },
    ]
      .map((record) => JSON.stringify(record))
      .join("\n");

    const aer = parseAER(convert(jsonl));
    expect(aer.mutations).toHaveLength(1);
    expect(aer.mutations[0]).toMatchObject({
      kind: "edit",
      target: "src/index.ts",
    });
    expect(aer.mutations[0]?.afterHash).toBeUndefined();
    expect(aer.mutations[0]?.afterBytes).toBeUndefined();
    expect(aer.mutations[0]?.diff).toBeUndefined();
    expect(aer.mutations[0]?.diffStats).toBeUndefined();
  });

  it("uses tool result originalFile to reconstruct edit mutations", () => {
    const jsonl = [
      {
        type: "user",
        timestamp: "2026-01-01T00:00:00.000Z",
        sessionId: "edit-original-file",
        message: { role: "user", content: "edit file" },
      },
      {
        type: "assistant",
        timestamp: "2026-01-01T00:00:01.000Z",
        sessionId: "edit-original-file",
        message: {
          role: "assistant",
          model: "claude-test",
          content: [
            {
              type: "tool_use",
              id: "toolu_edit",
              name: "Edit",
              input: {
                file_path: "src/index.ts",
                old_string: "old",
                new_string: "new",
              },
            },
          ],
        },
      },
      {
        type: "user",
        timestamp: "2026-01-01T00:00:02.000Z",
        sessionId: "edit-original-file",
        message: {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "toolu_edit",
              content: "updated",
              is_error: false,
            },
          ],
        },
        toolUseResult: { originalFile: "const value = 'old';\n" },
      },
    ]
      .map((record) => JSON.stringify(record))
      .join("\n");

    const aer = parseAER(convert(jsonl));
    expect(aer.mutations).toHaveLength(1);
    expect(aer.mutations[0]?.beforeHash).toBeDefined();
    expect(aer.mutations[0]?.afterHash).toBeDefined();
    expect(aer.mutations[0]?.diff).toContain("new");
  });

  it("records NotebookEdit mutations with notebook_path targets", () => {
    const jsonl = [
      {
        type: "user",
        timestamp: "2026-01-01T00:00:00.000Z",
        sessionId: "notebook-edit",
        message: { role: "user", content: "edit notebook" },
      },
      {
        type: "assistant",
        timestamp: "2026-01-01T00:00:01.000Z",
        sessionId: "notebook-edit",
        message: {
          role: "assistant",
          model: "claude-test",
          content: [
            {
              type: "tool_use",
              id: "toolu_nb",
              name: "NotebookEdit",
              input: {
                notebook_path: "analysis.ipynb",
                cell_id: "c1",
                new_source: "print('ok')",
              },
            },
          ],
        },
      },
    ]
      .map((record) => JSON.stringify(record))
      .join("\n");

    const aer = parseAER(convert(jsonl));
    expect(aer.actions.find((action) => action.toolName === "NotebookEdit")?.target).toBe(
      "analysis.ipynb",
    );
    expect(aer.mutations).toHaveLength(1);
    expect(aer.mutations[0]).toMatchObject({ kind: "edit", target: "analysis.ipynb" });
  });

  it("resolves --with-disk relative paths against the source record cwd", () => {
    const dir = mkdtempSync(join(tmpdir(), "aer-with-disk-"));
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(join(dir, "src/index.ts"), "const value = 'old';\n");
    const jsonl = [
      {
        type: "user",
        timestamp: "2026-01-01T00:00:00.000Z",
        sessionId: "with-disk",
        message: { role: "user", content: "edit file" },
      },
      {
        type: "assistant",
        timestamp: "2026-01-01T00:00:01.000Z",
        sessionId: "with-disk",
        cwd: dir,
        message: {
          role: "assistant",
          model: "claude-test",
          content: [
            {
              type: "tool_use",
              id: "toolu_edit",
              name: "Edit",
              input: {
                file_path: "src/index.ts",
                old_string: "old",
                new_string: "new",
              },
            },
          ],
        },
      },
    ]
      .map((record) => JSON.stringify(record))
      .join("\n");

    const aer = parseAER(
      convert(jsonl, {
        withDisk: true,
        readFile: (path) => readFileSync(path, "utf8"),
      }),
    );
    expect(aer.mutations[0]?.beforeHash).toBeDefined();
    expect(aer.mutations[0]?.afterHash).toBeDefined();
    expect(aer.mutations[0]?.diff).toContain("new");
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
