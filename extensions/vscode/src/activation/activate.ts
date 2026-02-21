import * as vscode from "vscode";
import { DeepDiveSidebarProvider } from "../DeepDiveSidebarProvider";

export async function activateExtension(context: vscode.ExtensionContext) {
  const provider = new DeepDiveSidebarProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      DeepDiveSidebarProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("deepdive.newSession", () => {
      provider.postMessage({ type: "clearChat" });
      vscode.commands.executeCommand(
        "workbench.view.extension.deepdive",
      );
    }),
  );
}
