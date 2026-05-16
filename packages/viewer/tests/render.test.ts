import type { AER } from "@aer/core";
import { describe, expect, it } from "vitest";
import { renderHTML } from "../src/index.js";

describe("@aer/viewer", () => {
  it("renders a complete HTML document with embedded AER JSON", () => {
    const html = renderHTML(sampleAer());

    expect(html).toContain("<!doctype html>");
    expect(html).toContain('<script type="application/json" id="aer-data">');
    expect(html).toContain("Files Touched");
    expect(html).toContain("Mutations");
    expect(html).toContain("hello.ts");
    expect(html).toContain("Raw action timeline");
    expect(html).toContain("\u2190 MUTATION");
  });

  it("escapes log content before rendering", () => {
    const aer = sampleAer({
      run: { ...sampleAer().run, goal: "<script>alert('x')</script>" },
    });

    const html = renderHTML(aer);

    expect(html).toContain("&lt;script&gt;alert('x')&lt;/script&gt;");
    expect(html).not.toContain("<script>alert");
  });

  it("hides empty optional sections", () => {
    const aer = sampleAer({ filesTouched: [], mutations: [], verification: [], claims: [] });
    const html = renderHTML(aer);

    expect(html).not.toContain('id="files-touched"');
    expect(html).not.toContain('id="mutations"');
    expect(html).not.toContain('id="verification"');
    expect(html).not.toContain('id="claims"');
  });

  it("renders verification checks when present", () => {
    const aer = sampleAer({
      verification: [
        {
          id: "v1",
          kind: "test",
          command: "pnpm test",
          outcome: "recovered",
          detail: "3 passed",
          attempts: [
            { actionId: "a1", outcome: "failed" },
            { actionId: "a1", outcome: "passed" },
          ],
          finalActionId: "a1",
        },
      ],
    });

    const html = renderHTML(aer);

    expect(html).toContain('id="verification"');
    expect(html).toContain("pnpm test");
    expect(html).toContain("3 passed");
  });

  it("renders word-level diff highlights and collapses long unchanged context", () => {
    const aer = sampleAer({
      mutations: [
        {
          id: "m1",
          actionId: "a1",
          kind: "edit",
          target: "hello.ts",
          diff: [
            "--- before",
            "+++ after",
            "@@",
            " one",
            " two",
            " three",
            " four",
            " five",
            " six",
            " seven",
            " eight",
            " nine",
            '-const status = "old";',
            '+const status = "new";',
          ].join("\n"),
          diffStats: { added: 1, removed: 1 },
          gateFired: false,
        },
      ],
    });

    const html = renderHTML(aer);

    expect(html).toContain("unchanged lines");
    expect(html).toContain('<span class="word">old</span>');
    expect(html).toContain('<span class="word">new</span>');
  });
});

function sampleAer(overrides: Partial<AER> = {}): AER {
  const aer: AER = {
    version: "1.0",
    run: {
      id: "sample-run",
      source: "claude-code",
      goal: "Add a hello module",
      goalSource: "verbatim",
      mode: "interactive",
      startedAt: "2026-01-01T00:00:00.000Z",
      endedAt: "2026-01-01T00:00:05.000Z",
      outcome: "completed",
      recordCount: 2,
    },
    phases: [
      {
        id: "p1",
        index: 1,
        name: "Phase 1",
        nameSource: "generic",
        startedAt: "2026-01-01T00:00:00.000Z",
        endedAt: "2026-01-01T00:00:05.000Z",
        durationMs: 5000,
        actionIds: ["a1"],
        recordRange: [0, 1],
      },
    ],
    actions: [
      {
        id: "a1",
        recordIndex: 1,
        ts: "2026-01-01T00:00:01.000Z",
        kind: "mutate",
        toolName: "Write",
        mutates: true,
        target: "hello.ts",
        inputSummary: "write hello.ts",
        phaseId: "p1",
        errored: false,
      },
    ],
    mutations: [
      {
        id: "m1",
        actionId: "a1",
        kind: "write",
        target: "hello.ts",
        afterHash: "abc123",
        afterBytes: 12,
        diff: "--- before\n+++ after\n@@\n+hello",
        diffStats: { added: 1, removed: 0 },
        gateFired: false,
      },
    ],
    filesTouched: [
      {
        path: "hello.ts",
        status: "new",
        linesAdded: 1,
        linesRemoved: 0,
        mutationIds: ["m1"],
        finalHash: "abc123",
        finalBytes: 12,
      },
    ],
    verification: [],
    claims: [],
    gates: [],
    artifacts: [],
    costs: {
      durationMs: 5000,
      toolCalls: 1,
      toolCallBreakdown: { Write: 1 },
      mutations: 1,
      errors: 0,
      retries: 0,
    },
    raw: {
      format: "jsonl",
      path: "sample.jsonl",
      recordCount: 2,
      sha256: "hash",
    },
  };

  return { ...aer, ...overrides };
}
