import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("VS Code theme integration", () => {
  it("tailwind config exists and references theme", () => {
    const configPath = path.resolve(__dirname, "../../tailwind.config.cjs");
    expect(fs.existsSync(configPath)).toBe(true);
    const content = fs.readFileSync(configPath, "utf-8");
    expect(content).toContain("varWithFallback");
  });

  it("theme file exists with required exports", () => {
    // Check both .js, .cjs, and .ts extensions
    const themePaths = [
      path.resolve(__dirname, "../styles/theme.js"),
      path.resolve(__dirname, "../styles/theme.cjs"),
      path.resolve(__dirname, "../styles/theme.ts"),
    ];
    const exists = themePaths.some((p) => fs.existsSync(p));
    expect(exists).toBe(true);

    const themeFile = themePaths.find((p) => fs.existsSync(p))!;
    const content = fs.readFileSync(themeFile, "utf-8");
    expect(content).toContain("varWithFallback");
    expect(content).toContain("THEME_COLORS");
  });

  it("index.css has VS Code CSS variable references", () => {
    const cssPath = path.resolve(__dirname, "../index.css");
    const content = fs.readFileSync(cssPath, "utf-8");
    expect(content).toContain("--vscode-editor-background");
    expect(content).toContain("@tailwind");
  });
});
