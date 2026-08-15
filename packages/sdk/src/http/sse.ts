import type { ChatCompletionChunk } from "../types/chat";

/**
 * Parses Server-Sent Events (SSE) from a byte ReadableStream and yields ChatCompletionChunk objects.
 * Zero external dependencies — pure standard Web Streams & async iteration.
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncIterableIterator<ChatCompletionChunk> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);

      // Keep the last incomplete fragment in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines or SSE comment lines
        if (!trimmed || trimmed.startsWith(":")) {
          continue;
        }

        // Check for SSE data line
        if (trimmed.startsWith("data:")) {
          const dataContent = trimmed.slice(5).trim();

          // OpenAI standard stream termination signal
          if (dataContent === "[DONE]") {
            return;
          }

          try {
            const parsed = JSON.parse(dataContent) as ChatCompletionChunk;
            yield parsed;
          } catch {
            // If the chunk is not valid JSON, ignore and continue
          }
        }
      }
    }

    // Flush any remaining buffer text
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith("data:")) {
        const dataContent = trimmed.slice(5).trim();
        if (dataContent !== "[DONE]") {
          try {
            const parsed = JSON.parse(dataContent) as ChatCompletionChunk;
            yield parsed;
          } catch {
            // Ignore incomplete trailing fragment
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
