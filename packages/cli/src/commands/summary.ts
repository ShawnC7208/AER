import { errorMessage, fail, loadAER } from "./shared.js";

export function runSummary(input: string): void {
  let aer: ReturnType<typeof loadAER>;
  try {
    aer = loadAER(input);
  } catch (err) {
    fail(errorMessage(err));
  }
  const title = cleanupTitle(aer.run.trigger?.replace(/^scheduled-task:/, "") ?? aer.run.goal);
  const lines = [
    `AER Summary: ${title}`,
    `Run: ${aer.run.id}`,
    `Outcome: ${aer.run.outcome}`,
    `Duration: ${formatDuration(aer.costs.durationMs)}`,
    `Phases: ${aer.phases.length}`,
    `Tool calls: ${aer.costs.toolCalls}`,
    `Errors: ${aer.costs.errors}`,
    `Verification: ${aer.verification.length}`,
    `Mutations: ${aer.mutations.length}`,
    `Files touched: ${aer.filesTouched.length}`,
  ];

  if (aer.mutations.length > 0) {
    lines.push("", "Mutations:");
    for (const mutation of aer.mutations) {
      const stats = mutation.diffStats
        ? ` (+${mutation.diffStats.added} -${mutation.diffStats.removed})`
        : "";
      lines.push(`- ${mutation.kind} ${mutation.target}${stats}`);
    }
  }

  if (aer.filesTouched.length > 0) {
    lines.push("", "Files touched:");
    for (const file of aer.filesTouched) {
      lines.push(`- ${file.status} ${file.path} (+${file.linesAdded} -${file.linesRemoved})`);
    }
  }

  process.stdout.write(`${lines.join("\n")}\n`);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

function cleanupTitle(value: string): string {
  return value.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() || "AER run";
}
