import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ZorveusProvider, useZorveusInference } from "../src/index";

function ChatBox() {
  const { messages, input, setInput, submitPrompt, isStreaming } = useZorveusInference({
    model: "openai/gpt-4o"
  });

  return (
    <div>
      <div data-testid="message-list">
        {messages.map((m, i) => (
          <div key={i} data-testid={`msg-${m.role}`}>
            {m.content}
          </div>
        ))}
      </div>
      <input
        data-testid="chat-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        data-testid="send-btn"
        disabled={isStreaming}
        onClick={() => void submitPrompt()}
      >
        Send
      </button>
    </div>
  );
}

describe("useZorveusInference", () => {
  it("streams chat completion chunks into state", async () => {
    const sseChunks = [
      'data: {"id":"1","object":"chat.completion.chunk","created":1,"model":"openai/gpt-4o","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
      'data: {"id":"1","object":"chat.completion.chunk","created":1,"model":"openai/gpt-4o","choices":[{"index":0,"delta":{"content":" there!"},"finish_reason":null}]}\n\n',
      'data: [DONE]\n\n'
    ].join("");

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(sseChunks));
        controller.close();
      }
    });

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" }
      })
    );

    globalThis.fetch = mockFetch as typeof globalThis.fetch;

    render(
      <ZorveusProvider inferenceKey="zrv_live_key">
        <ChatBox />
      </ZorveusProvider>
    );

    const input = screen.getByTestId("chat-input");
    const button = screen.getByTestId("send-btn");

    fireEvent.change(input, { target: { value: "Hi bot" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId("msg-user").textContent).toBe("Hi bot");
      expect(screen.getByTestId("msg-assistant").textContent).toBe("Hello there!");
    });
  });
});
