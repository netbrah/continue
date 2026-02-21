import { v4 as uuidv4 } from "uuid";
import * as vscode from "vscode";

export type FromWebviewProtocol = {
  sendMessage: [{ text: string }, void];
  newSession: [undefined, void];
};

export type ToWebviewProtocol = {
  chatResponse: [{ messageId: string; content: string; done: boolean }, void];
  clearChat: [undefined, void];
};

export type Message<T = any> = {
  messageType: string;
  messageId: string;
  data: T;
};

export class DeepDiveWebviewProtocol {
  private listeners = new Map<string, ((message: Message) => any)[]>();

  _webview?: vscode.Webview;
  _webviewListener?: vscode.Disposable;

  get webview(): vscode.Webview | undefined {
    return this._webview;
  }

  set webview(webView: vscode.Webview) {
    this._webview = webView;
    this._webviewListener?.dispose();

    const handleMessage = async (msg: Message) => {
      const handlers = this.listeners.get(msg.messageType);
      if (handlers) {
        for (const handler of handlers) {
          try {
            await handler(msg);
          } catch (e) {
            console.error("[DeepDive] Error in webview handler:", e);
          }
        }
      }
    };

    this._webviewListener = this._webview.onDidReceiveMessage(handleMessage);
  }

  send(messageType: string, data: any, messageId?: string): string {
    const id = messageId ?? uuidv4();
    this.webview?.postMessage({ messageType, data, messageId: id });
    return id;
  }

  on<T extends keyof FromWebviewProtocol>(
    messageType: T,
    handler: (message: Message<FromWebviewProtocol[T][0]>) => any,
  ): void {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, []);
    }
    this.listeners.get(messageType)?.push(handler);
  }

  request<T extends keyof ToWebviewProtocol>(
    messageType: T,
    data: ToWebviewProtocol[T][0],
  ): Promise<ToWebviewProtocol[T][1]> {
    const messageId = uuidv4();
    return new Promise(async (resolve) => {
      let i = 0;
      while (!this.webview) {
        if (i >= 10) {
          resolve(undefined as any);
          return;
        }
        await new Promise((res) => setTimeout(res, i >= 5 ? 1000 : 500));
        i++;
      }
      this.send(messageType, data, messageId);
      const disposable = this.webview.onDidReceiveMessage(
        (msg: Message<ToWebviewProtocol[T][1]>) => {
          if (msg.messageId === messageId) {
            resolve(msg.data);
            disposable?.dispose();
          }
        },
      );
    });
  }
}
