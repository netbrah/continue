import * as vscode from "vscode";
import { getExtensionVersion, getvsCodeUriScheme } from "./util/util";
import { getNonce, getExtensionUri, getUniqueId } from "./util/vscode";

export type ExtensionMessage =
  | { type: "chatResponse"; data: { messageId: string; content: string; done: boolean } }
  | { type: "clearChat" };

export type WebviewMessage =
  | { type: "sendMessage"; data: { text: string } }
  | { type: "newSession" };

export class DeepDiveSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "deepdive.chatView";

  private _webview?: vscode.Webview;
  private _webviewView?: vscode.WebviewView;

  get webview() {
    return this._webview;
  }

  get isVisible() {
    return this._webviewView?.visible;
  }

  constructor(private readonly extensionContext: vscode.ExtensionContext) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void | Thenable<void> {
    this._webviewView = webviewView;
    this._webview = webviewView.webview;
    webviewView.webview.html = this.getSidebarContent(webviewView);

    webviewView.webview.onDidReceiveMessage((msg: WebviewMessage) => {
      switch (msg.type) {
        case "sendMessage":
          // TODO: wire to backend
          console.log("[DeepDive] sendMessage:", msg.data.text);
          break;
        case "newSession":
          // TODO: wire to backend
          console.log("[DeepDive] newSession");
          break;
      }
    });
  }

  postMessage(message: ExtensionMessage): void {
    this._webview?.postMessage(message);
  }

  getSidebarContent(panel: vscode.WebviewPanel | vscode.WebviewView): string {
    const extensionUri = getExtensionUri();

    const inDevelopmentMode =
      this.extensionContext.extensionMode === vscode.ExtensionMode.Development;

    let scriptUri: string;
    let styleMainUri: string;

    if (inDevelopmentMode) {
      scriptUri = "http://localhost:5173/src/main.tsx";
      styleMainUri = "http://localhost:5173/src/index.css";
    } else {
      scriptUri = panel.webview
        .asWebviewUri(vscode.Uri.joinPath(extensionUri, "gui/assets/index.js"))
        .toString();
      styleMainUri = panel.webview
        .asWebviewUri(vscode.Uri.joinPath(extensionUri, "gui/assets/index.css"))
        .toString();
    }

    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(extensionUri, "gui"),
        vscode.Uri.joinPath(extensionUri, "assets"),
      ],
      enableCommandUris: true,
    };

    const nonce = getNonce();
    const vscMediaUrl = panel.webview
      .asWebviewUri(vscode.Uri.joinPath(extensionUri, "gui"))
      .toString();

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>const vscode = acquireVsCodeApi();</script>
        <link href="${styleMainUri}" rel="stylesheet">
        <title>DeepDive</title>
      </head>
      <body>
        <div id="root"></div>
        ${
          inDevelopmentMode
            ? `<script type="module">
          import RefreshRuntime from "http://localhost:5173/@react-refresh"
          RefreshRuntime.injectIntoGlobalHook(window)
          window.$RefreshReg$ = () => {}
          window.$RefreshSig$ = () => (type) => type
          window.__vite_plugin_react_preamble_installed__ = true
          </script>`
            : ""
        }
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        <script>localStorage.setItem("ide", '"vscode"')</script>
        <script>localStorage.setItem("vsCodeUriScheme", '"${getvsCodeUriScheme()}"')</script>
        <script>localStorage.setItem("extensionVersion", '"${getExtensionVersion()}"')</script>
        <script>window.vscMachineId = "${getUniqueId()}"</script>
        <script>window.vscMediaUrl = "${vscMediaUrl}"</script>
        <script>window.ide = "vscode"</script>
        <script>window.workspacePaths = ${JSON.stringify(
          vscode.workspace.workspaceFolders?.map((folder) =>
            folder.uri.toString(),
          ) || [],
        )}</script>
      </body>
    </html>`;
  }
}
