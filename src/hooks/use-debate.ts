"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type {
  DebateConfig,
  DebateMessage,
  DebateSide,
  DebateState,
  UseDebateReturn,
} from "@/features/debate";

/**
 * SSE stream reader for debate messages
 * Reads chunks from a ReadableStream and accumulates content
 */
async function readDebateSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (accumulated: string) => void,
): Promise<string> {
  const decoder = new TextDecoder();
  let accumulated = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const text = decoder.decode(value, { stream: true });
    const lines = text.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) {
        continue;
      }
      const data = line.slice(6);
      if (data === "[DONE]") {
        return accumulated;
      }
      try {
        const parsed = JSON.parse(data) as {
          content?: string;
          type?: string;
          message?: string;
        };
        if (parsed.type === "error") {
          toast.error(parsed.message ?? "Response may not have been saved");
          continue;
        }
        if (parsed.type === "done") {
          continue;
        }
        if (parsed.content) {
          accumulated += parsed.content;
          onChunk(accumulated);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  return accumulated;
}

/**
 * Creates a temporary debate message for optimistic UI updates
 */
function makeTempDebateMessage(
  side: DebateSide,
  role: "user" | "assistant",
  content: string,
): DebateMessage {
  return {
    id: `${side}-${role}-${Date.now()}`,
    side,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Hook for managing multi-user debate mode
 * Handles two parallel AI conversations with independent lens configs and auto-continue logic
 */
export function useDebate(): UseDebateReturn {
  const [state, setState] = useState<DebateState>({
    leftMessages: [],
    rightMessages: [],
    leftConfig: {
      side: "left",
      lensIds: [],
      label: "Perspective A",
    },
    rightConfig: {
      side: "right",
      lensIds: [],
      label: "Perspective B",
    },
    isLeftStreaming: false,
    isRightStreaming: false,
    leftStreamingContent: "",
    rightStreamingContent: "",
    autoContinue: {
      enabled: false,
      maxRounds: 3,
      currentRound: 0,
    },
    leftConversationId: null,
    rightConversationId: null,
  });

  const leftAbortControllerRef = useRef<AbortController | null>(null);
  const rightAbortControllerRef = useRef<AbortController | null>(null);

  /**
   * Send message to a single side of the debate
   * Handles streaming and message persistence
   */
  const sendSideMessage = useCallback(
    async (
      side: DebateSide,
      content: string,
    ): Promise<{ conversationId: string; response: string }> => {
      const config = side === "left" ? state.leftConfig : state.rightConfig;
      const conversationId = side === "left" ? state.leftConversationId : state.rightConversationId;
      const abortControllerRef = side === "left" ? leftAbortControllerRef : rightAbortControllerRef;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Set streaming state
      setState((prev) => ({
        ...prev,
        [`${side}Streaming`]: true,
        [`${side}StreamingContent`]: "",
      }));

      try {
        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            conversationId: conversationId ?? undefined,
            activeLensIds: config.lensIds,
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to send message to ${side} side`);
        }

        const newConversationId = res.headers.get("X-Conversation-Id");

        if (!newConversationId) {
          throw new Error(`No conversation ID returned for ${side} side`);
        }

        // Update conversation ID if this is the first message
        if (!conversationId && newConversationId) {
          setState((prev) => ({
            ...prev,
            [`${side}ConversationId`]: newConversationId,
          }));
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error("No reader");
        }

        // Read SSE stream
        const accumulated = await readDebateSSEStream(reader, (chunk) => {
          setState((prev) => ({
            ...prev,
            [`${side}StreamingContent`]: chunk,
          }));
        });

        // Clear streaming state and return
        setState((prev) => ({
          ...prev,
          [`${side}Streaming`]: false,
          [`${side}StreamingContent`]: "",
        }));

        abortControllerRef.current = null;

        return { conversationId: newConversationId, response: accumulated };
      } catch (error) {
        setState((prev) => ({
          ...prev,
          [`${side}Streaming`]: false,
          [`${side}StreamingContent`]: "",
        }));

        abortControllerRef.current = null;

        if (error instanceof DOMException && error.name === "AbortError") {
          throw error; // Re-throw to handle in caller
        }

        toast.error(`Failed to send message to ${side} side`);
        throw error;
      }
    },
    [state.leftConfig, state.rightConfig, state.leftConversationId, state.rightConversationId],
  );

  /**
   * Send message to both sides in parallel and handle auto-continue
   */
  const sendDebateMessage = useCallback(
    async (content: string) => {
      if (state.isLeftStreaming || state.isRightStreaming || !content.trim()) {
        return;
      }

      // Add user messages to both sides
      const leftUserMessage = makeTempDebateMessage("left", "user", content);
      const rightUserMessage = makeTempDebateMessage("right", "user", content);

      setState((prev) => ({
        ...prev,
        leftMessages: [...prev.leftMessages, leftUserMessage],
        rightMessages: [...prev.rightMessages, rightUserMessage],
        autoContinue: {
          ...prev.autoContinue,
          currentRound: prev.autoContinue.currentRound + 1,
        },
      }));

      try {
        // Fire both requests in parallel
        const [leftResult, rightResult] = await Promise.all([
          sendSideMessage("left", content),
          sendSideMessage("right", content),
        ]);

        // Add assistant messages to both sides
        const leftAssistantMessage = makeTempDebateMessage(
          "left",
          "assistant",
          leftResult.response,
        );
        const rightAssistantMessage = makeTempDebateMessage(
          "right",
          "assistant",
          rightResult.response,
        );

        setState((prev) => ({
          ...prev,
          leftMessages: [...prev.leftMessages, leftAssistantMessage],
          rightMessages: [...prev.rightMessages, rightAssistantMessage],
        }));

        // Check for auto-continue
        if (
          state.autoContinue.enabled &&
          state.autoContinue.currentRound < state.autoContinue.maxRounds
        ) {
          // Cross-feed: left's response becomes input to right, right's response becomes input to left
          const leftCrossFeedMessage = makeTempDebateMessage("left", "user", rightResult.response);
          const rightCrossFeedMessage = makeTempDebateMessage("right", "user", leftResult.response);

          setState((prev) => ({
            ...prev,
            leftMessages: [...prev.leftMessages, leftCrossFeedMessage],
            rightMessages: [...prev.rightMessages, rightCrossFeedMessage],
            autoContinue: {
              ...prev.autoContinue,
              currentRound: prev.autoContinue.currentRound + 1,
            },
          }));

          // Fire cross-fed requests in parallel
          const [leftCrossResult, rightCrossResult] = await Promise.all([
            sendSideMessage("left", rightResult.response),
            sendSideMessage("right", leftResult.response),
          ]);

          // Add cross-fed assistant messages
          const leftCrossAssistantMessage = makeTempDebateMessage(
            "left",
            "assistant",
            leftCrossResult.response,
          );
          const rightCrossAssistantMessage = makeTempDebateMessage(
            "right",
            "assistant",
            rightCrossResult.response,
          );

          setState((prev) => ({
            ...prev,
            leftMessages: [...prev.leftMessages, leftCrossAssistantMessage],
            rightMessages: [...prev.rightMessages, rightCrossAssistantMessage],
          }));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Intentional abort — no toast needed
          return;
        }
        // Error already toasted in sendSideMessage
      }
    },
    [
      state.isLeftStreaming,
      state.isRightStreaming,
      state.autoContinue.enabled,
      state.autoContinue.currentRound,
      state.autoContinue.maxRounds,
      sendSideMessage,
    ],
  );

  /**
   * Update configuration for one side of the debate
   */
  const updateSideConfig = useCallback(
    (side: DebateSide, config: Partial<Omit<DebateConfig, "side">>) => {
      setState((prev) => ({
        ...prev,
        [`${side}Config`]: {
          ...prev[`${side}Config`],
          ...config,
        },
      }));
    },
    [],
  );

  /**
   * Toggle auto-continue on/off
   */
  const toggleAutoContinue = useCallback(() => {
    setState((prev) => ({
      ...prev,
      autoContinue: {
        ...prev.autoContinue,
        enabled: !prev.autoContinue.enabled,
      },
    }));
  }, []);

  /**
   * Set maximum number of auto-continue rounds
   */
  const setMaxRounds = useCallback((n: number) => {
    setState((prev) => ({
      ...prev,
      autoContinue: {
        ...prev.autoContinue,
        maxRounds: n,
      },
    }));
  }, []);

  /**
   * Stop auto-continue and abort any in-flight requests
   */
  const stopAutoContinue = useCallback(() => {
    leftAbortControllerRef.current?.abort();
    rightAbortControllerRef.current?.abort();
    setState((prev) => ({
      ...prev,
      autoContinue: {
        ...prev.autoContinue,
        enabled: false,
      },
      isLeftStreaming: false,
      isRightStreaming: false,
      leftStreamingContent: "",
      rightStreamingContent: "",
    }));
  }, []);

  /**
   * Reset debate to initial state
   */
  const resetDebate = useCallback(() => {
    leftAbortControllerRef.current?.abort();
    rightAbortControllerRef.current?.abort();
    setState({
      leftMessages: [],
      rightMessages: [],
      leftConfig: {
        side: "left",
        lensIds: [],
        label: "Perspective A",
      },
      rightConfig: {
        side: "right",
        lensIds: [],
        label: "Perspective B",
      },
      isLeftStreaming: false,
      isRightStreaming: false,
      leftStreamingContent: "",
      rightStreamingContent: "",
      autoContinue: {
        enabled: false,
        maxRounds: 3,
        currentRound: 0,
      },
      leftConversationId: null,
      rightConversationId: null,
    });
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      leftAbortControllerRef.current?.abort();
      rightAbortControllerRef.current?.abort();
    };
  }, []);

  const isAnyStreaming = state.isLeftStreaming || state.isRightStreaming;

  return {
    state,
    sendDebateMessage,
    updateSideConfig,
    toggleAutoContinue,
    setMaxRounds,
    resetDebate,
    stopAutoContinue,
    isAnyStreaming,
  };
}
