import type { Action, VerificationCheck } from "@aer/core";

type VerificationKind = VerificationCheck["kind"];
type AttemptOutcome = VerificationCheck["attempts"][number]["outcome"];

const commandPatterns: Array<{ kind: VerificationKind; pattern: RegExp }> = [
  {
    kind: "test",
    pattern:
      /(^|\s)(pnpm\s+test|npm\s+test|yarn\s+test|jest|vitest|pytest|cargo\s+test|go\s+test|mocha|rspec)\b/i,
  },
  {
    kind: "typecheck",
    pattern: /(^|\s)(tsc|pnpm\s+typecheck|npm\s+run\s+typecheck|mypy|pyright|pyre)\b/i,
  },
  {
    kind: "lint",
    pattern: /(^|\s)(eslint|biome\s+(check|lint)|ruff|pylint|clippy|golangci-lint|pnpm\s+lint)\b/i,
  },
  {
    kind: "build",
    pattern:
      /(^|\s)(pnpm\s+build|npm\s+run\s+build|yarn\s+build|cargo\s+build|tsc\s+-b|make|bazel\s+build)\b/i,
  },
  {
    kind: "format",
    pattern: /(^|\s)(prettier|biome\s+format|black|gofmt|rustfmt)\b/i,
  },
];

const failurePattern = /\b(fail(?:ed|ure|ing)?|error|errors|exception|panic)\b/i;
const successPattern = /\b(pass(?:ed|ing)?|success|successful|ok|0 errors?)\b/i;

export function buildVerification(actions: Action[]): VerificationCheck[] {
  const checks: VerificationCheck[] = [];
  let current: VerificationCheck | undefined;
  let lastVerificationActionIndex = -1;

  for (const [index, action] of actions.entries()) {
    const kind = classifyVerificationCommand(action);
    if (!kind) continue;

    const outcome = attemptOutcome(action);
    const canAppend =
      current?.kind === kind &&
      actions.slice(lastVerificationActionIndex + 1, index).every(isToolResultAction);

    if (!current || !canAppend) {
      current = {
        id: `v${checks.length + 1}`,
        kind,
        command: commandFor(action),
        outcome,
        attempts: [],
        finalActionId: action.id,
      };
      checks.push(current);
    }

    current.attempts.push({ actionId: action.id, outcome });
    current.finalActionId = action.id;
    current.outcome = checkOutcome(current.attempts);
    const detail = detailFor(action);
    if (detail) current.detail = detail;
    lastVerificationActionIndex = index;
  }

  return checks;
}

export function classifyVerificationCommand(action: Action): VerificationKind | undefined {
  if (action.toolName !== "Bash") return undefined;
  const command = commandFor(action);
  return commandPatterns.find((item) => item.pattern.test(command))?.kind;
}

function commandFor(action: Action): string {
  return action.target ?? action.inputSummary;
}

function attemptOutcome(action: Action): AttemptOutcome {
  if (action.errored) return "failed";
  const text = `${action.outputSummary ?? ""} ${action.inputSummary}`;
  if (failurePattern.test(text) && !successPattern.test(text)) return "failed";
  return "passed";
}

function checkOutcome(attempts: VerificationCheck["attempts"]): VerificationCheck["outcome"] {
  const final = attempts.at(-1)?.outcome ?? "failed";
  if (final === "failed") return "failed";
  return attempts.some((attempt) => attempt.outcome === "failed") ? "recovered" : "passed";
}

function detailFor(action: Action): string | undefined {
  const text = action.outputSummary ?? "";
  const passed = text.match(/\b(\d+)\s+passed\b/i);
  const failed = text.match(/\b(\d+)\s+failed\b/i);
  if (passed && failed) return `${passed[1]} passed, ${failed[1]} failed`;
  if (passed) return `${passed[1]} passed`;
  const errors = text.match(/\b(\d+)\s+errors?\b/i);
  if (errors) return `${errors[1]} errors`;
  return undefined;
}

function isToolResultAction(action: Action): boolean {
  return action.toolName === "tool_result";
}
