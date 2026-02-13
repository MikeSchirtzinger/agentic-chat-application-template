"use client";

import { Bot } from "lucide-react";
import { useEffect, useRef } from "react";

import { MessageBubble } from "@/components/chat/message-bubble";
import { Badge } from "@/components/ui/badge";
import type { DebateConfig, DebateMessage, DebateSide } from "@/features/debate/types";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { cn } from "@/lib/utils";

interface DebatePanelProps {
  side: DebateSide;
  messages: DebateMessage[];
  streamingContent: string;
  isStreaming: boolean;
  config: DebateConfig;
  isActive?: boolean;
  onActivate?: () => void;
}

export function DebatePanel({
  side,
  messages,
  streamingContent,
  isStreaming,
  config,
  isActive = false,
  onActivate,
}: DebatePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollToBottom, isScrolledToBottom } = useAutoScroll(containerRef);
  const prevMessageCountRef = useRef(messages.length);

  // Auto-scroll when new messages are added
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  // Auto-scroll during streaming when user hasn't scrolled up
  useEffect(() => {
    if (isScrolledToBottom()) {
      const el = containerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  });

  return (
    <button
      type="button"
      aria-label={`${side === "left" ? "Left" : "Right"} debate panel`}
      className={cn(
        "flex flex-1 flex-col border-l-2 transition-all cursor-pointer text-left",
        side === "left" ? "border-blue-500/20" : "border-amber-500/20",
        isActive && side === "left" && "border-blue-500 bg-blue-500/5",
        isActive && side === "right" && "border-amber-500 bg-amber-500/5",
      )}
      onClick={onActivate}
    >
      <div
        className={cn(
          "border-b border-border/50 px-4 py-3",
          side === "left" ? "bg-blue-500/5" : "bg-amber-500/5",
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{config.label}</h2>
          {config.lensIds.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {config.lensIds.length} {config.lensIds.length === 1 ? "lens" : "lenses"}
            </Badge>
          )}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl py-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} role={message.role} content={message.content} />
          ))}
          {isStreaming && streamingContent && (
            <div className="flex gap-3 px-4 py-3">
              <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                <Bot className="text-muted-foreground size-4" />
              </div>
              <div className="bg-muted text-foreground max-w-[80%] rounded-2xl px-4 py-2.5">
                <p className="text-sm whitespace-pre-wrap">
                  {streamingContent}
                  <span className="streaming-cursor ml-0.5 inline-block h-4 w-1.5 align-middle" />
                </p>
              </div>
            </div>
          )}
          {isStreaming && !streamingContent && (
            <div className="flex gap-3 px-4 py-3">
              <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                <Bot className="text-muted-foreground size-4" />
              </div>
              <div className="bg-muted max-w-[80%] rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-1">
                  <span className="bg-primary/60 size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
                  <span className="bg-primary/60 size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
                  <span className="bg-primary/60 size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
