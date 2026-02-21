import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void;
};

const vscode =
  typeof acquireVsCodeApi !== "undefined" ? acquireVsCodeApi() : null;

export default function ChatShell() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (msg?.type === "chatResponse") {
        // TODO: wire chatbot response handler here
        const { messageId, content } = msg.data;
        setMessages((prev) => {
          const existing = prev.find((m) => m.id === messageId);
          if (existing) {
            return prev.map((m) =>
              m.id === messageId ? { ...m, content: m.content + content } : m,
            );
          }
          return [...prev, { id: messageId, role: "assistant", content }];
        });
      } else if (msg?.type === "clearChat") {
        setMessages([]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { id, role: "user", content: text }]);
    setInput("");
    vscode?.postMessage({ type: "sendMessage", data: { text } });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--vscode-sideBar-background)] text-[var(--vscode-sideBar-foreground)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-[var(--vscode-descriptionForeground)] mt-8 text-sm">
            🔬 DeepDive ready. No backend connected yet.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg px-3 py-2 text-sm max-w-full break-words ${
                msg.role === "user"
                  ? "bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] ml-4"
                  : "bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)] mr-4"
              }`}
            >
              <div className="text-xs font-semibold mb-1 opacity-70">
                {msg.role === "user" ? "You" : "DeepDive"}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--vscode-panel-border)] p-2 flex gap-2">
        <textarea
          className="flex-1 resize-none bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded px-2 py-1 text-sm focus:outline-none focus:border-[var(--vscode-focusBorder)] placeholder-[var(--vscode-input-placeholderForeground)]"
          rows={2}
          placeholder="Ask DeepDive anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)] rounded px-3 py-1 text-sm font-medium self-end disabled:opacity-50"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
