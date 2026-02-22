import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as path from "path";

const GUI_SRC = path.resolve(__dirname, "..");

describe("no dead imports in GUI source", () => {
  it("has no core/ imports", () => {
    const result = execSync(
      `grep -rn "from ['\\"](core/|@continuedev/)" ${GUI_SRC} --include="*.ts" --include="*.tsx" || true`,
      { encoding: "utf-8" },
    );
    expect(result.trim()).toBe("");
  });

  it("has no redux imports", () => {
    const result = execSync(
      `grep -rn "from.*['\\"](react-redux|@reduxjs|redux-persist)" ${GUI_SRC} --include="*.ts" --include="*.tsx" || true`,
      { encoding: "utf-8" },
    );
    expect(result.trim()).toBe("");
  });

  it("has no imports from deleted directories", () => {
    const deletedDirs = ["context/IdeMessenger", "redux/", "components/"];
    for (const dir of deletedDirs) {
      const result = execSync(
        `grep -rn "from.*['\\"]\\..*${dir}" ${GUI_SRC} --include="*.ts" --include="*.tsx" || true`,
        { encoding: "utf-8" },
      );
      expect(result.trim(), `Found import from deleted: ${dir}`).toBe("");
    }
  });
});
