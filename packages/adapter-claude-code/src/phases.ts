import type { Action, Phase } from "@aer/core";
import { classifyVerificationCommand } from "./verification.js";

type PhaseCategory = "setup" | "context" | "research" | "synthesize" | "verify" | "report";

interface CategorizedAction {
  action: Action;
  category: PhaseCategory;
}

export function buildPhases(actions: Action[], startedAt: string, endedAt: string): Phase[] {
  if (actions.length === 0) {
    return [
      {
        id: "p1",
        index: 1,
        name: "Phase 1",
        nameSource: "generic",
        startedAt,
        endedAt,
        durationMs: durationMs(startedAt, endedAt),
        actionIds: [],
        recordRange: [0, 0],
      },
    ];
  }

  const categorized = categorizeActions(actions);
  const groups: { items: CategorizedAction[]; why?: string }[] = [];
  let current: CategorizedAction[] = [];
  let why: string | undefined;

  for (const item of categorized) {
    const previous = current.at(-1);
    const boundary = previous ? boundaryReason(previous, item) : undefined;
    if (previous && boundary) {
      groups.push(why ? { items: current, why } : { items: current });
      current = [];
      why = boundary;
    }
    current.push(item);
  }
  if (current.length > 0) groups.push(why ? { items: current, why } : { items: current });

  return groups.map((group, index) => {
    const first = group.items[0]?.action;
    const last = group.items.at(-1)?.action;
    if (!first || !last) throw new Error("Cannot build an empty phase");
    const id = `p${index + 1}`;
    for (const item of group.items) item.action.phaseId = id;

    return {
      id,
      index: index + 1,
      name: phaseName(group.items),
      nameSource: "generic",
      ...(group.why ? { why: group.why } : {}),
      startedAt: first.ts,
      endedAt: last.ts,
      durationMs: durationMs(first.ts, last.ts),
      actionIds: group.items.map((item) => item.action.id),
      recordRange: [first.recordIndex, last.recordIndex],
    };
  });
}

function categorizeActions(actions: Action[]): CategorizedAction[] {
  let previous: PhaseCategory = "setup";
  return actions.map((action, index) => {
    const category = categoryFor(action, previous);
    previous = category;
    return { action, category };
  });
}

function categoryFor(action: Action, previous: PhaseCategory): PhaseCategory {
  if (action.mutates || action.kind === "mutate") return "synthesize";
  if (classifyVerificationCommand(action)) return "verify";
  if (action.kind === "search") return "research";
  if (action.kind === "read" || action.toolName === "Bash") return "context";
  if (action.kind === "report") return "report";
  if (action.toolName === "tool_result") return previous;
  return previous;
}

function boundaryReason(
  previous: CategorizedAction,
  current: CategorizedAction,
): string | undefined {
  const gap = durationMs(previous.action.ts, current.action.ts);
  if (gap >= 30_000) return `started after ${formatDuration(gap)} gap`;
  if (previous.category === current.category) return undefined;
  return `started by tool-kind transition: ${previous.category} -> ${current.category}`;
}

function phaseName(items: CategorizedAction[]): string {
  const counts = items.reduce<Record<PhaseCategory, number>>(
    (acc, item) => {
      acc[item.category] += 1;
      return acc;
    },
    { setup: 0, context: 0, research: 0, synthesize: 0, verify: 0, report: 0 },
  );
  const category = (Object.keys(counts) as PhaseCategory[]).sort(
    (a, b) => counts[b] - counts[a],
  )[0];
  if (category === "setup") return "Setup";
  if (category === "context") return "Local context";
  if (category === "research") return "Research";
  if (category === "synthesize") return "Synthesize";
  if (category === "verify") return "Verify";
  return "Report";
}

function durationMs(start: string, end: string): number {
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 0;
  return Math.max(0, endMs - startMs);
}

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
