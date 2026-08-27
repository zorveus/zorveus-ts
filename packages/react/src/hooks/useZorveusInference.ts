import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage, ZorveusMetadata } from "@zorveus/sdk";
import { useZorveusContext } from "../context/ZorveusContext";

export interface UseZorveusInferenceOptions {
  model: string;
  systemPrompt?: string;
  initialMessages?: ChatMessage[];
  temperature?: number;
  zorveusMetadata?: ZorveusMetadata;
}

export interface UseZorveusInferenceResult {
  messages: ChatMessage[];
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  submitPrompt: (customPrompt?: string) => Promise<void>;
  isStreaming: boolean;
  error: Error | null;
  abort: () => void;
  clearMessages: () => void;
}

export function useZorveusInference(options: UseZorveusInferenceOptions): UseZorveusInferenceResult {
  const { client } = useZorveusContext();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initial: ChatMessage[] = [];
    if (options.systemPrompt) {
      initial.push({ role: "system", content: options.systemPrompt });
    }
    if (options.initialMessages) {
      initial.push(...options.initialMessages);
    }
    return initial;
  });

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (isMountedRef.current) {
      setIsStreaming(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const clearMessages = useCallback(() => {
    abort();
    const reset: ChatMessage[] = [];
    if (options.systemPrompt) {
      reset.push({ role: "system", content: options.systemPrompt });
    }
    if (options.initialMessages) {
      reset.push(...options.initialMessages);
    }
    setMessages(reset);
    setError(null);
  }, [abort, options.systemPrompt, options.initialMessages]);

  const submitPrompt = useCallback(
    async (customPrompt?: string) => {
      const promptText = (customPrompt !== undefined ? customPrompt : input).trim();
      if (!promptText) {
        return;
      }

      if (!client) {
        const err = new Error(
          "Zorveus client is not initialized. Ensure 'inferenceKey' is provided to <ZorveusProvider> or connect via OAuth."
        );
        setError(err);
        return;
      }

      // Clear input and clear previous errors
      setInput("");
      setError(null);
      setIsStreaming(true);

      const userMessage: ChatMessage = { role: "user", content: promptText };
      const currentMessages = [...messages, userMessage];

      // Optimistically add user message and an empty assistant message
      setMessages([...currentMessages, { role: "assistant", content: "" }]);

      abortControllerRef.current = new AbortController();
      let assistantContent = "";

      try {
        const stream = await client.chat.completions.create(
          {
            model: options.model,
            messages: currentMessages,
            temperature: options.temperature,
            stream: true,
            zorveusMetadata: options.zorveusMetadata
          },
          { signal: abortControllerRef.current.signal }
        );

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || "";
          if (delta) {
            assistantContent += delta;
            if (isMountedRef.current) {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (lastIdx >= 0 && updated[lastIdx]?.role === "assistant") {
                  updated[lastIdx] = { role: "assistant", content: assistantContent };
                }
                return updated;
              });
            }
          }
        }
      } catch (err) {
        const isAborted = err instanceof Error && err.name === "AbortError";
        if (isMountedRef.current) {
          if (!isAborted) {
            const finalErr = err instanceof Error ? err : new Error(String(err));
            setError(finalErr);
          }
          if (!assistantContent) {
            // Remove empty assistant placeholder if no content was streamed
            setMessages((prev) => prev.filter((m, idx) => !(idx === prev.length - 1 && m.role === "assistant" && !m.content)));
          }
        }
      } finally {
        if (isMountedRef.current) {
          setIsStreaming(false);
        }
        abortControllerRef.current = null;
      }
    },
    [client, input, messages, options.model, options.temperature, options.zorveusMetadata]
  );

  return {
    messages,
    input,
    setInput,
    submitPrompt,
    isStreaming,
    error,
    abort,
    clearMessages
  };
}
