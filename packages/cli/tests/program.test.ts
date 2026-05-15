import { describe, expect, it } from "vitest";
import { createProgram } from "../src/program.js";

describe("@aer/cli program", () => {
  it("lists the Phase 3 commands in help output", () => {
    const help = createProgram().helpInformation();

    expect(help).toContain("convert");
    expect(help).toContain("view");
    expect(help).toContain("summary");
    expect(help).toContain("validate");
  });
});
