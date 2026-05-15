import { parseAER } from "@aer/core";
import { errorMessage, fail, readTextFile } from "./shared.js";

export function runValidate(input: string): void {
  try {
    parseAER(JSON.parse(readTextFile(input)));
  } catch (err) {
    if (isSchemaError(err)) {
      process.stderr.write(`aer: validation failed for '${input}'\n`);
      for (const issue of err.issues) {
        const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
        process.stderr.write(`- ${path}: ${issue.message}\n`);
      }
      process.exit(1);
    }
    fail(`validation failed for '${input}': ${errorMessage(err)}`);
  }

  process.stdout.write(`Valid AER: ${input}\n`);
}

interface SchemaIssue {
  path: Array<string | number>;
  message: string;
}

interface SchemaError {
  issues: SchemaIssue[];
}

function isSchemaError(err: unknown): err is SchemaError {
  return (
    typeof err === "object" &&
    err !== null &&
    "issues" in err &&
    Array.isArray((err as { issues?: unknown }).issues)
  );
}
