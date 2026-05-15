import { convert } from "@aer/adapter-claude-code";
import { parseAER } from "@aer/core";
import { renderHTML } from "./render.js";

const dropzone = document.querySelector<HTMLElement>("[data-dropzone]");
const fileInput = document.querySelector<HTMLInputElement>("[data-file-input]");
const output = document.querySelector<HTMLIFrameElement>("[data-output]");
const status = document.querySelector<HTMLElement>("[data-status]");
const exampleButton = document.querySelector<HTMLButtonElement>("[data-example]");
const exampleJsonl = [
  {
    type: "user",
    timestamp: "2026-01-01T00:00:00.000Z",
    sessionId: "browser-example",
    message: { role: "user", content: "Create a short launch note for AER." },
  },
  {
    type: "assistant",
    timestamp: "2026-01-01T00:00:01.000Z",
    sessionId: "browser-example",
    message: {
      role: "assistant",
      model: "claude-example",
      content: [
        {
          type: "tool_use",
          id: "toolu_write",
          name: "Write",
          input: {
            file_path: "launch-note.md",
            content: "# AER\n\nA deterministic viewer for agent execution records.\n",
          },
        },
      ],
    },
  },
  {
    type: "user",
    timestamp: "2026-01-01T00:00:02.000Z",
    sessionId: "browser-example",
    message: {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "toolu_write",
          content: "created launch-note.md",
          is_error: false,
        },
      ],
    },
  },
]
  .map((record) => JSON.stringify(record))
  .join("\n");

dropzone?.addEventListener("click", () => fileInput?.click());
dropzone?.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.dataset.active = "true";
});
dropzone?.addEventListener("dragleave", () => {
  delete dropzone.dataset.active;
});
dropzone?.addEventListener("drop", (event) => {
  event.preventDefault();
  delete dropzone.dataset.active;
  const file = event.dataTransfer?.files[0];
  if (file) void renderFile(file);
});
fileInput?.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) void renderFile(file);
});
exampleButton?.addEventListener("click", renderExample);

async function renderFile(file: File): Promise<void> {
  setStatus(`Reading ${file.name}...`);
  const text = await file.text();
  renderText(text, file.name);
}

function renderExample(): void {
  setStatus("Rendering example...");
  renderText(exampleJsonl, "browser-example.jsonl");
}

function renderText(text: string, name: string): void {
  try {
    const aer = name.endsWith(".aer.json")
      ? parseAER(JSON.parse(text))
      : convert(text, { rawPath: name });
    const html = renderHTML(aer);
    if (output) {
      output.srcdoc = html;
      output.hidden = false;
    }
    setStatus(`Rendered ${name}`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
}

function setStatus(message: string, isError = false): void {
  if (!status) return;
  status.textContent = message;
  status.dataset.error = isError ? "true" : "false";
}
