"use client";

import { FormEvent, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Ask me anything about University of Michigan from the files loaded into this chatbot. I only answer from those files."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            error instanceof Error
              ? `Error: ${error.message}`
              : "The chatbot hit an unexpected error."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>UMich Foster Youth Chatbot (Files-Only)</h1>
      <p>
        This pilot only uses your local files. If the answer is not found in those files, it will
        say it does not know.
      </p>

      <section className="chat-shell">
        <div className="messages">
          {messages.map((msg, idx) => (
            <article key={`${msg.role}-${idx}`} className={`bubble ${msg.role}`}>
              <div>{msg.text}</div>
            </article>
          ))}
        </div>

        <form onSubmit={onSubmit}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a UMich question..."
          />
          <button type="submit" disabled={loading}>
            {loading ? "Thinking..." : "Send"}
          </button>
        </form>
      </section>
    </main>
  );
}
