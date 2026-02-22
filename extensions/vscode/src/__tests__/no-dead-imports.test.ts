import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as path from "path";

const SRC_DIR = path.resolve(__dirname, "..");

describe("no dead imports in extension source", () => {
  it("has no core/ imports", () => {
    const result = execSync(
      `grep -rn "from ['\\"](core/|@continuedev/)" ${SRC_DIR} --include="*.ts" || true`,
      { encoding: "utf-8" },
    );
    expect(result.trim()).toBe("");
  });

  it("has no imports from deleted directories", () => {
    const deletedDirs = [
      "autocomplete",
      "apply",
      "diff",
      "debug",
      "quickEdit",
      "terminal",
      "lang-server",
      "stubs",
      "otherExtensions",
    ];
    for (const dir of deletedDirs) {
      const result = execSync(
        `grep -rn "from.*['\\"]\\..*/${dir}/" ${SRC_DIR} --include="*.ts" || true`,
        { encoding: "utf-8" },
      );
      expect(result.trim(), `Found import from deleted dir: ${dir}`).toBe("");
    }
  });
});
