import { Command } from "commander";
import { runConvert } from "./commands/convert.js";
import { runSummary } from "./commands/summary.js";
import { runValidate } from "./commands/validate.js";
import { runView } from "./commands/view.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("aer")
    .description("Convert agent logs into auditable Agent Execution Records.")
    .version("0.4.0");

  program
    .command("convert")
    .argument("<input.jsonl|directory>", "Claude Code JSONL file or directory of JSONL files")
    .option(
      "-o, --output <output>",
      "write AER JSON to a file, or to a directory when input is a directory",
    )
    .option("--with-disk", "read files from disk when the trace lacks before content")
    .action((input: string, options: { output?: string; withDisk?: boolean }) => {
      runConvert(input, {
        ...(options.output ? { output: options.output } : {}),
        ...(options.withDisk ? { withDisk: true } : {}),
      });
    });

  program
    .command("view")
    .argument("<input>", "Claude Code JSONL or AER JSON file")
    .option("-o, --output <output.html>", "write rendered HTML to a file")
    .option("--open", "open the rendered HTML in the system browser")
    .option("--watch", "re-render when the input file changes")
    .action((input: string, options: { output?: string; open?: boolean; watch?: boolean }) => {
      runView(input, {
        ...(options.output ? { output: options.output } : {}),
        ...(options.open ? { open: true } : {}),
        ...(options.watch ? { watch: true } : {}),
      });
    });

  program
    .command("summary")
    .argument("<input>", "Claude Code JSONL or AER JSON file")
    .description("Print a deterministic one-screen AER summary.")
    .action((input: string) => {
      runSummary(input);
    });

  program
    .command("validate")
    .argument("<input.aer.json>", "AER JSON file")
    .description("Validate an AER JSON file against the v1 schema.")
    .action((input: string) => {
      runValidate(input);
    });

  return program;
}
