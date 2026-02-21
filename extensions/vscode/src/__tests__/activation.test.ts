import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const PKG_PATH = path.resolve(__dirname, "../../package.json");
const pkg = JSON.parse(fs.readFileSync(PKG_PATH, "utf-8"));

describe("package.json manifest", () => {
  it("has correct extension name", () => {
    expect(pkg.name).toBe("deepdive");
  });

  it("has correct publisher", () => {
    expect(pkg.publisher).toBe("netbrah");
  });

  it("has no core dependency", () => {
    expect(pkg.dependencies?.core).toBeUndefined();
    expect(pkg.dependencies?.["@continuedev/config-types"]).toBeUndefined();
    expect(pkg.dependencies?.["@continuedev/fetch"]).toBeUndefined();
  });

  it("has sidebar view declared", () => {
    const views = pkg.contributes?.views;
    const viewKeys = Object.keys(views || {});
    expect(viewKeys.length).toBeGreaterThan(0);
    // Find the view with our chatView ID
    const allViews = viewKeys.flatMap((k: string) => views[k]);
    const chatView = allViews.find(
      (v: any) => v.id?.includes("chatView") || v.id?.includes("deepdive"),
    );
    expect(chatView).toBeDefined();
    expect(chatView.type).toBe("webview");
  });

  it("has matching activitybar container", () => {
    const containers = pkg.contributes?.viewsContainers?.activitybar;
    expect(containers?.length).toBeGreaterThan(0);
    const containerId = containers[0].id;
    // The container ID must be a key in contributes.views
    expect(pkg.contributes.views[containerId]).toBeDefined();
  });

  it("activation events reference correct view ID", () => {
    const events = pkg.activationEvents || [];
    const viewEvent = events.find((e: string) => e.startsWith("onView:"));
    if (viewEvent) {
      const viewId = viewEvent.replace("onView:", "");
      const allViews = Object.values(pkg.contributes.views || {}).flat() as any[];
      const match = allViews.find((v: any) => v.id === viewId);
      expect(match).toBeDefined();
    }
  });

  it("every command in menus exists in commands", () => {
    const declaredCommands = (pkg.contributes?.commands || []).map(
      (c: any) => c.command,
    );
    const menuRefs = Object.values(pkg.contributes?.menus || {})
      .flat()
      .map((m: any) => m.command)
      .filter(Boolean);
    for (const ref of menuRefs) {
      expect(declaredCommands).toContain(ref);
    }
  });

  it("every keybinding command exists in commands or is a built-in workbench command", () => {
    const declaredCommands = (pkg.contributes?.commands || []).map(
      (c: any) => c.command,
    );
    const kbCommands = (pkg.contributes?.keybindings || []).map(
      (k: any) => k.command,
    );
    for (const cmd of kbCommands) {
      // Built-in workbench commands don't need to be declared
      if (cmd.startsWith("workbench.")) {
        continue;
      }
      expect(declaredCommands).toContain(cmd);
    }
  });
});
