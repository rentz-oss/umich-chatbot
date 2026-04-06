"use client";

import { FormEvent, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const UI_COPY = {
  title: "Higher Ed and Financial Aid Resource Guide for Foster Youth",
  inputPlaceholder: "Type your question…",
  send: "Send",
  thinking: "Thinking…",
  disclaimer:
    "This tool does not provide legal advice. Please verify outputs and consult official sources when making important decisions.",
  starterMessage:
    "Hi! Ask me anything about applying to higher education programs and scholarships designed for foster care youth in Michigan."
};

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: UI_COPY.starterMessage
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
    <main className="page">
      <header className="header">
        <div className="brand">
          <div className="logo" aria-hidden="true" />
          <div className="brand-text">
            <h1>{UI_COPY.title}</h1>
          </div>
        </div>
      </header>

      <section className="chat-shell" aria-label="Chat">
        <div className="messages" role="log" aria-live="polite">
          {messages.map((msg, idx) => (
            <article key={`${msg.role}-${idx}`} className={`bubble ${msg.role}`}>
              <div className="bubble-text">{msg.text}</div>
            </article>
          ))}
        </div>

        <form className="composer" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="chat-input">
            Message
          </label>
          <textarea
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={UI_COPY.inputPlaceholder}
          />
          <button type="submit" disabled={loading}>
            {loading ? UI_COPY.thinking : UI_COPY.send}
          </button>
        </form>

        <footer className="footer-hint">{UI_COPY.disclaimer}</footer>
      </section>
    </main>
  );
}
